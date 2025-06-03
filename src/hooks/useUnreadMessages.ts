// src/hooks/useUnreadMessages.ts
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadMessageCount } from '@/lib/firebase/messages';

export function useUnreadMessages() {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount(currentUser.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up interval to refresh unread count periodically
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const incrementUnread = () => {
    setUnreadCount(prev => prev + 1);
  };

  return {
    unreadCount,
    loading,
    markAsRead,
    incrementUnread
  };
}
