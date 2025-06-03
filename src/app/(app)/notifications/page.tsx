// src/app/(app)/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { Notification, User } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import NotificationItem from "@/components/notifications/NotificationItem";
import CreateNotificationDialog from "@/components/notifications/CreateNotificationDialog";
import EditNotificationDialog from "@/components/notifications/EditNotificationDialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  PlusCircle,
  CheckCheck,
  Edit,
  Trash2,
  Send,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToAllNotifications,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  markAllUserNotificationsAsRead,
  deleteNotification,
  addNotification,
  updateNotification
} from "@/lib/firebase/notifications";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isCreateNotificationDialogOpen, setIsCreateNotificationDialogOpen] =
    useState(false);
  const [isEditNotificationDialogOpen, setIsEditNotificationDialogOpen] =
    useState(false);
  const [notificationToEdit, setNotificationToEdit] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const isSuperAdminView = user?.role === "Super Admin";

  useEffect(() => {
    if (!user) return;

    // Load dismissed notifications from localStorage
    const dismissed = localStorage.getItem(`dismissed_notifications_${user.id}`);
    const dismissedSet = dismissed ? new Set(JSON.parse(dismissed)) : new Set();
    setDismissedNotifications(dismissedSet);

    // Subscribe to notifications from Firebase
    let unsubscribe: () => void;

    if (isSuperAdminView) {
      // Super Admin sees all notifications
      unsubscribe = subscribeToAllNotifications((allNotifications) => {
        setNotifications(allNotifications);
        setLoading(false);
      });
    } else {
      // Regular users see filtered notifications
      unsubscribe = subscribeToUserNotifications(user.id, (userNotifications) => {
        setNotifications(userNotifications);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [user, isSuperAdminView]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      toast({ title: "Notification marked as read." });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllUserNotificationsAsRead(user.id);
      toast({ title: "All notifications marked as read." });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveNotification = async (id: string) => {
    if (isSuperAdminView) {
      // Super Admin can delete notifications
      try {
        await deleteNotification(id);
        toast({
          title: "Notification Deleted",
          description: "The notification has been permanently removed.",
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast({
          title: "Error",
          description: "Failed to delete notification. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Regular users dismiss notifications (store in localStorage)
      const newDismissed = new Set(dismissedNotifications);
      newDismissed.add(id);
      setDismissedNotifications(newDismissed);

      if (user) {
        localStorage.setItem(
          `dismissed_notifications_${user.id}`,
          JSON.stringify(Array.from(newDismissed))
        );
      }

      setNotifications(prev => prev.filter(n => n.id !== id));

      toast({
        title: "Notification Dismissed",
        description: "The notification has been removed from your view.",
      });
    }
  };

  const handleEditNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setNotificationToEdit(notification);
      setIsEditNotificationDialogOpen(true);
    }
  };

  const handleNotificationUpdated = async (updatedNotification: Notification) => {
    try {
      await updateNotification(updatedNotification.id, updatedNotification);
      toast({
        title: "Success",
        description: "Notification updated successfully.",
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "Error",
        description: "Failed to update notification. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  const handleNotificationAdded = async (newNotification: Omit<Notification, "id" | "timestamp">) => {
    try {
      await addNotification(newNotification);
      toast({
        title: "Success",
        description: "Notification created successfully.",
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // For regular users, exclude dismissed notifications
    if (!isSuperAdminView && dismissedNotifications.has(n.id)) {
      return false;
    }

    return filter === "all" || (filter === "unread" && !n.read);
  });

  const unreadCount = notifications.filter((n) => {
    // For regular users, exclude dismissed notifications from unread count
    if (!isSuperAdminView && dismissedNotifications.has(n.id)) {
      return false;
    }
    return !n.read;
  }).length;

  if (!user) {
    return <p>Loading notifications...</p>;
  }

  const canBroadcast = user.role === "Admin" || user.role === "Super Admin";

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <BellRing className="h-7 w-7" />
              {isSuperAdminView ? "Manage All Notifications" : "Notifications"}
            </CardTitle>
            <CardDescription>
              {isSuperAdminView
                ? `Review, edit, or delete all system notifications. Total: ${notifications.length}.`
                : `Stay updated with important alerts and announcements. ${
                    unreadCount > 0
                      ? `You have ${unreadCount} unread notifications.`
                      : "No new notifications."
                  }`}
            </CardDescription>
          </div>
          {canBroadcast && (
            <Button
              variant="default"
              onClick={() => setIsCreateNotificationDialogOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" /> Create Notification
            </Button>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | "unread")}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  {isSuperAdminView
                    ? `Unread System-Wide (${
                        notifications.filter((n) => !n.read).length
                      })`
                    : `My Unread (${unreadCount})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isSuperAdminView && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex-1 sm:flex-none"
                >
                  <CheckCheck className="mr-2 h-4 w-4" /> Mark My Visible Unread
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading notifications...
              </p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchiveNotification}
                  isSuperAdminView={isSuperAdminView}
                  onEdit={isSuperAdminView ? handleEditNotification : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BellRing className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {filter === "unread"
                  ? "No unread notifications."
                  : "No notifications here."}
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You are all caught up!"
                  : "Check back later for new updates."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canBroadcast && (
        <CreateNotificationDialog
          isOpen={isCreateNotificationDialogOpen}
          onOpenChange={setIsCreateNotificationDialogOpen}
          onNotificationAdded={handleNotificationAdded}
        />
      )}

      {isSuperAdminView && (
        <EditNotificationDialog
          isOpen={isEditNotificationDialogOpen}
          onOpenChange={setIsEditNotificationDialogOpen}
          onNotificationUpdated={handleNotificationUpdated}
          notificationToEdit={notificationToEdit}
        />
      )}
    </div>
  );
}
