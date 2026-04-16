import React, { createContext, useContext } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  show: (message: string, type: NotificationType) => void;
  hide: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NotificationContext.Provider value={{ show: () => {}, hide: () => {} }}>
    {children}
  </NotificationContext.Provider>
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
