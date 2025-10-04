import React, { createContext, useContext, useState } from 'react';
import { Animated } from 'react-native';

interface MatchNotificationContextType {
  showMatchNotification: boolean;
  setShowMatchNotification: (show: boolean) => void;
  matchOverlayOpacity: Animated.Value;
}

const MatchNotificationContext = createContext<MatchNotificationContextType | undefined>(undefined);

export function MatchNotificationProvider({ children }: { children: React.ReactNode }) {
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const matchOverlayOpacity = React.useRef(new Animated.Value(0)).current;

  return (
    <MatchNotificationContext.Provider value={{ showMatchNotification, setShowMatchNotification, matchOverlayOpacity }}>
      {children}
    </MatchNotificationContext.Provider>
  );
}

export function useMatchNotification() {
  const context = useContext(MatchNotificationContext);
  if (!context) {
    throw new Error('useMatchNotification must be used within MatchNotificationProvider');
  }
  return context;
}
