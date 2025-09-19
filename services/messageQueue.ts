// Message queue for offline support and reliable delivery
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../lib/supabase';

export interface QueuedMessage {
  id: string;
  matchId: string;
  messageText: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export class MessageQueueService {
  private static readonly QUEUE_KEY = 'message_queue';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  // Add message to queue
  static async queueMessage(
    matchId: string, 
    messageText: string
  ): Promise<string> {
    const messageId = `queued_${Date.now()}_${Math.random()}`;
    const queuedMessage: QueuedMessage = {
      id: messageId,
      matchId,
      messageText,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    try {
      const existingQueue = await this.getQueue();
      const updatedQueue = [...existingQueue, queuedMessage];
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(updatedQueue));
      return messageId;
    } catch (error) {
      console.error('Error queuing message:', error);
      return messageId;
    }
  }

  // Get queued messages
  static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting message queue:', error);
      return [];
    }
  }

  // Remove message from queue
  static async removeFromQueue(messageId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.filter(msg => msg.id !== messageId);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error removing message from queue:', error);
    }
  }

  // Process queued messages
  static async processQueue(): Promise<void> {
    const queue = await this.getQueue();
    const { sendMessage } = await import('./chat');

    for (const queuedMessage of queue) {
      try {
        const result = await sendMessage(
          queuedMessage.matchId, 
          queuedMessage.messageText
        );

        if (result) {
          // Message sent successfully, remove from queue
          await this.removeFromQueue(queuedMessage.id);
        } else {
          // Message failed, increment retry count
          await this.incrementRetryCount(queuedMessage.id);
        }
      } catch (error) {
        console.error('Error processing queued message:', error);
        await this.incrementRetryCount(queuedMessage.id);
      }
    }
  }

  // Increment retry count and remove if max retries reached
  private static async incrementRetryCount(messageId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const messageIndex = queue.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        queue[messageIndex].retryCount++;
        
        if (queue[messageIndex].retryCount >= queue[messageIndex].maxRetries) {
          // Remove message after max retries
          queue.splice(messageIndex, 1);
        }
        
        await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Error incrementing retry count:', error);
    }
  }

  // Clear all queued messages
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing message queue:', error);
    }
  }
}
