import { supabase } from '../lib/supabase';
import { ChatMessage, ChatMatch, TypingStatus } from '../lib/supabase';
import { CompatibleEncryptionService } from './compatibleEncryption';
import { dataCache, CACHE_NAMESPACES, CACHE_TTL } from './dataCache';
import { sendPushNotification } from './notifications';

export class ChatService {
  // Get all matches for the current user
  static async getMatches(userId: string): Promise<ChatMatch[]> {
    try {
      console.log('🔍 Fetching matches for user:', userId);
      
      // First get the matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('matched_at', { ascending: false });

      if (matchesError) {
        console.error('❌ Error fetching matches:', matchesError);
        throw matchesError;
      }

      if (!matches || matches.length === 0) {
        console.log('✅ No matches found for user');
        return [];
      }

      // Get user IDs from matches
      const userIds = new Set();
      matches.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });

      // Fetch user details (only completed profiles for defensive security)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          school_id,
          schools (school_name)
        `)
        .in('id', Array.from(userIds))
        .eq('profile_completed', true)
        .eq('status', 'active');

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        throw usersError;
      }

      // Fetch photos from storage buckets
      const photos = await this.getUserPhotosFromStorage(Array.from(userIds));

      // Create a users map for easy lookup
      const usersMap = new Map();
      users?.forEach(user => {
        usersMap.set(user.id, user);
      });

      // Create a photos map for easy lookup
      const photosMap = new Map();
      photos?.forEach(photo => {
        if (!photosMap.has(photo.user_id)) {
          photosMap.set(photo.user_id, []);
        }
        photosMap.get(photo.user_id).push(photo);
      });

      // Transform matches with user data
      const matchesWithUsers = matches.map(match => ({
        ...match,
        user1: usersMap.get(match.user1_id),
        user2: usersMap.get(match.user2_id)
      }));

      console.log('✅ Found matches:', matchesWithUsers?.length || 0);

      // Transform the data to get the other user's info
      const transformedMatches: ChatMatch[] = matchesWithUsers?.map(match => {
        const isUser1 = match.user1_id === userId;
        const otherUser = isUser1 ? match.user2 : match.user1;

        return {
          id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          matched_at: match.matched_at,
          created_at: match.created_at,
          other_user: {
            id: otherUser?.id || 'unknown',
            first_name: otherUser?.first_name || 'Unknown',
            username: otherUser?.username || 'user',
            school_id: otherUser?.school_id,
            school_name: otherUser?.schools?.school_name || 'Unknown',
            photos: photosMap.get(otherUser?.id) || []
          },
          last_message: undefined, // We'll fetch this separately
          unread_count: 0 // We'll calculate this separately
        };
      }) || [];

      // OPTIMIZATION: Batch fetch all last messages and unread counts in parallel
      const matchIds = transformedMatches.map(m => m.id);

      // Fetch last messages for all matches in parallel
      const lastMessagesPromises = matchIds.map(matchId =>
        supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: false })
          .limit(1)
      );

      // Fetch unread counts for all matches in parallel
      const unreadCountsPromises = matchIds.map(matchId =>
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', matchId)
          .eq('is_read', false)
          .neq('sender_id', userId)
      );

      // Execute all queries in parallel
      const [lastMessagesResults, unreadCountsResults] = await Promise.all([
        Promise.all(lastMessagesPromises),
        Promise.all(unreadCountsPromises)
      ]);

      // Process results
      for (let i = 0; i < transformedMatches.length; i++) {
        const match = transformedMatches[i];
        const { data: lastMessage } = lastMessagesResults[i];
        const { count: unreadCount } = unreadCountsResults[i];

        // Set unread count
        match.unread_count = unreadCount || 0;

        // Process last message
        if (lastMessage && lastMessage.length > 0) {
          // Decrypt the last message content
          let decryptedContent = lastMessage[0].content;
          try {
            // Check if this is a compatible-encrypted message
            if (CompatibleEncryptionService.isEncryptedByThisService(lastMessage[0].content)) {
              try {
                decryptedContent = CompatibleEncryptionService.decryptMessage(
                  lastMessage[0].content,
                  match.user1_id,
                  match.user2_id
                );
              } catch (compatibleError) {
                console.warn('⚠️ Compatible decryption failed for preview, trying simple decryption:', compatibleError);
                // Fallback to simple decryption
                try {
                  const { SimpleEncryptionService } = await import('./simpleEncryption');
                  decryptedContent = SimpleEncryptionService.decryptMessage(
                    lastMessage[0].content,
                    match.user1_id,
                    match.user2_id
                  );
                } catch (fallbackError) {
                  console.error('❌ Fallback decryption also failed for preview:', fallbackError);
                  decryptedContent = '[Encrypted Message]';
                }
              }
            } else {
              // Handle legacy messages (fallback to simple decryption)
              console.log('⚠️ Legacy message detected in preview, attempting simple decryption');
              try {
                // Import simple encryption for legacy support
                const { SimpleEncryptionService } = await import('./simpleEncryption');
                decryptedContent = SimpleEncryptionService.decryptMessage(
                  lastMessage[0].content,
                  match.user1_id,
                  match.user2_id
                );
              } catch (legacyError) {
                console.error('❌ Legacy decryption failed for preview:', legacyError);
                decryptedContent = '[Legacy Encrypted Message]';
              }
            }
          } catch (decryptError) {
            console.error('❌ Error decrypting message preview:', decryptError);
            // If decryption fails, show encrypted content (for debugging)
            decryptedContent = '[Encrypted Message]';
          }

          match.last_message = {
            ...lastMessage[0],
            content: decryptedContent, // Use decrypted content
            sender_name: lastMessage[0].sender_id === userId ? 'You' : `${match.other_user.first_name} ${match.other_user.username}`,
            sender_avatar: '👤'
          };
        }
      }

      console.log('✅ Transformed matches:', transformedMatches.length);

      // Cache the results for quick access
      dataCache.set(CACHE_NAMESPACES.CHAT_MATCHES, userId, transformedMatches, CACHE_TTL.CHAT_DATA);

      return transformedMatches;
    } catch (error) {
      console.error('❌ Error fetching matches:', error);
      return [];
    }
  }

  // Get messages for a specific match
  static async getMessages(matchId: string, forceRefresh: boolean = false): Promise<ChatMessage[]> {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = dataCache.get<ChatMessage[]>(CACHE_NAMESPACES.CHAT_MESSAGES, matchId);
        if (cached) {
          console.log('⚡ Using cached messages for match:', matchId);
          return cached;
        }
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get current user ID first
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Get match details for decryption
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('❌ Error fetching match for decryption:', matchError);
        return [];
      }

      // Process messages with proper async handling
      const processedMessages = await Promise.all(
        messages?.map(async (msg) => {
          // Decrypt the message content using production encryption
          let decryptedContent = msg.content;
          try {
          // Check if this is a compatible-encrypted message
          if (CompatibleEncryptionService.isEncryptedByThisService(msg.content)) {
            try {
              decryptedContent = CompatibleEncryptionService.decryptMessage(
                msg.content,
                match.user1_id,
                match.user2_id
              );
            } catch (compatibleError) {
              console.warn('⚠️ Compatible decryption failed, trying simple decryption:', compatibleError);
              // Fallback to simple decryption
              try {
                const { SimpleEncryptionService } = await import('./simpleEncryption');
                decryptedContent = SimpleEncryptionService.decryptMessage(
                  msg.content,
                  match.user1_id,
                  match.user2_id
                );
              } catch (fallbackError) {
                console.error('❌ Fallback decryption also failed:', fallbackError);
                decryptedContent = '[Encrypted Message]';
              }
            }
          } else {
            // Handle legacy messages (fallback to simple decryption)
            console.log('⚠️ Legacy message detected, attempting simple decryption');
            try {
              // Import simple encryption for legacy support
              const { SimpleEncryptionService } = await import('./simpleEncryption');
              decryptedContent = SimpleEncryptionService.decryptMessage(
                msg.content,
                match.user1_id,
                match.user2_id
              );
            } catch (legacyError) {
              console.error('❌ Legacy decryption failed:', legacyError);
              decryptedContent = '[Legacy Encrypted Message]';
            }
          }
          } catch (decryptError) {
            console.error('❌ Error decrypting message:', decryptError);
            // If decryption fails, show encrypted content (for debugging)
            decryptedContent = '[Encrypted Message]';
          }

          return {
            ...msg,
            content: decryptedContent, // Return decrypted content
            sender_name: msg.sender_id === currentUserId ? 'You' : 'Other',
            sender_avatar: '👤'
          };
        }) || []
      );

      // Cache the processed messages
      dataCache.set(CACHE_NAMESPACES.CHAT_MESSAGES, matchId, processedMessages, CACHE_TTL.CHAT_DATA);

      return processedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Invalidate message cache when new message is sent
  static invalidateMessageCache(matchId: string): void {
    dataCache.delete(CACHE_NAMESPACES.CHAT_MESSAGES, matchId);
  }

  // Invalidate chat matches cache
  static invalidateChatMatchesCache(userId: string): void {
    dataCache.delete(CACHE_NAMESPACES.CHAT_MATCHES, userId);
  }

  // Send a message
  static async sendMessage(matchId: string, messageText: string): Promise<ChatMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('📤 Sending message:', { matchId, messageText, senderId: user.id });

      // Get the match to find the other user for encryption
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('❌ Error fetching match:', matchError);
        throw matchError;
      }

      // Encrypt the message for this conversation using production encryption
      let encryptedContent;
      try {
        encryptedContent = CompatibleEncryptionService.encryptMessage(
          messageText,
          match.user1_id,
          match.user2_id
        );
      } catch (compatibleError) {
        console.warn('⚠️ Compatible encryption failed, falling back to simple encryption:', compatibleError);
        // Fallback to simple encryption
        const { SimpleEncryptionService } = await import('./simpleEncryption');
        encryptedContent = SimpleEncryptionService.encryptMessage(
          messageText,
          match.user1_id,
          match.user2_id
        );
      }

      console.log('🔐 Message encrypted for conversation');

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: encryptedContent, // Store encrypted content
          message_type: 'text',
          is_read: false,
          moderation_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', message);

      // Invalidate message cache so it gets refreshed
      this.invalidateMessageCache(matchId as string);

      // Send push notification to the recipient
      try {
        const recipientId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Get sender's profile for notification
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (senderProfile) {
          // Truncate message if too long
          const previewText = messageText.length > 50
            ? messageText.substring(0, 47) + '...'
            : messageText;

          await sendPushNotification(
            recipientId,
            `💬 ${senderProfile.first_name}`,
            previewText,
            {
              type: 'new_message',
              match_id: matchId,
              sender_id: user.id
            }
          );
        }
      } catch (notifError) {
        console.error('Error sending message notification:', notifError);
        // Don't fail the message send if notification fails
      }

      return {
        ...message,
        content: messageText, // Return decrypted content to UI
        sender_name: 'You',
        sender_avatar: '👤'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(matchId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Subscribe to real-time messages for a match
  static subscribeToMessages(matchId: string, onMessage: (message: ChatMessage) => void) {
    console.log('🔔 Setting up real-time subscription for match:', matchId);
    
    return supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        async (payload) => {
          console.log('📨 New message received via real-time:', payload);
          const message = payload.new as ChatMessage;
          const { data: { user } } = await supabase.auth.getUser();
          const currentUserId = user?.id;
          
          // Get match details for decryption
          const { data: match } = await supabase
            .from('matches')
            .select('user1_id, user2_id')
            .eq('id', message.match_id)
            .single();
          
          // Decrypt the message content using production encryption
          let decryptedContent = message.content;
          if (match) {
            try {
              // Check if this is a compatible-encrypted message
              if (CompatibleEncryptionService.isEncryptedByThisService(message.content)) {
                try {
                  decryptedContent = CompatibleEncryptionService.decryptMessage(
                    message.content,
                    match.user1_id,
                    match.user2_id
                  );
                } catch (compatibleError) {
                  console.warn('⚠️ Compatible real-time decryption failed, trying simple decryption:', compatibleError);
                  // Fallback to simple decryption
                  try {
                    const { SimpleEncryptionService } = require('./simpleEncryption');
                    decryptedContent = SimpleEncryptionService.decryptMessage(
                      message.content,
                      match.user1_id,
                      match.user2_id
                    );
                  } catch (fallbackError) {
                    console.error('❌ Fallback real-time decryption also failed:', fallbackError);
                    decryptedContent = '[Encrypted Message]';
                  }
                }
              } else {
                // Handle legacy messages (fallback to simple decryption)
                console.log('⚠️ Legacy real-time message detected, attempting simple decryption');
                try {
                  // Use synchronous import for real-time messages
                  const { SimpleEncryptionService } = require('./simpleEncryption');
                  decryptedContent = SimpleEncryptionService.decryptMessage(
                    message.content,
                    match.user1_id,
                    match.user2_id
                  );
                } catch (legacyError) {
                  console.error('❌ Legacy real-time decryption failed:', legacyError);
                  decryptedContent = '[Legacy Encrypted Message]';
                }
              }
            } catch (decryptError) {
              console.error('❌ Error decrypting real-time message:', decryptError);
              decryptedContent = '[Encrypted Message]';
            }
          }
          
          const processedMessage = {
            ...message,
            content: decryptedContent, // Return decrypted content
            sender_name: message.sender_id === currentUserId ? 'You' : 'Other',
            sender_avatar: '👤'
          };
          
          console.log('📤 Processing message for UI:', processedMessage);
          onMessage(processedMessage);
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages for match:', matchId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to messages for match:', matchId);
        }
      });
  }

  // Subscribe to typing status
  static subscribeToTyping(matchId: string, onTypingUpdate: (typingStatus: TypingStatus) => void) {
    return supabase
      .channel(`typing:${matchId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        onTypingUpdate(payload.payload as TypingStatus);
      })
      .subscribe();
  }

  // Broadcast typing status
  static async broadcastTyping(matchId: string, isTyping: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .channel(`typing:${matchId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            match_id: matchId,
            user_id: user.id,
            is_typing: isTyping,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  }

  // Get user's primary photo from storage
  static async getUserPhoto(userId: string): Promise<string | null> {
    try {
      // Get user's username first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('❌ Error fetching username for photos:', profileError);
        return null;
      }

      // List files in the user's photos folder
      const { data: files, error: listError } = await supabase.storage
        .from('user-photos')
        .list(profile.username, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (listError || !files || files.length === 0) {
        return null;
      }

      // Get the first photo (primary photo)
      const primaryPhoto = files[0];
      const filePath = `${profile.username}/${primaryPhoto.name}`;

      // Create signed URL for the photo
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-photos')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error('❌ Error creating signed URL for photo:', signedUrlError);
        return null;
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return null;
    }
  }

  // Get photos for multiple users from storage
  static async getUserPhotosFromStorage(userIds: string[]): Promise<any[]> {
    try {
      const photos: any[] = [];

      // Get usernames for all user IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError || !profiles) {
        console.error('❌ Error fetching usernames for photos:', profilesError);
        return [];
      }

      // Fetch photos for each user
      for (const profile of profiles) {
        if (!profile.username) continue;

        try {
          const { data: files, error: listError } = await supabase.storage
            .from('user-photos')
            .list(profile.username, {
              limit: 10,
              sortBy: { column: 'created_at', order: 'asc' }
            });

          if (listError || !files || files.length === 0) {
            continue;
          }

          // Create signed URLs for each photo
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = `${profile.username}/${file.name}`;

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('user-photos')
              .createSignedUrl(filePath, 3600);

            if (!signedUrlError && signedUrlData) {
              photos.push({
                user_id: profile.id,
                photo_url: signedUrlData.signedUrl,
                is_primary: i === 0 // First photo is primary
              });
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching photos for user ${profile.username}:`, error);
          continue;
        }
      }

      return photos;
    } catch (error) {
      console.error('❌ Error in getUserPhotosFromStorage:', error);
      return [];
    }
  }

  // Create a match when two users like each other
  static async createMatch(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;
      return match?.id || null;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }

  // Check if two users are matched
  static async areUsersMatched(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!match;
    } catch (error) {
      console.error('Error checking if users are matched:', error);
      return false;
    }
  }
}
