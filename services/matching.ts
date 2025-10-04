import { supabase } from '../lib/supabase';
import { Inserts } from '../lib/supabase';
import { sendPushNotification } from './notifications';

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_user_id: string;
  swipe_direction: 'left' | 'right';
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
}

export interface MatchWithUser {
  match: Match;
  otherUser: {
    id: string;
    first_name: string;
    username: string;
    age: number;
    school_name?: string;
    bio?: string;
    relationship_status?: string;
    photos: { photo_url: string; is_primary: boolean }[];
  };
}

export class MatchingService {
  // Record a swipe
  static async recordSwipe(swiperId: string, swipedUserId: string, direction: 'left' | 'right'): Promise<{ swipe: Swipe | null; error: string | null }> {
    try {
      console.log('🔄 Recording swipe:', { swiperId, swipedUserId, direction });

      const { data, error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: swiperId,
          swiped_user_id: swipedUserId,
          direction: direction,
        })
        .select()
        .single();

      // Ignore duplicate swipe errors (code 23505) - users can swipe on each other multiple times
      if (error && error.code !== '23505') {
        console.error('❌ Error recording swipe:', error);
        return { swipe: null, error: error.message };
      }

      if (error && error.code === '23505') {
        console.log('✅ Swipe already recorded (duplicate ignored)');
        return { swipe: null, error: null };
      }

      console.log('✅ Swipe recorded successfully:', data);

      return { swipe: data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error recording swipe:', error);
      return { swipe: null, error: 'An unexpected error occurred' };
    }
  }

  // Get users that the current user has passed on (swiped left)
  static async getPassedUsers(userId: string): Promise<string[]> {
    try {
      console.log('🔄 Fetching passed users for:', userId);
      // Beta behavior: only exclude passes from the last 3 hours
      const threeHoursAgoIso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('swipes')
        .select('swiped_user_id')
        .eq('swiper_id', userId)
        .eq('direction', 'left')
        .gte('created_at', threeHoursAgoIso);

      if (error) {
        console.error('❌ Error fetching passed users:', error);
        return [];
      }

      const passedUserIds = data?.map(swipe => swipe.swiped_user_id) || [];
      console.log('✅ Found passed users:', passedUserIds);
      
      return passedUserIds;
    } catch (error) {
      console.error('❌ Error fetching passed users:', error);
      return [];
    }
  }

  // Create a like when user swipes right
  static async createLike(likerId: string, likedUserId: string): Promise<void> {
    try {
      // Create the like; allow duplicates by treating constraint violation as success
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_id: likerId,
          liked_user_id: likedUserId,
        });

      if (error && (error as any).code !== '23505') {
        console.error('Error creating like:', error);
        return;
      }

