// src/components/admin/EditUserDialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, Shield, AlertTriangle, Eye, EyeOff, Key } from 'lucide-react';
import { updateUser, getUsersByRole, getUserById } from '@/lib/firebase/users';

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (updatedUser: User) => void;
  userToEdit: User | null;
}

export default function EditUserDialog({ isOpen, onOpenChange, onUserUpdated, userToEdit }: EditUserDialogProps) {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [vocation, setVocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Determine available roles based on current user's role
  const getAvailableRoles = (): UserRole[] => {
    if (currentUser?.role === 'Super Admin') {
      return ['Super Admin', 'Admin', 'Clinician'];
    }
    return ['Admin', 'Clinician'];
  };

  const availableRoles = getAvailableRoles();

  // Populate form when userToEdit changes
  useEffect(() => {
    const fetchUserPassword = async () => {
      if (userToEdit && currentUser?.role === 'Super Admin') {
        try {
          // Fetch the complete user data including password
          const fullUserData = await getUserById(userToEdit.id);
          if (fullUserData) {
            setName(fullUserData.name);
            setEmail(fullUserData.email);
            setRole(fullUserData.role);
            setVocation(fullUserData.vocation || '');
            setPassword(fullUserData.password || '');
          }
        } catch (error) {
          console.error('Error fetching user password:', error);
          // Fallback to userToEdit data
          setName(userToEdit.name);
          setEmail(userToEdit.email);
          setRole(userToEdit.role);
          setVocation(userToEdit.vocation || '');
          setPassword('');
        }
      } else if (userToEdit) {
        // For non-Super Admin users, don't fetch password
        setName(userToEdit.name);
        setEmail(userToEdit.email);
        setRole(userToEdit.role);
        setVocation(userToEdit.vocation || '');
        setPassword('');
      }
    };

    fetchUserPassword();
  }, [userToEdit, currentUser]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('');
    setVocation('');
    setPassword('');
    setShowPassword(false);
    setIsSaving(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role || !userToEdit) {
      toast({
        title: "Missing Information",
        description: "Please fill in Name, Email, and Role.",
        variant: "destructive",
      });
      return;
    }

    // Protect the main Super Admin account from role changes
    if (userToEdit.email === 'hello@lifeweavers.org' && role !== 'Super Admin') {
      toast({
        title: "Cannot Change Role",
        description: "The main Super Admin account (hello@lifeweavers.org) must remain a Super Admin to ensure system integrity.",
        variant: "destructive",
      });
      return;
    }

    // Validation: Cannot change Super Admin role if it's the last one
    if (userToEdit.role === 'Super Admin' && role !== 'Super Admin') {
      try {
        const superAdmins = await getUsersByRole('Super Admin');
        if (superAdmins.length <= 1) {
          toast({
            title: "Cannot Change Role",
            description: "Cannot remove the last Super Admin from the system.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error checking Super Admin count:', error);
      }
    }

    setIsSaving(true);

    try {
      const updateData: Partial<Omit<User, 'id'>> = {
        name,
        email: email.toLowerCase(),
        role: role as UserRole,
      };

      // Only include vocation if the role is Clinician and vocation is provided
      if (role === 'Clinician' && vocation.trim()) {
        updateData.vocation = vocation.trim();
      }

      // Include password if user is Super Admin (always update password for Super Admin)
      if (currentUser?.role === 'Super Admin') {
        updateData.password = password.trim() || '';
      }

      await updateUser(userToEdit.id, updateData);

      const updatedUser: User = {
        ...userToEdit,
        ...updateData,
      };

      onUserUpdated(updatedUser);
      toast({
        title: "User Updated Successfully",
        description: `${name}'s information has been updated${currentUser?.role === 'Super Admin' ? ' including password' : ''}.`,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const canEditRole = () => {
    if (!userToEdit || !currentUser) return false;

    // Super Admin can edit any role
    if (currentUser.role === 'Super Admin') {
      // But cannot demote themselves if they're the last Super Admin
      if (userToEdit.id === currentUser.id && userToEdit.role === 'Super Admin') {
        // Check if there are other Super Admins
        // This would need to be passed as a prop or calculated
        return true; // For now, allow it - validation will happen on submit
      }
      return true;
    }

    return false;
  };

  const isEmailEditable = () => {
    // In a real system, email might not be editable or require special verification
    return currentUser?.role === 'Super Admin';
  };

  if (!userToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-6 w-6 text-primary" /> Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information and permissions.
            {currentUser?.role === 'Super Admin' && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                <Shield className="inline h-3 w-3 mr-1" />
                As Super Admin, you can modify all user details including roles and passwords.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Full Name"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="col-span-3"
                placeholder="user@example.com"
                required
                disabled={isSaving || !isEmailEditable()}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isSaving || !canEditRole()}
                required
              >
                <SelectTrigger className="col-span-3" id="edit-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(role === 'Clinician' || userToEdit.role === 'Clinician') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-vocation" className="text-right">
                  Vocation
                </Label>
                <Input
                  id="edit-vocation"
                  value={vocation}
                  onChange={(e) => setVocation(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Physiotherapist"
                  disabled={isSaving}
                />
              </div>
            )}

            {/* Password field - only visible to Super Admin */}
            {currentUser?.role === 'Super Admin' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Password
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={isSaving}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSaving}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Warning message outside the grid */}
          {userToEdit.role === 'Super Admin' && role !== 'Super Admin' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Warning</p>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You are changing a Super Admin to a different role. This will remove their administrative privileges.
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                 <X className="mr-2 h-4 w-4" />Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Updating User...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
