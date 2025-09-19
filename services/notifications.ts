import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  }> {
    try {
      console.log('🔔 Requesting notification permissions...');
      
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      // If not already granted, request permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔔 Permission request result:', status);
      }
      
      const granted = finalStatus === 'granted';
      const canAskAgain = finalStatus !== 'denied';
      
      console.log('🔔 Final permission result:', { granted, canAskAgain, status: finalStatus });
      
      return {
        granted,
        canAskAgain,
        status: finalStatus,
      };
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
      };
    }
  }

  /**
   * Check if notifications are currently enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Schedule a test notification to verify permissions work
   */
  static async scheduleTestNotification(): Promise<boolean> {
    try {
      const hasPermission = await this.areNotificationsEnabled();
      if (!hasPermission) {
        console.log('🔔 No notification permission, cannot schedule test notification');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Welcome to DebsMatch! 🎉',
          body: 'Your notifications are working perfectly!',
          sound: 'default',
        },
        trigger: { seconds: 2 },
      });

      console.log('✅ Test notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
      return false;
    }
  }

  /**
   * Open app settings to allow user to manually enable notifications
   */
  static async openNotificationSettings(): Promise<void> {
    try {
      await Notifications.openSettingsAsync();
    } catch (error) {
      console.error('❌ Error opening notification settings:', error);
    }
  }

  /**
   * Get detailed permission status
   */
  static async getPermissionStatus(): Promise<{
    canAskAgain: boolean;
    granted: boolean;
    status: string;
  }> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return {
        canAskAgain,
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('❌ Error getting permission status:', error);
      return {
        canAskAgain: false,
        granted: false,
        status: 'error',
      };
    }
  }
}
