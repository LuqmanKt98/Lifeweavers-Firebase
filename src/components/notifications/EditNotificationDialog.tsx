// src/components/notifications/EditNotificationDialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Notification, NotificationType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, X, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EditNotificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificationUpdated: (updatedNotification: Notification) => void;
  notificationToEdit: Notification | null;
}

export default function EditNotificationDialog({
  isOpen,
  onOpenChange,
  onNotificationUpdated,
  notificationToEdit,
}: EditNotificationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "admin_broadcast" as NotificationType,
    recipientUserIds: [] as string[],
  });

  // Populate form when notificationToEdit changes
  useEffect(() => {
    if (notificationToEdit) {
      setFormData({
        title: notificationToEdit.title,
        content: notificationToEdit.content,
        type: notificationToEdit.type,
        recipientUserIds: notificationToEdit.recipientUserIds || [],
      });
    }
  }, [notificationToEdit]);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "admin_broadcast",
      recipientUserIds: [],
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !notificationToEdit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedNotification: Notification = {
        ...notificationToEdit,
        title: formData.title,
        content: formData.content,
        type: formData.type,
      };

      // Only add recipientUserIds if it's not an admin_broadcast
      if (formData.type !== "admin_broadcast") {
        updatedNotification.recipientUserIds = formData.recipientUserIds;
      } else {
        // Remove recipientUserIds for admin_broadcast
        delete updatedNotification.recipientUserIds;
      }

      await onNotificationUpdated(updatedNotification);
      toast({
        title: "Success",
        description: "Notification updated successfully.",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating notification:", error);
      toast({
        title: "Error",
        description: "Failed to update notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  if (!notificationToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Notification
            </DialogTitle>
            <DialogDescription>
              Update the notification details. Changes will be visible to all users who can see this notification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: NotificationType) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_broadcast">
                    Broadcast Message
                  </SelectItem>
                  <SelectItem value="system_update">System Update</SelectItem>
                  <SelectItem value="team_alert">Team Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter notification content"
                rows={4}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Show notification metadata */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p><strong>Created:</strong> {new Date(notificationToEdit.timestamp).toLocaleString()}</p>
              {notificationToEdit.senderName && (
                <p><strong>Created by:</strong> {notificationToEdit.senderName}</p>
              )}
              <p><strong>Status:</strong> {notificationToEdit.read ? 'Read' : 'Unread'}</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
