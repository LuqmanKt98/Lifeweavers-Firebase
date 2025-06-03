
// src/components/admin/AddUserDialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X, Shield, Eye, EyeOff } from 'lucide-react';
import { addUser } from '@/lib/firebase/users';

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (newUser: User) => void;
}

export default function AddUserDialog({ isOpen, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole | ''>('');
  const [vocation, setVocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { toast } = useToast();

  // Determine available roles based on current user's role
  const getAvailableRoles = (): UserRole[] => {
    if (currentUser?.role === 'Super Admin') {
      return ['Super Admin', 'Admin', 'Clinician'];
    }
    return ['Admin', 'Clinician'];
  };

  const availableRoles = getAvailableRoles();

  const resetForm = () => {
    console.log('Resetting form - clearing all fields');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('');
    setVocation('');
    setIsSaving(false);
    setFormKey(prev => prev + 1); // Force re-render

    // Force clear any DOM values
    setTimeout(() => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      const vocationInput = document.getElementById('vocation') as HTMLInputElement;

      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      if (vocationInput) vocationInput.value = '';

      console.log('DOM inputs manually cleared');
    }, 100);
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('AddUserDialog opened - resetting form');
      resetForm();
    }
  }, [isOpen]);

  // Additional effect to ensure form is always clean when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Force reset all fields to empty strings
      setTimeout(() => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('');
        setVocation('');
        console.log('Form fields force-reset to empty');
      }, 0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast({
        title: "Missing Information",
        description: "Please fill in Name, Email, Password, and Role.",
        variant: "destructive",
      });
      return;
    }

    // Basic password validation
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);

    try {
      const newUserData: any = {
        name,
        email: email.toLowerCase(),
        password,
        role: role as UserRole,
      };

      // Only include vocation if the role is Clinician and vocation is provided
      if (role === 'Clinician' && vocation.trim()) {
        newUserData.vocation = vocation.trim();
      }

      const newUser = await addUser(newUserData);

      onUserAdded(newUser);
      toast({
        title: "User Added Successfully",
        description: `${name} has been added to the system with login credentials.`,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm(); // Reset form when dialog is closed
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Add New User
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new user. Set their login credentials manually.
            {currentUser?.role === 'Super Admin' && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                <Shield className="inline h-3 w-3 mr-1" />
                As Super Admin, you can create users with any role including other Super Admins.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form key={`add-user-form-${formKey}`} onSubmit={handleSubmit} autoComplete="off">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                key={`name-${formKey}`}
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Full Name"
                required
                disabled={isSaving}
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                key={`email-${formKey}`}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="col-span-3"
                placeholder="user@example.com"
                required
                disabled={isSaving}
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  key={`password-${formKey}`}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  disabled={isSaving}
                  minLength={6}
                  autoComplete="new-password"
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                key={`role-${formKey}`}
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isSaving}
                required
              >
                <SelectTrigger className="col-span-3" id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {role === 'Clinician' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vocation" className="text-right">
                  Vocation
                </Label>
                <Input
                  key={`vocation-${formKey}`}
                  id="vocation"
                  value={vocation}
                  onChange={(e) => setVocation(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Physiotherapist"
                  disabled={isSaving}
                  autoComplete="off"
                />
              </div>
            )}
          </div>
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
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Adding User...' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
