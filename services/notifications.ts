import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushToken {
  token: string;
  deviceId?: string;
  deviceType: 'ios' | 'android' | 'web';
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if running in Expo Go or on a physical device
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get the Expo push token
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    token = pushToken.data;

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4F81',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Save push token to database
 */
export async function savePushToken(userId: string, pushToken: string): Promise<boolean> {
  try {
    const deviceType = Platform.OS as 'ios' | 'android' | 'web';
    const deviceId = Constants.deviceId || Constants.sessionId || 'unknown';

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        device_id: deviceId,
        device_type: deviceType,
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_id',
      });

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    console.log('Push token saved successfully');
    return true;
  } catch (error) {
    console.error('Error in savePushToken:', error);
    return false;
  }
}

/**
 * Remove push token from database (e.g., on logout)
 */
export async function removePushToken(userId: string): Promise<boolean> {
  try {
    const deviceId = Constants.deviceId || Constants.sessionId || 'unknown';

    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (error) {
      console.error('Error removing push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removePushToken:', error);
    return false;
  }
}

/**
 * Initialize push notifications for the current user
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      console.log('Failed to get push token');
      return false;
    }

    const saved = await savePushToken(userId, token);
    return saved;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps a notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  seconds: number = 1
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      seconds,
    },
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Send push notification via edge function
 */
export async function sendPushNotification(
  userId: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const payload = {
      ...(Array.isArray(userId) ? { userIds: userId } : { userId }),
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    };

    const { data: response, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return false;
    }

    console.log('Push notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
