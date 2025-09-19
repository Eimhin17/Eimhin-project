import * as React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Animated, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { ChatService } from '../../services/chat';
import { ChatMatch, ChatMessage } from '../../lib/supabase';
import { CircularProfilePicture } from '../../components/CircularProfilePicture';
import { useProfilePreloader } from '../../hooks/useProfilePreloader';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';

export default function ChatsScreen() {
  const [chats, setChats] = React.useState<ChatMatch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Preload first profile for instant swiping screen
  useProfilePreloader({ 
    shouldPreload: true, 
    pageName: 'chats' 
  });

  // Get current user ID on component mount
  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await loadChats(user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  // Refresh chats when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        console.log('🔄 Chats screen focused, refreshing matches...');
        loadChats(currentUserId);
      }
    }, [currentUserId])
  );

  // Load chats from Supabase
  const loadChats = async (userId: string) => {
    try {
      console.log('🔄 Loading chats for user:', userId);
      setLoading(true);
      const matches = await ChatService.getMatches(userId);
      console.log('✅ Loaded matches:', matches.length);
      setChats(matches);
    } catch (error) {
      console.error('❌ Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh chats
  const onRefresh = async () => {
    if (currentUserId) {
      setRefreshing(true);
      await loadChats(currentUserId);
      setRefreshing(false);
    }
  };

  // Subscribe to real-time updates
  React.useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to new matches
    const matchesSubscription = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `or(user1_id.eq.${currentUserId},user2_id.eq.${currentUserId})`
        },
        (payload) => {
          console.log('🆕 New match detected!', payload);
          // Refresh chats when a new match is created
          loadChats(currentUserId);
        }
      )
      .subscribe();

    // Subscribe to new messages for all matches
    const subscriptions = chats.map(chat => 
      ChatService.subscribeToMessages(chat.id, (newMessage) => {
        setChats(prevChats => 
          prevChats.map(prevChat => {
            if (prevChat.id === chat.id) {
              return {
                ...prevChat,
                last_message: newMessage,
                unread_count: prevChat.unread_count + (newMessage.sender_id !== currentUserId ? 1 : 0)
              };
            }
            return prevChat;
          })
        );
      })
    );

    // Subscribe to typing status for all matches
    const typingSubscriptions = chats.map(chat =>
      ChatService.subscribeToTyping(chat.id, (typingStatus) => {
        // Handle typing indicators
        console.log('Typing status:', typingStatus);
      })
    );

    return () => {
      // Cleanup subscriptions
      matchesSubscription.unsubscribe();
      subscriptions.forEach(sub => sub.unsubscribe());
      typingSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [chats, currentUserId]);

  // Navigate to individual chat
  const navigateToChat = (matchId: string, otherUserName: string, otherUserId: string) => {
    router.push(`/chat/${matchId}?name=${encodeURIComponent(otherUserName)}&userId=${otherUserId}`);
  };

  // Render individual chat item
  const renderChatItem = ({ item }: { item: ChatMatch }) => {
    const otherUserFirstName = item.other_user.first_name;
    const lastMessageText = item.last_message?.content || 'Start a conversation!';
    const lastMessageTime = item.last_message?.created_at 
      ? formatTimeAgo(item.last_message.created_at)
      : formatTimeAgo(item.matched_at);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigateToChat(item.id, otherUserFirstName, item.other_user.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFF0F5', '#F8F4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chatItemGradient}
        >
          <View style={styles.avatarContainer}>
            <CircularProfilePicture
              userId={item.other_user.id}
              size={50}
              fallbackIcon={
                <Text style={styles.avatarText}>
                  {otherUserFirstName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              }
            />
            {item.other_user.id === currentUserId && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName}>{otherUserFirstName}</Text>
              <Text style={styles.chatTime}>{lastMessageTime}</Text>
            </View>
            
            <View style={styles.messageContainer}>
              <Text style={styles.lastMessage} numberOfLines={2}>
                {item.last_message?.sender_id === currentUserId ? 'You: ' : ''}
                {lastMessageText}
              </Text>
              
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unread_count}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return messageTime.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitlePink}>Mes</Text>
              <Text style={styles.headerTitlePurple}>sages</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (chats.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitlePink}>Mes</Text>
              <Text style={styles.headerTitlePurple}>sages</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#c3b1e1" />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>
            Start swiping to find your perfect match! When you both like each other, you'll be able to chat here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitlePink}>Mes</Text>
            <Text style={styles.headerTitlePurple}>sages</Text>
          </View>
        </View>
      </View>
      
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF4F81']}
            tintColor="#FF4F81"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitlePink: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF4F81',
    fontFamily: Fonts.bold,
  },
  headerTitlePurple: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c3b1e1',
    fontFamily: Fonts.bold,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  chatListContent: {
    paddingBottom: SPACING.lg,
  },
  chatItem: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chatItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4F81',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF4F81',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#c3b1e1',
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: '#FF4F81',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF4F81',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#FF4F81',
    fontWeight: '600',
  },
});
