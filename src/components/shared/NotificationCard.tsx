// src/components/shared/NotificationCard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  X,
  AlertCircle,
  Info,
  Users,
  Settings,
  ExternalLink,
  Clock,
  CheckCheck,
  Loader2
} from 'lucide-react';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useNavigationNotifications } from '@/hooks/useNavigationNotifications';
import { subscribeToUserNotifications, markAllUserNotificationsAsRead } from '@/lib/firebase/notifications';

interface NotificationCardProps {
  onDismissAll?: () => void;
}

export default function NotificationCard({ onDismissAll }: NotificationCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { shouldShowNotifications } = useNavigationNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Load dismissed notifications from localStorage
    const dismissed = localStorage.getItem(`dismissed_notifications_${currentUser.id}`);
    const dismissedSet = dismissed ? new Set(JSON.parse(dismissed)) : new Set();
    setDismissedNotifications(dismissedSet);

    // Subscribe to user notifications from Firebase
    const unsubscribe = subscribeToUserNotifications(currentUser.id, (userNotifications) => {
      // Filter out dismissed notifications and read notifications
      const filteredNotifications = userNotifications.filter(notification =>
        !dismissedSet.has(notification.id) && !notification.read
      );

      setNotifications(filteredNotifications);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDismissNotification = (notificationId: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(notificationId);
    setDismissedNotifications(newDismissed);

    // Save to localStorage
    if (currentUser) {
      localStorage.setItem(
        `dismissed_notifications_${currentUser.id}`,
        JSON.stringify(Array.from(newDismissed))
      );
    }

    // Remove from current notifications
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    toast({
      title: "Notification Dismissed",
      description: "The notification has been removed.",
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;

    setMarkingAllAsRead(true);
    try {
      await markAllUserNotificationsAsRead(currentUser.id);

      toast({
        title: "All Notifications Marked as Read",
        description: "All your notifications have been marked as read.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleDismissAll = () => {
    const allNotificationIds = notifications.map(n => n.id);
    const newDismissed = new Set([...dismissedNotifications, ...allNotificationIds]);
    setDismissedNotifications(newDismissed);

    // Save to localStorage
    if (currentUser) {
      localStorage.setItem(
        `dismissed_notifications_${currentUser.id}`,
        JSON.stringify(Array.from(newDismissed))
      );
    }

    setNotifications([]);

    if (onDismissAll) {
      onDismissAll();
    }

    toast({
      title: "All Notifications Dismissed",
      description: "All notifications have been cleared.",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin_broadcast':
        return <Settings className="h-4 w-4" />;
      case 'team_alert':
        return <Users className="h-4 w-4" />;
      case 'system_update':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'admin_broadcast':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'team_alert':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'system_update':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Only show notifications on dashboard and if there are notifications
  if (!shouldShowNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            New Notifications ({notifications.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              className="text-xs"
            >
              {markingAllAsRead ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark All Read
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismissAll}
              className="text-xs"
            >
              Dismiss All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Badge className={`${getNotificationColor(notification.type)} flex items-center gap-1`}>
                  {getNotificationIcon(notification.type)}
                  <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm leading-tight">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </div>
                      {notification.relatedLink && (
                        <Link
                          href={notification.relatedLink}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View Details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismissNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {notifications.length > 5 && (
            <div className="text-center py-2">
              <Link href="/notifications">
                <Button variant="outline" size="sm">
                  View All {notifications.length} Notifications
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
