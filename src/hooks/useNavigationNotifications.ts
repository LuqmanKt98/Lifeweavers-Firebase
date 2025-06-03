// src/hooks/useNavigationNotifications.ts
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to handle auto-dismissal of notifications when navigating away from dashboard
 * This ensures notifications are only shown on the dashboard initially
 */
export function useNavigationNotifications() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // If user navigates away from dashboard, mark notifications as "seen" for this session
    if (pathname !== '/dashboard') {
      const sessionKey = `notifications_seen_${user.id}_${new Date().toDateString()}`;
      
      // Check if we've already marked notifications as seen today
      const alreadySeen = localStorage.getItem(sessionKey);
      
      if (!alreadySeen) {
        // Mark as seen for today - this prevents notifications from showing again
        // until the next day or until new notifications arrive
        localStorage.setItem(sessionKey, 'true');
      }
    }
  }, [pathname, user]);

  return {
    isDashboard: pathname === '/dashboard',
    shouldShowNotifications: pathname === '/dashboard'
  };
}
