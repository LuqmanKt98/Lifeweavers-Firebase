
// src/app/(app)/admin/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { ShieldAlert, UserCog, Edit, Trash2, UserPlus, UserCheck, Eye, Loader2, Shield } from 'lucide-react'; // Added UserCheck, Eye, Loader2, Shield
import AddUserDialog from '@/components/admin/AddUserDialog';
import EditUserDialog from '@/components/admin/EditUserDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { subscribeToUsers, deleteUser } from '@/lib/firebase/users';

export default function UserManagementPage() {
  const { currentUser, startImpersonation, isImpersonating, user: originalUser } = useAuth(); // Use currentUser for permissions
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to users from Firebase
    const unsubscribe = subscribeToUsers((users) => {
      setDisplayedUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser || (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin')) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            You do not have permission to access this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleUserAdded = (newUser: User) => {
    // Firebase subscription will automatically update the list
    toast({
      title: "User Added Successfully",
      description: `${newUser.name} has been added to the system.`,
    });
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Firebase subscription will automatically update the list
    // Update localStorage if it's the current user
    const storedUser = localStorage.getItem("lifeweaver_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.id === updatedUser.id) {
        localStorage.setItem("lifeweaver_user", JSON.stringify(updatedUser));
      }
    }

    toast({
      title: "User Updated Successfully",
      description: `${updatedUser.name}'s information has been updated.`,
    });
  };

  const handleRemoveUser = async (userIdToRemove: string) => {
    const userToRemove = displayedUsers.find(u => u.id === userIdToRemove);
    if (!userToRemove) return;

    if (userToRemove.id === currentUser?.id) {
      toast({ title: "Action Denied", description: "You cannot remove yourself.", variant: "destructive" });
      return;
    }
    if (userToRemove.id === originalUser?.id && isImpersonating) {
       toast({ title: "Action Denied", description: "You cannot remove your original Super Admin account while impersonating.", variant: "destructive" });
      return;
    }

    // Protect the main Super Admin account (hello@lifeweavers.org)
    if (userToRemove.email === 'hello@lifeweavers.org') {
      toast({
        title: "Action Denied",
        description: "The main Super Admin account (hello@lifeweavers.org) cannot be deleted. This account is protected to ensure system integrity.",
        variant: "destructive"
      });
      return;
    }
    // Enhanced Super Admin deletion logic
    if (userToRemove.role === 'Super Admin') {
      const superAdminCount = displayedUsers.filter(u => u.role === 'Super Admin').length;
      if (superAdminCount <= 1) {
        toast({
          title: "Action Denied",
          description: "Cannot remove the only Super Admin. At least one Super Admin must remain in the system.",
          variant: "destructive"
        });
        return;
      }

      // Additional confirmation for Super Admin deletion
      const confirmed = window.confirm(
        `⚠️ WARNING: You are about to delete another Super Admin!\n\n` +
        `User: ${userToRemove.name} (${userToRemove.email})\n` +
        `Role: Super Admin\n\n` +
        `This action cannot be undone. Are you absolutely sure you want to proceed?`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await deleteUser(userIdToRemove);
      // Firebase subscription will automatically update the list

      toast({
        title: "User Removed",
        description: `${userToRemove.name} has been removed from the system.`,
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleImpersonate = async (userToImpersonate: User) => {
    if (currentUser?.role === 'Super Admin' && currentUser.id !== userToImpersonate.id) {
      await startImpersonation(userToImpersonate);
    } else {
      toast({ title: "Impersonation Failed", description: "You cannot impersonate this user or yourself.", variant: "destructive"});
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold">User Management</CardTitle>
            <CardDescription>
              View, add, edit, or remove users from the system. Super Admins can create/delete other Super Admins and impersonate users.
            </CardDescription>
          </div>
          {currentUser.role === 'Super Admin' && (
             <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add New User
             </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Vocation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((u) => (
                <TableRow key={u.id} className={cn(isImpersonating && originalUser?.id === u.id && "bg-yellow-100 dark:bg-yellow-800/30")}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://picsum.photos/seed/${u.id}/36/36`} alt={u.name} data-ai-hint="user avatar"/>
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        {isImpersonating && originalUser?.id === u.id && <span className="text-xs text-yellow-600 dark:text-yellow-400">(Your Original Account)</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        u.role === 'Super Admin' ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        u.role === 'Admin' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}>
                        {u.role}
                      </span>
                      {u.role === 'Super Admin' && (
                        <Shield className="h-4 w-4 text-red-600 dark:text-red-400" title="Super Admin privileges" />
                      )}
                      {u.email === 'hello@lifeweavers.org' && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" title="Protected main Super Admin account">
                          PROTECTED
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{u.vocation || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {currentUser.role === 'Super Admin' && u.id !== currentUser.id && u.id !== originalUser?.id && (
                      <Button variant="outline" size="sm" onClick={() => handleImpersonate(u)} title={`Impersonate ${u.name}`}>
                        <Eye className="mr-1 h-4 w-4" /> Impersonate
                      </Button>
                    )}
                     {isImpersonating && currentUser.id === u.id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-black">
                           <UserCheck className="mr-1 h-3 w-3" /> Currently Impersonating
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Edit User"
                        disabled={
                            currentUser.role !== 'Super Admin' // Only SuperAdmins can edit
                        }
                        onClick={() => handleEditUser(u)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        title={
                          u.email === 'hello@lifeweavers.org'
                            ? "Main Super Admin account cannot be deleted"
                            : u.role === 'Super Admin'
                              ? "Remove Super Admin (Requires Confirmation)"
                              : "Remove User"
                        }
                        className={cn(
                          "hover:text-destructive/80",
                          u.role === 'Super Admin' ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950" : "text-destructive"
                        )}
                        disabled={
                            currentUser.role !== 'Super Admin' ||
                            u.id === currentUser.id || // Cannot remove self (current active identity)
                            u.id === originalUser?.id || // Cannot remove original SA account
                            u.email === 'hello@lifeweavers.org' || // Cannot remove main Super Admin
                            (u.role === 'Super Admin' && displayedUsers.filter(usr => usr.role === 'Super Admin').length <= 1)
                        }
                        onClick={() => handleRemoveUser(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Total users: {displayedUsers.length}</p>
        </CardFooter>
      </Card>
      {currentUser.role === 'Admin' && !isImpersonating && ( // Show this message only if the actual logged-in user is Admin
        <p className="text-sm text-muted-foreground">
            As an Admin, you can view users. Super Admins can add, edit, remove, and impersonate users.
        </p>
      )}

      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={handleUserAdded}
      />

      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        onUserUpdated={handleUserUpdated}
        userToEdit={userToEdit}
      />
    </div>
  );
}
