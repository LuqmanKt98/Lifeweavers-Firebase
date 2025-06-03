// src/components/notifications/CreateNotificationDialog.tsx
"use client";

import { useState, type FormEvent } from "react";
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
import { Loader2, PlusCircle, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CreateNotificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificationAdded: (newNotification: Omit<Notification, "id" | "timestamp">) => void;
}

export default function CreateNotificationDialog({
  isOpen,
  onOpenChange,
  onNotificationAdded,
}: CreateNotificationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "admin_broadcast" as NotificationType,
    recipientUserIds: [] as string[],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newNotification: Omit<Notification, "id" | "timestamp"> = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        read: false,
        senderName: user?.name || "System",
        senderRole: user?.role || "System",
      };

      // Only add recipientUserIds if it's not an admin_broadcast
      if (formData.type !== "admin_broadcast") {
        newNotification.recipientUserIds = formData.recipientUserIds;
      }

      await onNotificationAdded(newNotification);
      setFormData({
        title: "",
        content: "",
        type: "admin_broadcast",
        recipientUserIds: [],
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        title: "Error",
        description: "Failed to create notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Notification</DialogTitle>
            <DialogDescription>
              Create a new notification to broadcast to all users or specific
              recipients.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: NotificationType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter notification content"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
