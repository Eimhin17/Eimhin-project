import { supabase } from '../lib/supabase';
import { sendPushNotification } from './notifications';

/**
 * Service for handling scheduled and reminder notifications
 */
export class ScheduledNotificationService {

  /**
   * Send daily reminder if user has new profiles to swipe on
   */
  static async sendNewProfilesReminder(userId: string): Promise<boolean> {
    try {
      // Get user's swipe history from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentSwipes, error: swipeError } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', userId)
        .gte('created_at', oneDayAgo);

      if (swipeError) {
        console.error('Error checking swipe history:', swipeError);
        return false;
      }

      // Count active profiles available to swipe
      const { count: profileCount, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('profile_completed', true)
        .eq('status', 'active')
        .neq('id', userId);

      if (countError) {
        console.error('Error counting profiles:', countError);
        return false;
      }

      // Only send if there are profiles and user hasn't swiped recently
      if (profileCount && profileCount > 0 && (!recentSwipes || recentSwipes.length === 0)) {
        await sendPushNotification(
          userId,
          '✨ New Profiles Available!',
          `${profileCount} people are waiting to meet you!`,
          { type: 'new_profiles_reminder' }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending new profiles reminder:', error);
      return false;
    }
  }

  /**
   * Remind user about unopened likes
   */
  static async sendUnopenedLikesReminder(userId: string): Promise<boolean> {
    try {
      // Get likes received that haven't been viewed (user hasn't swiped on them)
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('liker_id')
        .eq('liked_user_id', userId);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        return false;
      }

      if (!likes || likes.length === 0) {
        return false;
      }

      // Check if user has already swiped on these likers
      const likerIds = likes.map(l => l.liker_id);
      const { data: swipes, error: swipeError } = await supabase
        .from('swipes')
        .select('swiped_user_id')
        .eq('swiper_id', userId)
        .in('swiped_user_id', likerIds);

      if (swipeError) {
        console.error('Error checking swipes:', swipeError);
        return false;
      }

      // Find unopened likes
      const swipedUserIds = new Set(swipes?.map(s => s.swiped_user_id) || []);
      const unopenedLikes = likes.filter(like => !swipedUserIds.has(like.liker_id));

      if (unopenedLikes.length > 0) {
        const message = unopenedLikes.length === 1
          ? '1 person likes you! Check them out'
          : `${unopenedLikes.length} people like you! Check them out`;

        await sendPushNotification(
          userId,
          '💖 You Have Likes!',
          message,
          { type: 'unopened_likes_reminder', count: unopenedLikes.length }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending unopened likes reminder:', error);
      return false;
    }
  }

  /**
   * Remind user about unread messages
   */
  static async sendUnreadMessagesReminder(userId: string): Promise<boolean> {
    try {
      // Get matches for the user
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (matchError || !matches || matches.length === 0) {
        return false;
      }

      const matchIds = matches.map(m => m.id);

      // Get unread messages
      const { data: unreadMessages, error: messageError } = await supabase
        .from('messages')
        .select('id, match_id')
        .in('match_id', matchIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (messageError) {
        console.error('Error fetching unread messages:', messageError);
        return false;
      }

      if (unreadMessages && unreadMessages.length > 0) {
        const uniqueMatches = new Set(unreadMessages.map(m => m.match_id)).size;
        const message = uniqueMatches === 1
          ? 'You have an unread message!'
          : `You have unread messages from ${uniqueMatches} matches!`;

        await sendPushNotification(
          userId,
          '💬 Unread Messages',
          message,
          { type: 'unread_messages_reminder', count: unreadMessages.length }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending unread messages reminder:', error);
      return false;
    }
  }

  /**
   * Remind user to message a match if no messages have been sent in 24 hours
   */
  static async sendMatchMessageReminder(userId: string): Promise<boolean> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get matches from the last 24 hours
      const { data: recentMatches, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, matched_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .gte('matched_at', oneDayAgo)
        .order('matched_at', { ascending: false });

      if (matchError || !recentMatches || recentMatches.length === 0) {
        return false;
      }

      // Check each match for messages
      for (const match of recentMatches) {
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('id')
          .eq('match_id', match.id);

        // If no messages in this match
        if ((!messages || messages.length === 0) && !msgError) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;

          // Get other user's profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', otherUserId)
            .single();

          if (otherUser) {
            await sendPushNotification(
              userId,
              '💭 Say Hi!',
              `Start a conversation with ${otherUser.first_name}!`,
              { type: 'match_message_reminder', match_id: match.id, other_user_id: otherUserId }
            );
            return true; // Send only one reminder at a time
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error sending match message reminder:', error);
      return false;
    }
  }

  /**
   * Send daily engagement notification (picks the most relevant one)
   */
  static async sendDailyEngagementNotification(userId: string): Promise<boolean> {
    try {
      // Priority order: unread messages > unopened likes > match reminders > new profiles

      // 1. Check for unread messages first (highest priority)
      const unreadSent = await this.sendUnreadMessagesReminder(userId);
      if (unreadSent) return true;

      // 2. Check for unopened likes
      const likesSent = await this.sendUnopenedLikesReminder(userId);
      if (likesSent) return true;

      // 3. Check for matches that need messaging
      const matchSent = await this.sendMatchMessageReminder(userId);
      if (matchSent) return true;

      // 4. Fall back to new profiles
      const profilesSent = await this.sendNewProfilesReminder(userId);
      return profilesSent;
    } catch (error) {
      console.error('Error sending daily engagement notification:', error);
      return false;
    }
  }

  /**
   * Send re-engagement notification for inactive users
   */
  static async sendReEngagementNotification(userId: string): Promise<boolean> {
    try {
      // Check last activity (swipes, messages, etc)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const [swipes, messages] = await Promise.all([
        supabase
          .from('swipes')
          .select('id')
          .eq('swiper_id', userId)
          .gte('created_at', threeDaysAgo)
          .limit(1),
        supabase
          .from('messages')
          .select('id')
          .eq('sender_id', userId)
          .gte('created_at', threeDaysAgo)
          .limit(1)
      ]);

      // If no activity in 3 days
      if ((!swipes.data || swipes.data.length === 0) &&
          (!messages.data || messages.data.length === 0)) {

        // Check if they have pending likes or matches
        const { data: likes } = await supabase
          .from('likes')
          .select('id')
          .eq('liked_user_id', userId)
          .limit(1);

        const message = likes && likes.length > 0
          ? 'Someone likes you! Come back and see who it is 👀'
          : 'New people joined! Come see who you might match with ✨';

        await sendPushNotification(
          userId,
          '💫 We Miss You!',
          message,
          { type: 're_engagement' }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending re-engagement notification:', error);
      return false;
    }
  }

  /**
   * Send weekly activity summary
   */
  static async sendWeeklySummary(userId: string): Promise<boolean> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get stats from the last week
      const [likesReceived, matches, messages] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_user_id', userId)
          .gte('created_at', oneWeekAgo),
        supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .gte('matched_at', oneWeekAgo),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', userId)
          .gte('created_at', oneWeekAgo)
      ]);

      const likesCount = likesReceived.count || 0;
      const matchesCount = matches.count || 0;
      const messagesCount = messages.count || 0;

      // Only send if there's some activity
      if (likesCount > 0 || matchesCount > 0) {
        let summary = '📊 Your Week: ';
        const parts = [];

        if (likesCount > 0) parts.push(`${likesCount} like${likesCount > 1 ? 's' : ''}`);
        if (matchesCount > 0) parts.push(`${matchesCount} match${matchesCount > 1 ? 'es' : ''}`);
        if (messagesCount > 0) parts.push(`${messagesCount} message${messagesCount > 1 ? 's' : ''}`);

        summary += parts.join(', ') + '!';

        await sendPushNotification(
          userId,
          '✨ Your Weekly Update',
          summary,
          {
            type: 'weekly_summary',
            likes: likesCount,
            matches: matchesCount,
            messages: messagesCount
          }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending weekly summary:', error);
      return false;
    }
  }

  /**
   * Send profile completion reminder
   */
  static async sendProfileCompletionReminder(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_completed, bio, photos')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return false;
      }

      // If profile is not completed
      if (!profile.profile_completed) {
        await sendPushNotification(
          userId,
          '📝 Complete Your Profile',
          'Finish your profile to start matching with people!',
          { type: 'profile_completion_reminder' }
        );
        return true;
      }

      // Check for profile improvements
      if (!profile.bio || profile.bio.length < 20) {
        await sendPushNotification(
          userId,
          '✍️ Add a Bio',
          'Profiles with bios get 3x more matches!',
          { type: 'profile_improvement_bio' }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending profile completion reminder:', error);
      return false;
    }
  }

  /**
   * Send prime time notification (when most users are active)
   */
  static async sendPrimeTimeNotification(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const hour = now.getHours();

      // Prime time is typically 7-10 PM
      if (hour >= 19 && hour <= 22) {
        // Check if user has been active in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: recentActivity } = await supabase
          .from('swipes')
          .select('id')
          .eq('swiper_id', userId)
          .gte('created_at', oneHourAgo)
          .limit(1);

        // Only send if user hasn't been active recently
        if (!recentActivity || recentActivity.length === 0) {
          await sendPushNotification(
            userId,
            '🔥 Peak Time!',
            'Most users are online right now. Perfect time to swipe!',
            { type: 'prime_time' }
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error sending prime time notification:', error);
      return false;
    }
  }

  /**
   * Send boost reminder (encourage active swiping)
   */
  static async sendBoostReminder(userId: string): Promise<boolean> {
    try {
      // Check if user has likes that might become matches
      const { data: userLikes } = await supabase
        .from('likes')
        .select('liked_user_id')
        .eq('liker_id', userId);

      if (!userLikes || userLikes.length === 0) {
        return false;
      }

      // Check if any of those users have liked them back (potential matches)
      const likedUserIds = userLikes.map(l => l.liked_user_id);

      const { data: mutualLikes } = await supabase
        .from('likes')
        .select('liker_id')
        .in('liker_id', likedUserIds)
        .eq('liked_user_id', userId);

      if (mutualLikes && mutualLikes.length > 0) {
        await sendPushNotification(
          userId,
          '⚡ Potential Matches!',
          `${mutualLikes.length} people who liked you are online now!`,
          { type: 'boost_reminder', potential_matches: mutualLikes.length }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending boost reminder:', error);
      return false;
    }
  }
}
