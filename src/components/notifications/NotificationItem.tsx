
// src/components/notifications/NotificationItem.tsx
"use client";

import type { Notification } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Info, CheckCheck, Link as LinkIcon, Edit, Trash2 } from 'lucide-react'; // Changed CheckCircle to CheckCheck
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void; // Used for archive by regular users, delete by SuperAdmin
  isSuperAdminView?: boolean; // New prop
  onEdit?: (id: string) => void; // New prop for SuperAdmin to trigger edit
}

export default function NotificationItem({ notification, onMarkAsRead, onArchive, isSuperAdminView, onEdit }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'admin_broadcast':
        return <Bell className="h-5 w-5 text-primary" />;
      case 'system_update':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'team_alert':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn(
        "shadow-sm hover:shadow-md transition-shadow",
        notification.read && !isSuperAdminView ? "bg-secondary/30 opacity-80" : "bg-card",
        isSuperAdminView && notification.read ? "border-green-500/30" : "",
        isSuperAdminView && !notification.read ? "border-orange-500/30" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <CardTitle className="text-lg font-semibold">{notification.title}</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </span>
        </div>
        {isSuperAdminView && (
            <p className="text-xs text-muted-foreground">
                Type: <span className="font-medium capitalize">{notification.type.replace('_', ' ')}</span>
                {notification.recipientUserIds && notification.recipientUserIds.length > 0
                    ? ` | Targets: ${notification.recipientUserIds.join(', ')}`
                    : (notification.type === 'admin_broadcast' ? ' | Broadcast to All' : '')}
                {notification.read ? ' | Read by recipients' : ' | Potentially Unread'}
            </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-foreground/90">{notification.content}</p>
        {notification.relatedLink && (
          <div className="mt-2">
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href={notification.relatedLink}>
                <LinkIcon className="mr-1 h-3 w-3" />
                View Details
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-3">
        {isSuperAdminView ? (
          <>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(notification.id)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onArchive(notification.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </>
        ) : (
          <>
            {!notification.read && (
              <Button variant="outline" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                <CheckCheck className="mr-2 h-4 w-4" /> Mark as Read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onArchive(notification.id)} className="text-muted-foreground hover:text-destructive">
              Archive
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
