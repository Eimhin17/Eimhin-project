import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { supabase } from '../../lib/supabase';
import { ChatService } from '../../services/chat';
import { ChatMessage } from '../../lib/supabase';
import { CircularProfilePicture } from '../../components/CircularProfilePicture';
import ReportProfileModal from '../../components/ReportProfileModal';

export default function ChatConversationScreen() {
  const { id, name, userId } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Get current user ID and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await loadMessages();
          // Mark messages as read
          await ChatService.markMessagesAsRead(id as string);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      initializeChat();
    }
  }, [id]);

  // Load messages from Supabase
  const loadMessages = async () => {
    try {
      const chatMessages = await ChatService.getMessages(id as string);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!id || !currentUserId) return;

    console.log('🔔 Setting up real-time subscriptions for chat:', id);

    const subscription = ChatService.subscribeToMessages(id as string, (newMessage) => {
      console.log('📨 Received new message in chat:', newMessage);
      
      setMessages(prevMessages => {
        // Check if message already exists to prevent duplicates
        if (prevMessages.find(msg => msg.id === newMessage.id)) {
          console.log('⚠️ Message already exists, skipping duplicate');
          return prevMessages;
        }
        
        console.log('✅ Adding new message to chat');
        return [...prevMessages, newMessage];
      });

      // Mark messages as read if they're from the other user
      if (newMessage.sender_id !== currentUserId) {
        console.log('📖 Marking message as read');
        ChatService.markMessagesAsRead(id as string);
      }
    });

    // Subscribe to typing status
    const typingSubscription = ChatService.subscribeToTyping(id as string, (typingStatus) => {
      console.log('⌨️ Typing status update:', typingStatus);
      if (typingStatus.user_id !== currentUserId) {
        setOtherUserTyping(typingStatus.is_typing);
      }
    });

    return () => {
      console.log('🔌 Cleaning up subscriptions for chat:', id);
      subscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [id, currentUserId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !id || sending) return;

    try {
      setSending(true);
      console.log('📤 Sending message:', { matchId: id, message: newMessage.trim() });
      
      const sentMessage = await ChatService.sendMessage(id as string, newMessage.trim());
      
      if (sentMessage) {
        console.log('✅ Message sent successfully:', sentMessage);
        
        // Add message to local state immediately for better UX
        setMessages(prevMessages => {
          // Check if message already exists to prevent duplicates
          if (prevMessages.find(msg => msg.id === sentMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, sentMessage];
        });
        
        setNewMessage('');
        
        // Scroll to bottom after sending
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.error('❌ Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing status
  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Broadcast typing status
    if (id) {
      ChatService.broadcastTyping(id as string, text.length > 0);
    }
  };

  // Handle report button press
  const handleReport = () => {
    setShowReportModal(true);
  };

  // Handle swipe gestures
  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    const SWIPE_THRESHOLD = 100; // Minimum distance for a swipe

    if (state === State.END) {
      if (translationX > SWIPE_THRESHOLD) {
        // Swipe right - Stay in chat (do nothing)
        console.log('Swipe right - staying in chat');
      } else if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Go to home page
        console.log('Swipe left - going to home page');
        router.push('/(tabs)');
      }
    }
  };

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      // Scroll to bottom when keyboard hides
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to scroll to bottom without over-scrolling
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Read receipt component
  const ReadReceipt = ({ isRead, timestamp }: { isRead: boolean, timestamp: string }) => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <View style={styles.readReceiptContainer}>
        <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
        {isRead ? (
          <FontAwesome5 name="check-double" size={12} color="#FF4F81" />
        ) : (
          <FontAwesome5 name="check" size={12} color="#999999" />
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.sender_id === currentUserId ? styles.myMessage : styles.theirMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender_id === currentUserId ? styles.myBubble : styles.theirBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender_id === currentUserId ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.content}
        </Text>
        
        {/* Read receipt for my messages, timestamp for their messages */}
        {item.sender_id === currentUserId ? (
          <ReadReceipt isRead={item.is_read} timestamp={item.created_at} />
        ) : (
          <Text style={styles.theirTimestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
      <SafeAreaView style={styles.container}>
      {/* Apple-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={22} color="#FF4F81" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.profileContainer}>
            <TouchableOpacity 
              onPress={() => router.push(`/profile/${userId}?source=chat`)}
              style={styles.profilePictureButton}
            >
              <CircularProfilePicture
                userId={userId as string}
                size={50}
                fallbackIcon={
                  <Text style={styles.profileInitial}>
                    {typeof name === 'string' ? name.charAt(0) : 'U'}
                  </Text>
                }
              />
            </TouchableOpacity>
            <Text style={styles.headerName}>{name}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
          <FontAwesome5 name="flag" size={20} color="#FF4F81" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        bounces={false}
        overScrollMode="never"
        onContentSizeChange={() => {
          // Smooth scroll to bottom when new messages arrive
          setTimeout(() => {
            scrollToBottom();
          }, 50);
        }}
        onLayout={() => {
          // Scroll to bottom when layout changes (like keyboard appearing)
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }}
      />

      {/* Typing indicator */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>typing</Text>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      )}

      {/* Message Input with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 5}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.plusButton}>
            <FontAwesome5 name="plus" size={18} color="#FF4F81" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Message"
            value={newMessage}
            onChangeText={handleTyping}
            multiline
            placeholderTextColor="#999999"
            onFocus={() => {
              // Scroll to bottom when input is focused with extra delay for keyboard animation
              setTimeout(() => {
                scrollToBottom();
              }, 200);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <FontAwesome5 
              name="paper-plane" 
              size={16} 
              color={newMessage.trim() ? "#FFFFFF" : "#CCCCCC"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Report Modal */}
      <ReportProfileModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId as string}
        reportedUserName={name as string}
      />
    </SafeAreaView>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 45,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: -35,
  },
  // profilePicture style removed - now handled by CircularProfilePicture component
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'center',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20, // Minimal padding at bottom to prevent over-scrolling
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#FF4F81',
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1B1B3A',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  theirTimestamp: {
    fontSize: 12,
    color: '#666666',
  },
  readReceiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 13, // Added 5px more space
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 79, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1B1B3A',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#FF4F81',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#E8E8E8',
    shadowOpacity: 0,
    elevation: 0,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 79, 129, 0.05)',
    borderTopWidth: 0,
  },
  typingText: {
    fontSize: 14,
    color: '#FF4F81',
    fontStyle: 'italic',
    marginRight: 8,
    fontWeight: '500',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4F81',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  reportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  profilePictureButton: {
    // No additional styling needed - the CircularProfilePicture handles the appearance
    // This just makes the profile picture clickable
  },
});
