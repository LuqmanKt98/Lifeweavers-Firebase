
// src/components/layout/SpecialNotificationBanner.tsx
"use client";

import type { SpecialNotification } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, ShieldAlert, Megaphone, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SpecialNotificationBannerProps {
  notifications: SpecialNotification[];
  onDismiss: (id: string) => void;
}

export default function SpecialNotificationBanner({ notifications, onDismiss }: SpecialNotificationBannerProps) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getIcon = (type: SpecialNotification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
        return <ShieldAlert className="h-5 w-5" />;
      case 'promo':
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariantStyles = (type: SpecialNotification['type']): string => {
    switch (type) {
      case 'info':
        // Using default Alert variant, can add specific styles if needed
        return "border-primary/30 bg-primary/5 text-primary [&>svg]:text-primary";
      case 'warning':
        return "border-accent text-accent-foreground bg-accent/20 [&>svg]:text-accent-foreground";
      case 'critical':
        // Uses 'destructive' variant of Alert internally by passing variant prop
        return ""; 
      case 'promo':
        return "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-400 dark:border-purple-500/70 dark:bg-purple-500/20 [&>svg]:text-purple-600 dark:[&>svg]:text-purple-500";
      default:
        return "";
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {notifications.map((notification) => (
        <Alert 
          key={notification.id} 
          variant={notification.type === 'critical' ? 'destructive' : 'default'}
          className={cn("relative", getVariantStyles(notification.type))}
        >
          {getIcon(notification.type)}
          <AlertTitle className="font-semibold">{notification.title}</AlertTitle>
          <AlertDescription>
            {notification.message}
            {notification.link && (
              <Button variant="link" asChild className="p-0 h-auto ml-2 text-sm font-medium">
                <Link href={notification.link}>
                  Learn More <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onDismiss(notification.id)}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
