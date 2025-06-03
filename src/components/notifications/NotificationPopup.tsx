// src/components/notifications/NotificationPopup.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUserNotifications } from '@/lib/firebase/notifications';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NotificationPopupProps {
  onClose: () => void;
}

export default function NotificationPopup({ onClose }: NotificationPopupProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to user notifications from Firebase
    const unsubscribe = subscribeToUserNotifications(currentUser.id, (userNotifications) => {
      // Show only recent notifications (last 7 days) and limit to 5
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentNotifications = userNotifications
        .filter(notification => {
          const notificationDate = new Date(notification.timestamp);
          return notificationDate >= weekAgo && !notification.read;
        })
        .slice(0, 5);

      setNotifications(recentNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin_broadcast':
        return <Bell className="h-4 w-4" />;
      case 'system_update':
        return <AlertCircle className="h-4 w-4" />;
      case 'team_alert':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'admin_broadcast':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'system_update':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'team_alert':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="fixed top-20 right-4 w-96 z-50 shadow-lg border-2 animate-in slide-in-from-right-5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed top-20 right-4 w-96 z-50 shadow-lg border-2 animate-in slide-in-from-right-5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Recent Notifications
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent notifications</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-3 border-t">
          <Link href="/notifications">
            <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
              View All Notifications
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
