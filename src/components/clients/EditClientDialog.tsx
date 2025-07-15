"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateClient, deleteClient } from '@/lib/firebase/clients';
import { getAllUsers } from '@/lib/firebase/users';
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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Save, Loader2 } from 'lucide-react';
import type { Client, User } from '@/lib/types';

interface EditClientDialogProps {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClientUpdated: (updatedClient: Client) => void;
  onClientDeleted: (clientId: string) => void;
}

export default function EditClientDialog({ 
  client, 
  isOpen, 
  onOpenChange, 
  onClientUpdated, 
  onClientDeleted 
}: EditClientDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    teamMemberIds: [] as string[]
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        teamMemberIds: client.teamMemberIds || []
      });
    }
  }, [client]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users.filter(u => u.role === 'Clinician' || u.role === 'Admin'));
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!client || !user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateClient(client.id, {
        name: formData.name.trim(),
        teamMemberIds: formData.teamMemberIds
      });

      const updatedClient = {
        ...client,
        name: formData.name.trim(),
        teamMemberIds: formData.teamMemberIds
      };

      onClientUpdated(updatedClient);
      onOpenChange(false);

      toast({
        title: "Client Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client || !user) return;

    // Check permissions
    if (user.role !== 'Super Admin' && user.role !== 'Admin') {
      toast({
        title: "Access Denied",
        description: "Only Admins and Super Admins can delete clients.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClient(client.id);
      onClientDeleted(client.id);
      onOpenChange(false);

      toast({
        title: "Client Deleted",
        description: `${client.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTeamMemberChange = (userId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: checked 
        ? [...prev.teamMemberIds, userId]
        : prev.teamMemberIds.filter(id => id !== userId)
    }));
  };

  const canDelete = user?.role === 'Super Admin' || user?.role === 'Admin';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter client name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {allUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={user.id}
                    checked={formData.teamMemberIds.includes(user.id)}
                    onCheckedChange={(checked) => handleTeamMemberChange(user.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={user.id} className="text-sm">
                    {user.name} ({user.vocation || user.role})
                  </Label>
                </div>
              ))}
            </div>
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
                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{client?.name}"? This action cannot be undone and will also delete all associated sessions and tasks.
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