      console.log('✅ Like recorded (new or existing)');
    } catch (error) {
      console.error('Error creating like:', error);
    }
  }

  // Check if two users have matched (both liked each other)
  static async checkForMatch(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      // Check if user2 has liked user1
      const { data: like1, error: error1 } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user2Id)
        .eq('liked_user_id', user1Id)
        .single();

      if (error1 && error1.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking like 1:', error1);
        return false;
      }

      // Check if user1 has liked user2
      const { data: like2, error: error2 } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', user1Id)
        .eq('liked_user_id', user2Id)
        .single();

      if (error2 && error2.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking like 2:', error2);
        return false;
      }

      return !!(like1 && like2);
    } catch (error) {
      console.error('Error checking for match:', error);
      return false;
    }
  }

  // Create a match between two users
  static async createMatch(user1Id: string, user2Id: string): Promise<{ match: Match | null; error: string | null }> {
    try {
      // First check if a match already exists
      const existingMatch = await this.getExistingMatch(user1Id, user2Id);
      if (existingMatch) {
        return { match: existingMatch, error: null };
      }

      // Ensure user1_id is always the smaller ID for consistency
      const [smallerId, largerId] = [user1Id, user2Id].sort();

      const { data, error } = await supabase
        .from('matches')
        .insert({
          user1_id: smallerId,
          user2_id: largerId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating match:', error);
        return { match: null, error: error.message };
      }

      console.log('✅ Match created successfully:', data);

      // Send push notifications to both users
      try {
        // Get both users' profiles for notifications
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name')
          .in('id', [user1Id, user2Id]);

        if (profiles && profiles.length === 2) {
          const user1Profile = profiles.find(p => p.id === user1Id);
          const user2Profile = profiles.find(p => p.id === user2Id);

          // Send notification to user1
          if (user2Profile) {
            await sendPushNotification(
              user1Id,
              '🎉 It\'s a Match!',
              `You and ${user2Profile.first_name} matched!`,
              { type: 'new_match', match_id: data.id, other_user_id: user2Id }
            );
          }

          // Send notification to user2
          if (user1Profile) {
            await sendPushNotification(
              user2Id,
              '🎉 It\'s a Match!',
              `You and ${user1Profile.first_name} matched!`,
              { type: 'new_match', match_id: data.id, other_user_id: user1Id }
            );
          }
        }
      } catch (notifError) {
        console.error('Error sending match notifications:', notifError);
        // Don't fail the match creation if notification fails
      }

      return { match: data, error: null };
    } catch (error) {
      console.error('Error creating match:', error);
      return { match: null, error: 'An unexpected error occurred' };
    }
  }

  // Check if a match already exists between two users
  static async getExistingMatch(user1Id: string, user2Id: string): Promise<Match | null> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing match:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error checking existing match:', error);
      return null;
    }
  }

  // Get all matches for a user
  static async getUserMatches(userId: string): Promise<{ matches: MatchWithUser[] | null; error: string | null }> {
    try {
      // First get the matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (matchesError) {
        return { matches: null, error: matchesError.message };
      }

      if (!matches || matches.length === 0) {
        return { matches: [], error: null };
      }

      // Get user IDs from matches
      const userIds = new Set();
      matches.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });

      // Fetch user details (only completed profiles)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          bio,
          relationship_status,
          profile_completed,
          schools (school_name),
          user_photos (photo_url, is_primary)
        `)
        .in('id', Array.from(userIds))
        .eq('profile_completed', true)
        .eq('status', 'active');

      if (usersError) {
        return { matches: null, error: usersError.message };
      }

      // Create a users map for easy lookup
      const usersMap = new Map();
      users?.forEach(user => {
        usersMap.set(user.id, user);
      });

      // Transform matches with user data
      const matchesWithUsers = matches.map(match => ({
        ...match,
        user1: usersMap.get(match.user1_id),
        user2: usersMap.get(match.user2_id)
      }));

      // Transform the data to get the other user's info
      const transformedMatches: MatchWithUser[] = matchesWithUsers.map((match: any) => {
        const isUser1 = match.user1_id === userId;
        const otherUser = isUser1 ? match.user2 : match.user1;
        
        // Calculate age
        let age = 0;
        if (otherUser?.date_of_birth) {
          const birthDate = new Date(otherUser.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          match: {
            id: match.id,
            user1_id: match.user1_id,
            user2_id: match.user2_id,
            matched_at: match.matched_at,
          },
          otherUser: {
            id: otherUser?.id || 'unknown',
            first_name: otherUser?.first_name || 'Unknown',
            username: otherUser?.username || 'user',
            age,
            school_name: otherUser?.schools?.school_name || 'Unknown',
            bio: otherUser?.bio || '',
            relationship_status: otherUser?.relationship_status,
            photos: otherUser?.user_photos || [],
          },
        };
      });

      return { matches: transformedMatches, error: null };
    } catch (error) {
      return { matches: null, error: 'An unexpected error occurred' };
    }
  }

  // Get users who liked the current user (for the Likes tab)
  static async getUsersWhoLikedMe(userId: string): Promise<{ users: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('swipes')
        .select(`
          *,
          swiper:users!swipes_swiper_id_fkey (
            id,
            first_name,
            username,
            date_of_birth,
            bio,
            relationship_status,
            schools (school_name),
            user_photos (photo_url, is_primary)
          )
        `)
        .eq('swiped_user_id', userId)
        .eq('swipe_direction', 'right')
        .order('created_at', { ascending: false });

      if (error) {
        return { users: null, error: error.message };
      }

      // Transform the data
      const users = data.map((swipe: any) => {
        const user = swipe.swiper;
        const birthDate = new Date(user.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return {
          id: user.id,
          first_name: user.first_name,
          username: user.username,
          age,
          school_name: user.schools?.school_name,
          bio: user.bio,
          relationship_status: user.relationship_status,
          photos: user.user_photos || [],
          liked_at: swipe.created_at,
        };
      });

      return { users, error: null };
    } catch (error) {
      return { users: null, error: 'An unexpected error occurred' };
    }
  }

  // Listen to real-time matches
  static onMatchCreated(callback: (match: Match) => void) {
    return supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          callback(payload.new as Match);
        }
      )
      .subscribe();
  }

  // Listen to real-time swipes
  static onSwipeCreated(callback: (swipe: Swipe) => void) {
    return supabase
      .channel('swipes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'swipes',
        },
        (payload) => {
          callback(payload.new as Swipe);
        }
      )
      .subscribe();
  }
}
