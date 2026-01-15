import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import {
  clearAllNotifications,
  getStoredNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  type Notification,
} from '../lib/notifications';

const subscribe = (callback: () => void) => {
  window.addEventListener('notifications-updated', callback);
  return () => window.removeEventListener('notifications-updated', callback);
};

const getSnapshot = () => {
  return JSON.stringify(getStoredNotifications());
};

export const useNotifications = () => {
  const notificationsString = useSyncExternalStore(subscribe, getSnapshot);
  const notifications: Notification[] = JSON.parse(notificationsString);

  const [unreadCount, setUnreadCount] = useState(getUnreadCount);

  useEffect(() => {
    setUnreadCount(getUnreadCount());
  }, [notificationsString]);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, []);

  const handleClearAll = useCallback(() => {
    clearAllNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    clearAll: handleClearAll,
  };
};
