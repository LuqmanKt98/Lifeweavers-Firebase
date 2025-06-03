// src/components/messages/UnreadMessageBadge.tsx
"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUserMessageThreads } from '@/lib/firebase/messages';

interface UnreadMessageBadgeProps {
  className?: string;
}

export default function UnreadMessageBadge({ className }: UnreadMessageBadgeProps) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    // Subscribe to real-time thread updates
    const unsubscribe = subscribeToUserMessageThreads(currentUser.id, (threads) => {
      let totalUnread = 0;
      threads.forEach(thread => {
        const unreadCounts = thread.unreadCounts || {};
        totalUnread += unreadCounts[currentUser.id] || 0;
      });
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}
