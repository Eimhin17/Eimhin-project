import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { tabPreloader } from '../services/tabPreloader';

interface UseTabPreloaderProps {
  currentTab: 'index' | 'likes' | 'chats' | 'profile';
}

export const useTabPreloader = ({ currentTab }: UseTabPreloaderProps) => {
  const { userProfile } = useUser();

  useEffect(() => {
    if (!userProfile?.id) {
      return;
    }

    // Preload adjacent tabs based on current tab
    const preloadAdjacentTabs = async () => {
      switch (currentTab) {
        case 'index':
          // User is on swiping screen, preload likes (next tab)
          setTimeout(() => tabPreloader.preloadLikes(userProfile.id), 1000);
          break;
        case 'likes':
          // User is on likes screen, preload chats
          setTimeout(() => tabPreloader.preloadChats(userProfile.id), 1000);
          break;
        case 'chats':
          // User is on chats screen, preload likes (in case they go back)
          setTimeout(() => tabPreloader.preloadLikes(userProfile.id), 1000);
          break;
        case 'profile':
          // User is on profile screen, preload chats (in case they go back)
          setTimeout(() => tabPreloader.preloadChats(userProfile.id), 1000);
          break;
      }
    };

    preloadAdjacentTabs();
  }, [currentTab, userProfile?.id]);

  return {
    getPreloadedChats: () => tabPreloader.getPreloadedChats(),
    getPreloadedLikes: () => tabPreloader.getPreloadedLikes(),
    clearChats: () => tabPreloader.clearChats(),
    clearLikes: () => tabPreloader.clearLikes(),
  };
};
