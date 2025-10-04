import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_LIKES_AT = 'last_seen_likes_at';
const LAST_SEEN_CHATS_AT = 'last_seen_chats_at';

export const ActivityBadges = {
  getLastSeenLikesAt: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(LAST_SEEN_LIKES_AT);
    } catch {
      return null;
    }
  },
  setLastSeenLikesNow: async () => {
    try {
      await AsyncStorage.setItem(LAST_SEEN_LIKES_AT, new Date().toISOString());
    } catch {}
  },
  getLastSeenChatsAt: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(LAST_SEEN_CHATS_AT);
    } catch {
      return null;
    }
  },
  setLastSeenChatsNow: async () => {
    try {
      await AsyncStorage.setItem(LAST_SEEN_CHATS_AT, new Date().toISOString());
    } catch {}
  },
};

