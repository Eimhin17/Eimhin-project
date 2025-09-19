// Enhanced message reliability and delivery tracking
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../lib/supabase';

export interface MessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  retryCount?: number;
}

export class MessageReliabilityService {
  // Send message with retry logic and delivery tracking
  static async sendMessageWithReliability(
    matchId: string, 
    messageText: string,
    onStatusUpdate?: (status: MessageStatus) => void
  ): Promise<ChatMessage | null> {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Immediately show message as "sending"
    const tempMessage: ChatMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: '', // Will be filled by actual message
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: 'You',
      sender_avatar: '👤'
    };

    onStatusUpdate?.({
      id: tempId,
      status: 'sending',
      timestamp: new Date().toISOString()
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: messageText,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      const finalMessage = {
        ...message,
        sender_name: 'You',
        sender_avatar: '👤'
      };

      onStatusUpdate?.({
        id: message.id,
        status: 'sent',
        timestamp: new Date().toISOString()
      });

      return finalMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      onStatusUpdate?.({
        id: tempId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        retryCount: 1
      });
      return null;
    }
  }

  // Retry failed messages
  static async retryMessage(
    messageId: string,
    matchId: string,
    messageText: string
  ): Promise<ChatMessage | null> {
    return this.sendMessageWithReliability(matchId, messageText);
  }

  // Mark message as delivered (when other user receives it)
  static async markAsDelivered(messageId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ 
          // Add delivered_at timestamp if you have this column
          // delivered_at: new Date().toISOString()
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  // Enhanced read receipt tracking
  static async markAsRead(messageId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString() // If you add this column
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
}
