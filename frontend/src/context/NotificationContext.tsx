import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  message: string | null;
  type: NotificationType | null;
  show: (message: string, type: NotificationType) => void;
  hide: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<NotificationType | null>(null);

  const show = useCallback((newMessage: string, newType: NotificationType) => {
    setMessage(newMessage);
    setType(newType);
    setTimeout(() => {
      setMessage(null);
      setType(null);
    }, 3000);
  }, []);

  const hide = useCallback(() => {
    setMessage(null);
    setType(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ message, type, show, hide }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
