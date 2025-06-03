// src/components/messages/NewChatDialog.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquarePlus, Users } from 'lucide-react';
import { getAllUsers } from '@/lib/firebase/users';

interface NewChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (targetUser: User) => void;
}

export default function NewChatDialog({ isOpen, onOpenChange, onStartChat }: NewChatDialogProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Clinician':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.vocation && user.vocation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const allUsers = await getAllUsers();

      // Filter out current user and apply role-based restrictions
      let availableUsers = allUsers.filter(user => user.id !== currentUser.id);

      // Apply role-based messaging restrictions for privacy
      if (currentUser.role === 'Clinician') {
        availableUsers = availableUsers.filter(user => {
          // Clinicians can message Admins and Super Admins
          if (user.role === 'Admin' || user.role === 'Super Admin') {
            return true;
          }
          // Clinicians can message other clinicians (for collaboration)
          return user.role === 'Clinician';
        });
      } else if (currentUser.role === 'Admin') {
        // Admins can message everyone
        availableUsers = availableUsers;
      } else if (currentUser.role === 'Super Admin') {
        // Super Admins can message everyone
        availableUsers = availableUsers;
      }

      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (targetUser: User) => {
    onStartChat(targetUser);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSearchTerm('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6 text-primary" />
            Start New Chat
          </DialogTitle>
          <DialogDescription>
            Select a user to start a new conversation with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading users...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? "No users match your search." : "No users available to chat with."}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 hover:bg-accent"
                    onClick={() => handleStartChat(user)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        {user.profileImage && (
                          <AvatarImage
                            src={user.profileImage}
                            alt={user.name}
                          />
                        )}
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{user.name}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getRoleColor(user.role)}`}
                          >
                            {user.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                          {user.vocation && (
                            <span className="ml-2">• {user.vocation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
