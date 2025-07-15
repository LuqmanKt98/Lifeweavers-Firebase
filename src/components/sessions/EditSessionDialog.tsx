"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateSession, deleteSession } from '@/lib/firebase/sessions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { SessionNote } from '@/lib/types';

interface EditSessionDialogProps {
  session: SessionNote | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSessionUpdated: (updatedSession: SessionNote) => void;
  onSessionDeleted: (sessionId: string) => void;
}

export default function EditSessionDialog({ 
  session, 
  isOpen, 
  onOpenChange, 
  onSessionUpdated, 
  onSessionDeleted 
}: EditSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    dateOfSession: '',
    content: '',
    sessionType: 'therapy',
    duration: 60,
    location: ''
  });

  useEffect(() => {
    if (session) {
      setFormData({
        dateOfSession: format(new Date(session.dateOfSession), 'yyyy-MM-dd\'T\'HH:mm'),
        content: session.content,
        sessionType: session.sessionType || 'therapy',
        duration: session.duration || 60,
        location: session.location || ''
      });
    }
  }, [session]);

  const handleSave = async () => {
    if (!session || !user) return;

    if (!formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Session content is required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const updates = {
        dateOfSession: new Date(formData.dateOfSession).toISOString(),
        content: formData.content.trim(),
        sessionType: formData.sessionType,
        duration: formData.duration,
        location: formData.location.trim()
      };

      await updateSession(session.id, updates);

      const updatedSession = {
        ...session,
        ...updates
      };

      onSessionUpdated(updatedSession);
      onOpenChange(false);

      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !user) return;

    // Check permissions - only session creator, admins, or super admins can delete
    const canDelete = session.attendingClinicianId === user.id || 
                     user.role === 'Admin' || 
                     user.role === 'Super Admin';

    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "You can only delete sessions you created, or you must be an Admin.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSession(session.id);
      onSessionDeleted(session.id);
      onOpenChange(false);

      toast({
        title: "Session Deleted",
        description: "Session has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = session?.attendingClinicianId === user?.id || 
                 user?.role === 'Admin' || 
                 user?.role === 'Super Admin';

  const canDelete = session?.attendingClinicianId === user?.id || 
                   user?.role === 'Admin' || 
                   user?.role === 'Super Admin';

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            You can only edit sessions you created, or you must be an Admin.
          </p>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="dateOfSession">Date & Time</Label>
            <Input
              id="dateOfSession"
              type="datetime-local"
              value={formData.dateOfSession}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfSession: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="sessionType">Session Type</Label>
            <Select value={formData.sessionType} onValueChange={(value) => setFormData(prev => ({ ...prev, sessionType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="therapy">Therapy</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="group">Group Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="240"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Room 101, Online"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="content">Session Notes</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter session notes..."
              rows={8}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading || isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this session? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
