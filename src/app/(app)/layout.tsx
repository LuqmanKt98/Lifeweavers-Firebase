
// src/app/(app)/layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { SpecialNotification } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import SpecialNotificationBanner from '@/components/layout/SpecialNotificationBanner';

import { useDataCleanup } from '@/hooks/useDataCleanup';
// Real special notifications will be managed through Firebase


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth(); // Changed to currentUser
  const router = useRouter();
  const pathname = usePathname();

  // Auto-cleanup orphaned data in background
  useDataCleanup(!!currentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSpecialNotifications, setActiveSpecialNotifications] = useState<SpecialNotification[]>([]);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
    }

    // Special notifications will be loaded from Firebase in the future
    setActiveSpecialNotifications([]);

  }, [currentUser, loading, router]);

  // Auto-dismiss notifications when navigating to a different page
  useEffect(() => {
    if (activeSpecialNotifications.length > 0) {
      // Auto-dismiss all notifications when pathname changes
      activeSpecialNotifications.forEach(notification => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`dismissed_special_notification_${notification.id}`, 'true');
        }
      });
      setActiveSpecialNotifications([]);
    }
  }, [pathname]); // This will trigger when the user navigates to a different page


  const getPageTitle = (currentPathname: string): string => {
    if (currentPathname === '/dashboard') return 'Dashboard';
    if (currentPathname === '/appointments') return 'Appointments';
    if (currentPathname === '/cases') return 'Cases';
    if (currentPathname.startsWith('/clients/')) {
      return 'Client Session Notes';
    }
    if (currentPathname === '/admin/users') return 'User Management';
    if (currentPathname === '/admin/cases') return 'Cases Management';
    if (currentPathname === '/admin/calendar') return 'Calendar Management';
    if (currentPathname === '/notifications') return 'Notifications';
    if (currentPathname === '/messages') return 'Messages';
    if (currentPathname === '/knowledge-base') return 'Knowledge Base';
    if (currentPathname.startsWith('/knowledge-base/')) return 'Knowledge Base Article';
    if (currentPathname === '/resources') return 'Resources';
    if (currentPathname.startsWith('/resources/')) return 'Resource Details';
    if (currentPathname === '/profile-settings') return 'Profile Settings';
    return 'LWV CLINIC E-DOC';
  };

  const pageTitle = getPageTitle(pathname);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleDismissSpecialNotification = (id: string) => {
    setActiveSpecialNotifications(prev => prev.filter(n => n.id !== id));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dismissed_special_notification_${id}`, 'true');
    }
  };

  return (
    <div className="flex h-screen bg-secondary/50 overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out min-w-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <AppHeader user={currentUser} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} pageTitle={pageTitle} />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0"> {/* Added min-h-0 for proper flex behavior */}
          {/* Conditional rendering based on page */}
          {pathname === '/messages' ? (
            // Messages page gets full height without ScrollArea wrapper
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          ) : (
            // Other pages use ScrollArea
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 md:p-6 lg:p-8 space-y-6">
               {children}
              </div>
            </ScrollArea>
          )}
          {/* Banner section moved inside main, after content */}
          {activeSpecialNotifications.length > 0 && (
            <div className="p-4 md:p-6 lg:p-8 pt-0">
              <SpecialNotificationBanner
                notifications={activeSpecialNotifications}
                onDismiss={handleDismissSpecialNotification}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
