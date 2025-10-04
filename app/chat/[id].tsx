import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { supabase } from '../../lib/supabase';
import { ChatService } from '../../services/chat';
import { ChatMessage } from '../../lib/supabase';
import { CircularProfilePicture } from '../../components/CircularProfilePicture';
import ReportProfileModal from '../../components/ReportProfileModal';
import BackButton from '../../components/ui/BackButton';
import * as Haptics from 'expo-haptics';
import { playLightHaptic } from '../../utils/haptics';
import { useCustomFonts, Fonts } from '../../utils/fonts';
import { dataCache, CACHE_NAMESPACES } from '../../services/dataCache';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';

const COLORS = {
  background: '#FFF0F5',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF0F5',
  surfaceBorder: '#FFE5F0',
  textPrimary: '#1B1B3A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  accentPink: '#FF4F81',
  accentPurple: '#c3b1e1',
};

export default function ChatConversationScreen() {
  const { id, name, userId } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const inputContainerRef = useRef<View>(null);
  const fontsLoaded = useCustomFonts();
  const displayName = Array.isArray(name) ? name[0] : (name as string | undefined);
  // Derive first name only from any provided display name (e.g., "Alex (@alex123)" -> "Alex")
  const firstName = displayName
    ? displayName
        .replace(/\s*\(@.*\)\s*$/, '') // strip trailing username like ("@handle") if present
        .trim()
        .split(/\s+/)[0]
    : undefined;
  const profileInitial = (firstName || displayName) ? (firstName || displayName)!.charAt(0) : 'U';

  // Back/report button animations
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const reportButtonScale = useRef(new Animated.Value(1)).current;

  // Message send animation
  const [animatingMessage, setAnimatingMessage] = useState<string | null>(null);
  const messageAnimY = useRef(new Animated.Value(0)).current;
  const messageAnimOpacity = useRef(new Animated.Value(1)).current;
  const messageAnimScale = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) {
    return null;
  }

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await loadMessages();
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

  const loadMessages = async (forceRefresh: boolean = false) => {
    try {
      const chatMessages = await ChatService.getMessages(id as string, forceRefresh);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    if (!id || !currentUserId) return;

    const subscription = ChatService.subscribeToMessages(id as string, (incoming) => {
      setMessages(prev => {
        if (prev.find(msg => msg.id === incoming.id)) {
          return prev;
        }
        return [...prev, incoming];
      });

      if (incoming.sender_id !== currentUserId) {
        ChatService.markMessagesAsRead(id as string);
      }
    });

    const typingSubscription = ChatService.subscribeToTyping(id as string, status => {
      if (status.user_id !== currentUserId) {
        setOtherUserTyping(status.is_typing);
      }
    });

    return () => {
      subscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [id, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !id || sending) return;

    const messageToSend = newMessage.trim();

    try {
      setSending(true);

      // Start the morphing animation
      setAnimatingMessage(messageToSend);
      setNewMessage('');

      // Animate the message morphing and moving up
      messageAnimY.setValue(0);
      messageAnimOpacity.setValue(1);
      messageAnimScale.setValue(1);

      Animated.parallel([
        Animated.timing(messageAnimY, {
          toValue: -120,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnimOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(messageAnimScale, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(messageAnimScale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setAnimatingMessage(null);
      });

      const sent = await ChatService.sendMessage(id as string, messageToSend);

      if (sent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMessages(prev => {
          if (prev.find(msg => msg.id === sent.id)) {
            return prev;
          }
          return [...prev, sent];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAnimatingMessage(null);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (id) {
      ChatService.broadcastTyping(id as string, text.length > 0);
    }
  };

  const handleReport = () => setShowReportModal(true);

  const animatePress = (scaleRef: Animated.Value, cb?: () => void) => {
    Animated.sequence([
      Animated.timing(scaleRef, { toValue: 0.9, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleRef, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => cb && cb());
  };

  const handleBackPress = () => {
    playLightHaptic();
    Animated.parallel([
      Animated.timing(backButtonOpacity, { toValue: 0.85, duration: 90, useNativeDriver: true }),
      Animated.timing(backButtonScale, { toValue: 0.92, duration: 90, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(backButtonOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(backButtonScale, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]).start(() => {
        router.push('/chats');
      });
    });
  };

  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    const SWIPE_THRESHOLD = 100;

    if (state === State.END) {
      if (translationX < -SWIPE_THRESHOLD) {
        router.push('/(tabs)');
      }
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollToBottom(), 150);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const ReadReceipt = ({ isRead }: { isRead: boolean; timestamp: string }) => {
    return (
      <View style={styles.readReceiptContainer}>
        {isRead ? (
          <Ionicons name="checkmark-done" size={12} color={COLORS.accentPink} />
        ) : (
          <Ionicons name="checkmark" size={12} color={COLORS.textTertiary} />
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === currentUserId;

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          {isMine ? (
            <ReadReceipt isRead={item.is_read} timestamp={item.created_at} />
          ) : null}

          {/* Bubble tail for received messages only */}
          {!isMine && (
            <>
              <View style={[styles.tailCircleBorderBase, styles.theirTailBorderCircle]} />
              <View style={[styles.tailCircleBase, styles.theirTailCircle]} />
              <View style={[styles.tailCircleMask, styles.theirTailMask]} />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Animated.View style={{ transform: [{ scale: backButtonScale }], opacity: backButtonOpacity }}>
              <BackButton
                onPress={handleBackPress}
                size={60}
                iconSize={28}
                color={COLORS.accentPurple}
                style={styles.backButton}
                activeOpacity={0.85}
              />
            </Animated.View>

            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>Chatting with</Text>
              <View style={styles.headerProfileRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/profile/${userId}?source=chat`)}
                  style={styles.profilePictureButton}
                  activeOpacity={0.85}
                >
                  <CircularProfilePicture
                    userId={userId as string}
                    size={48}
                    fallbackIcon={<Text style={styles.profileInitial}>{profileInitial}</Text>}
                  />
                </TouchableOpacity>
                <Text style={styles.headerName}>{firstName || 'Unknown'}</Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: reportButtonScale }] }}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  playLightHaptic();
                  animatePress(reportButtonScale, handleReport);
                }}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="flag" size={24} color={COLORS.accentPink} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.chatBody}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
            onContentSizeChange={() => setTimeout(() => scrollToBottom(), 50)}
            onLayout={() => setTimeout(() => scrollToBottom(), 100)}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputContainer} ref={inputContainerRef}>
            {otherUserTyping && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Typing</Text>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={newMessage}
                onChangeText={handleTyping}
                multiline
                onFocus={() => setTimeout(() => scrollToBottom(), 200)}
              />
              <TouchableOpacity
                style={styles.sendIconButton}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="send"
                  size={24}
                  color={newMessage.trim() ? COLORS.accentPink : COLORS.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Animated message morphing overlay */}
        {animatingMessage && (
          <Animated.View
            style={[
              styles.animatedMessageOverlay,
              {
                transform: [
                  { translateY: messageAnimY },
                  { scale: messageAnimScale },
                ],
                opacity: messageAnimOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.messageBubble, styles.myBubble]}>
              <Text style={[styles.messageText, styles.myMessageText]}>
                {animatingMessage}
              </Text>
            </View>
          </Animated.View>
        )}

        <ReportProfileModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={userId as string}
          reportedUserName={displayName || 'Unknown'}
        />
      </SafeAreaView>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    backgroundColor: COLORS.background,
    // Reduce horizontal padding so back/report sit closer to edges
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Remove extra inner padding so edge buttons align with container padding
    paddingHorizontal: 0,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  profilePictureButton: {
    marginRight: SPACING.sm,
    borderRadius: 32,
    padding: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: 'rgba(195, 177, 225, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  profileInitial: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: COLORS.accentPink,
  },
  headerName: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  chatBody: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.lg,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 0,
    paddingBottom: SPACING.lg,
  },
  messageContainer: {
    flex: 1,
    marginBottom: SPACING.sm,
    paddingRight: 0,
    paddingLeft: 0,
  },
  myMessage: {
    alignItems: 'flex-end',
    paddingLeft: 0,
  },
  theirMessage: {
    alignItems: 'flex-start',
    marginLeft: -SPACING.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: COLORS.accentPink,
    borderTopRightRadius: BORDER_RADIUS.sm,
    borderBottomRightRadius: BORDER_RADIUS.sm,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  theirBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderTopLeftRadius: BORDER_RADIUS.sm,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.surface,
  },
  theirMessageText: {
    color: COLORS.textPrimary,
  },
  // Bubble tails (iMessage-like rounded tails using circles + masking)
  tailCircleBase: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    bottom: 0,
  },
  tailCircleBorderBase: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    bottom: 0,
  },
  tailCircleMask: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    bottom: 0,
  },
  myTailCircle: {
    right: -6,
    backgroundColor: COLORS.accentPink,
  },
  myTailMask: {
    right: -2,
  },
  theirTailBorderCircle: {
    left: -7,
    backgroundColor: COLORS.surfaceBorder,
  },
  theirTailCircle: {
    left: -6,
    backgroundColor: COLORS.surface,
  },
  theirTailMask: {
    left: -2,
  },
  readReceiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginRight: 6,
  },
  theirTimestamp: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(195, 177, 225, 0.18)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginLeft: 0,
    marginBottom: SPACING.xs,
  },
  typingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: COLORS.accentPurple,
    marginRight: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentPurple,
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
  inputContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: COLORS.textPrimary,
    maxHeight: 140,
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: 'center',
  },
  sendIconButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  animatedMessageOverlay: {
    position: 'absolute',
    bottom: SPACING.sm + 44,
    right: SPACING.lg,
    maxWidth: '80%',
    zIndex: 1000,
  },
});
