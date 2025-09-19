// Enhanced real-time messaging with better error handling and reconnection
import { supabase } from '../lib/supabase';
import { ChatMessage, TypingStatus } from '../lib/supabase';

export interface RealtimeConfig {
  reconnectAfterMs?: number;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
}

export class EnhancedRealtimeService {
  private static subscriptions = new Map<string, any>();
  private static reconnectAttempts = new Map<string, number>();
  private static heartbeatIntervals = new Map<string, NodeJS.Timeout>();

  // Enhanced message subscription with auto-reconnection
  static subscribeToMessages(
    matchId: string, 
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void,
    config: RealtimeConfig = {}
  ) {
    const {
      reconnectAfterMs = 5000,
      maxReconnectAttempts = 5,
      heartbeatIntervalMs = 30000
    } = config;

    const channelName = `messages:${matchId}`;
    
    // Clean up existing subscription
    this.unsubscribeFromMessages(matchId);

    const setupSubscription = () => {
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${matchId}`
          },
          async (payload) => {
            try {
              const message = payload.new as ChatMessage;
              const { data: { user } } = await supabase.auth.getUser();
              const currentUserId = user?.id;
              
              onMessage({
                ...message,
                sender_name: message.sender_id === currentUserId ? 'You' : 'Other',
                sender_avatar: '👤'
              });
            } catch (error) {
              console.error('Error processing message:', error);
              onError?.(error);
            }
          }
        )
        .on('broadcast', { event: 'message_status' }, (payload) => {
          // Handle message status updates (delivered, read, etc.)
          console.log('Message status update:', payload);
        })
        .subscribe((status) => {
          console.log(`Subscription status for ${matchId}:`, status);
          
          if (status === 'SUBSCRIBED') {
            // Reset reconnect attempts on successful connection
            this.reconnectAttempts.set(matchId, 0);
            
            // Start heartbeat
            this.startHeartbeat(matchId, heartbeatIntervalMs);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleReconnection(matchId, onMessage, onError, config);
          }
        });

      this.subscriptions.set(matchId, subscription);
    };

    setupSubscription();
    return this.subscriptions.get(matchId);
  }

  // Enhanced typing subscription
  static subscribeToTyping(
    matchId: string,
    onTypingUpdate: (typingStatus: TypingStatus) => void,
    onError?: (error: any) => void
  ) {
    const channelName = `typing:${matchId}`;
    
    const subscription = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        try {
          onTypingUpdate(payload.payload as TypingStatus);
        } catch (error) {
          console.error('Error processing typing update:', error);
          onError?.(error);
        }
      })
      .subscribe((status) => {
        console.log(`Typing subscription status for ${matchId}:`, status);
      });

    return subscription;
  }

  // Enhanced typing broadcast with debouncing
  private static typingTimeouts = new Map<string, NodeJS.Timeout>();

  static async broadcastTyping(
    matchId: string, 
    isTyping: boolean,
    debounceMs: number = 1000
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(matchId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      if (isTyping) {
        // Send typing status immediately
        await this.sendTypingStatus(matchId, user.id, true);
        
        // Set timeout to stop typing
        const timeout = setTimeout(async () => {
          await this.sendTypingStatus(matchId, user.id, false);
          this.typingTimeouts.delete(matchId);
        }, debounceMs);
        
        this.typingTimeouts.set(matchId, timeout);
      } else {
        // Send stop typing immediately
        await this.sendTypingStatus(matchId, user.id, false);
        this.typingTimeouts.delete(matchId);
      }
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  }

  private static async sendTypingStatus(
    matchId: string, 
    userId: string, 
    isTyping: boolean
  ): Promise<void> {
    await supabase
      .channel(`typing:${matchId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          match_id: matchId,
          user_id: userId,
          is_typing: isTyping,
          timestamp: new Date().toISOString()
        }
      });
  }

  // Heartbeat to keep connection alive
  private static startHeartbeat(matchId: string, intervalMs: number): void {
    const interval = setInterval(async () => {
      try {
        // Send a ping to keep the connection alive
        await supabase
          .channel(`heartbeat:${matchId}`)
          .send({
            type: 'broadcast',
            event: 'ping',
            payload: { timestamp: new Date().toISOString() }
          });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, intervalMs);

    this.heartbeatIntervals.set(matchId, interval);
  }

  // Handle reconnection logic
  private static handleReconnection(
    matchId: string,
    onMessage: (message: ChatMessage) => void,
    onError?: (error: any) => void,
    config: RealtimeConfig = {}
  ): void {
    const attempts = this.reconnectAttempts.get(matchId) || 0;
    const maxAttempts = config.maxReconnectAttempts || 5;
    const reconnectAfterMs = config.reconnectAfterMs || 5000;

    if (attempts >= maxAttempts) {
      console.error(`Max reconnection attempts reached for ${matchId}`);
      onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    console.log(`Attempting to reconnect for ${matchId} (attempt ${attempts + 1})`);
    this.reconnectAttempts.set(matchId, attempts + 1);

    setTimeout(() => {
      this.subscribeToMessages(matchId, onMessage, onError, config);
    }, reconnectAfterMs);
  }

  // Unsubscribe from messages
  static unsubscribeFromMessages(matchId: string): void {
    const subscription = this.subscriptions.get(matchId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(matchId);
    }

    // Clear heartbeat
    const heartbeat = this.heartbeatIntervals.get(matchId);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatIntervals.delete(matchId);
    }

    // Clear typing timeout
    const typingTimeout = this.typingTimeouts.get(matchId);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      this.typingTimeouts.delete(matchId);
    }
  }

  // Clean up all subscriptions
  static cleanup(): void {
    this.subscriptions.forEach((subscription, matchId) => {
      this.unsubscribeFromMessages(matchId);
    });
  }
}
