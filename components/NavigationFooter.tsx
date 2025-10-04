import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useCustomFonts } from '../utils/fonts';
import TabBounceAnimation from './animations/TabBounceAnimation';
import { playTabSelectionHaptic } from '../utils/haptics';
import { supabase } from '../lib/supabase';
import { LikesService } from '../services/likes';
import { ActivityBadges } from '../utils/activityBadges';
import { useMatchNotification } from '../contexts/MatchNotificationContext';

const { width } = Dimensions.get('window');

interface NavigationFooterProps {
  // No props needed as we'll determine active state from pathname
}

export default function NavigationFooter({}: NavigationFooterProps) {
  const pathname = usePathname();
  const fontsLoaded = useCustomFonts();
  const { showMatchNotification, matchOverlayOpacity } = useMatchNotification();

  const [likesBadge, setLikesBadge] = React.useState(0);
  const [chatsBadge, setChatsBadge] = React.useState(0);

  // Compute likes badge based on last seen timestamp
  const updateLikesBadge = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLikesBadge(0);

      const [lastSeen, likes] = await Promise.all([
        ActivityBadges.getLastSeenLikesAt(),
        LikesService.getLikesReceived(user.id),
      ]);

      if (!likes || likes.length === 0) return setLikesBadge(0);

      if (!lastSeen) {
        // If user has never visited, show total likes as unseen
        setLikesBadge(likes.length);
        return;
      }

      const unseen = likes.filter(l => new Date(l.created_at) > new Date(lastSeen)).length;
      setLikesBadge(unseen);
    } catch (e) {
      console.warn('⚠️ Failed to update likes badge', e);
      setLikesBadge(0);
    }
  }, []);

  // Compute chats badge based on last seen timestamp
  const updateChatsBadge = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setChatsBadge(0);

      const lastSeen = await ActivityBadges.getLastSeenChatsAt();

      // Get matches to limit messages to this user's conversations
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError || !matches || matches.length === 0) {
        setChatsBadge(0);
        return;
      }

      const matchIds = matches.map(m => m.id);

      // Count new messages since last seen from other users
      const messagesQuery = supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', user.id);

      if (lastSeen) {
        messagesQuery.gt('created_at', lastSeen);
      }

      const { count, error: messagesError } = await messagesQuery;
      if (messagesError) {
        console.warn('⚠️ Failed to count new messages', messagesError);
        setChatsBadge(0);
        return;
      }

      setChatsBadge(count || 0);
    } catch (e) {
      console.warn('⚠️ Failed to update chats badge', e);
      setChatsBadge(0);
    }
  }, []);

  // Recompute badges when path changes and on mount
  React.useEffect(() => {
    // Mark sections as seen when visiting respective tabs
    const markSeenIfVisited = async () => {
      if (pathname === '/likes') {
        await ActivityBadges.setLastSeenLikesNow();
      }
      if (pathname === '/chats') {
        await ActivityBadges.setLastSeenChatsNow();
      }
    };

    markSeenIfVisited().finally(() => {
      // After marking seen, update badges
      updateLikesBadge();
      updateChatsBadge();
    });
  }, [pathname, updateLikesBadge, updateChatsBadge]);

  // Also refresh periodically (lightweight) to catch background changes
  React.useEffect(() => {
    const id = setInterval(() => {
      updateLikesBadge();
      updateChatsBadge();
    }, 15000);
    return () => clearInterval(id);
  }, [updateLikesBadge, updateChatsBadge]);

  const navigationItems = [
    {
      id: 'home',
      icon: 'home', // Home icon for main swiping screen
      route: '/',
      isActive: pathname === '/' || pathname === '/index'
    },
    {
      id: 'likes',
      icon: 'heart', // Matches design system
      route: '/likes',
      isActive: pathname === '/likes'
    },
    {
      id: 'chats',
      icon: 'comments', // Using chat-circle equivalent
      route: '/chats',
      isActive: pathname === '/chats'
    },
    {
      id: 'profile',
      icon: 'user', // Matches design system
      route: '/profile',
      isActive: pathname === '/profile'
    }
  ];

  const handleNavigation = (route: string) => {
    playTabSelectionHaptic();
    router.push(route);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => (
        <TabBounceAnimation
          key={item.id}
          icon={item.icon}
          isActive={item.isActive}
          onPress={() => handleNavigation(item.route)}
          style={styles.navItem}
          badgeCount={item.id === 'likes' ? likesBadge : item.id === 'chats' ? chatsBadge : 0}
        />
      ))}

      {/* Overlay for match notification */}
      {showMatchNotification && (
        <Animated.View style={[
          styles.overlay,
          { opacity: matchOverlayOpacity }
        ]}
        pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    // Remove top border to eliminate visible break line
    borderTopWidth: 0,
    paddingHorizontal: 16, // Reduced padding
    paddingVertical: 8, // Much smaller vertical padding
    paddingBottom: 20, // Reduced safe area padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    // Disable shadow/elevation so the footer blends seamlessly
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  navItem: {
    paddingVertical: 4, // Reduced padding
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
});
