// Optimized messaging hook with performance improvements
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage } from '../lib/supabase';
import { MessageQueueService } from '../services/messageQueue';
import { EnhancedRealtimeService } from '../services/enhancedRealtime';
import { MessageReliabilityService } from '../services/messageReliability';

export interface UseOptimizedMessagingOptions {
  matchId: string;
  enableOfflineSupport?: boolean;
  enableEncryption?: boolean;
  maxMessagesToLoad?: number;
  enableTypingIndicators?: boolean;
}

export function useOptimizedMessaging({
  matchId,
  enableOfflineSupport = true,
  enableEncryption = false,
  maxMessagesToLoad = 50,
  enableTypingIndicators = true
}: UseOptimizedMessagingOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  const messageStatuses = useRef<Map<string, string>>(new Map());
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastMessageId = useRef<string | null>(null);

  // Memoized message handlers
  const handleNewMessage = useCallback((newMessage: ChatMessage) => {
    setMessages(prevMessages => {
      // Check if message already exists to prevent duplicates
      if (prevMessages.find(msg => msg.id === newMessage.id)) {
        return prevMessages;
      }
      
      // Add message and maintain max messages limit
      const updatedMessages = [...prevMessages, newMessage];
      if (updatedMessages.length > maxMessagesToLoad) {
        return updatedMessages.slice(-maxMessagesToLoad);
      }
      
      return updatedMessages;
    });
  }, [maxMessagesToLoad]);

  const handleTypingUpdate = useCallback((typingStatus: any) => {
    setOtherUserTyping(typingStatus.is_typing);
    
    // Auto-hide typing indicator after 3 seconds
    if (typingStatus.is_typing) {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      typingTimeout.current = setTimeout(() => {
        setOtherUserTyping(false);
      }, 3000);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Messaging error:', error);
    setConnectionStatus('disconnected');
  }, []);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const { getMessages } = await import('../services/chat');
        const initialMessages = await getMessages(matchId);
        
        // Limit initial messages
        const limitedMessages = initialMessages.slice(-maxMessagesToLoad);
        setMessages(limitedMessages);
        
        if (limitedMessages.length > 0) {
          lastMessageId.current = limitedMessages[limitedMessages.length - 1].id;
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      loadMessages();
    }
  }, [matchId, maxMessagesToLoad]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!matchId) return;

    const messageSubscription = EnhancedRealtimeService.subscribeToMessages(
      matchId,
      handleNewMessage,
      handleError,
      {
        reconnectAfterMs: 3000,
        maxReconnectAttempts: 5,
        heartbeatIntervalMs: 30000
      }
    );

    const typingSubscription = enableTypingIndicators 
      ? EnhancedRealtimeService.subscribeToTyping(matchId, handleTypingUpdate, handleError)
      : null;

    setConnectionStatus('connected');

    return () => {
      EnhancedRealtimeService.unsubscribeFromMessages(matchId);
      if (typingSubscription) {
        typingSubscription.unsubscribe();
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [matchId, handleNewMessage, handleTypingUpdate, handleError, enableTypingIndicators]);

  // Process queued messages when connection is restored
  useEffect(() => {
    if (connectionStatus === 'connected' && enableOfflineSupport) {
      MessageQueueService.processQueue();
    }
  }, [connectionStatus, enableOfflineSupport]);

  // Send message with optimizations
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      
      if (enableOfflineSupport) {
        // Queue message for offline support
        await MessageQueueService.queueMessage(matchId, messageText);
      }

      const { sendMessage: chatSendMessage } = await import('../services/chat');
      const sentMessage = await chatSendMessage(matchId, messageText);
      
      if (sentMessage) {
        // Add message to local state immediately for better UX
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, sentMessage];
          if (updatedMessages.length > maxMessagesToLoad) {
            return updatedMessages.slice(-maxMessagesToLoad);
          }
          return updatedMessages;
        });
        
        lastMessageId.current = sentMessage.id;
        
        if (enableOfflineSupport) {
          // Remove from queue since it was sent successfully
          await MessageQueueService.removeFromQueue(sentMessage.id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [matchId, sending, enableOfflineSupport, maxMessagesToLoad]);

  // Typing handler with debouncing
  const handleTyping = useCallback((text: string) => {
    if (enableTypingIndicators) {
      EnhancedRealtimeService.broadcastTyping(matchId, text.length > 0, 1000);
    }
  }, [matchId, enableTypingIndicators]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    try {
      const { markMessagesAsRead } = await import('../services/chat');
      await markMessagesAsRead(matchId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [matchId]);

  // Memoized values for performance
  const memoizedMessages = useMemo(() => messages, [messages]);
  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  return {
    messages: memoizedMessages,
    loading,
    sending,
    otherUserTyping,
    connectionStatus,
    hasMessages,
    sendMessage,
    handleTyping,
    markAsRead,
    // Utility functions
    retryFailedMessages: () => MessageQueueService.processQueue(),
    clearMessageQueue: () => MessageQueueService.clearQueue()
  };
}
