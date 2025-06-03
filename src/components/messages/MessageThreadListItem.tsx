
// src/components/messages/MessageThreadListItem.tsx
"use client";

import type { MessageThread, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Users, User as UserIcon, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUserById } from '@/lib/firebase/users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageThreadListItemProps {
  thread: MessageThread;
  isSelected: boolean;
  currentUserId: string;
  onSelectThread: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
}

export default function MessageThreadListItem({ thread, isSelected, onSelectThread, onDeleteThread, currentUserId }: MessageThreadListItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  // Fetch other participant info for DM threads
  useEffect(() => {
    const fetchOtherParticipant = async () => {
      if (thread.type === 'dm' && thread.participantIds.length === 2) {
        const otherUserId = thread.participantIds.find(id => id !== currentUserId);
        if (otherUserId) {
          try {
            const user = await getUserById(otherUserId);
            setOtherParticipant(user);
          } catch (error) {
            console.error('Error fetching other participant:', error);
          }
        }
      }
    };

    fetchOtherParticipant();
  }, [thread.participantIds, currentUserId, thread.type]);

  // Determine display name and avatar based on thread type
  const getDisplayInfo = () => {
    if (thread.type === 'dm' && otherParticipant) {
      return {
        name: otherParticipant.name,
        avatarUrl: otherParticipant.profileImage || '',
        fallbackInitials: getInitials(otherParticipant.name)
      };
    }

    // Fallback to thread data for team chats or when other participant is not loaded
    return {
      name: thread.name || (thread.type === 'dm' ? "Direct Message" : "Team Chat"),
      avatarUrl: thread.avatarUrl || '',
      fallbackInitials: thread.avatarFallback || getInitials(thread.name)
    };
  };

  const displayInfo = getDisplayInfo();
  const threadName = displayInfo.name;
  const fallbackInitials = displayInfo.fallbackInitials;
  const lastMessageTime = thread.lastMessageTimestamp
    ? formatDistanceToNow(new Date(thread.lastMessageTimestamp), { addSuffix: true, includeSeconds: true })
    : '';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteThread) {
      onDeleteThread(thread.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div
      className={cn(
        "w-full rounded-lg transition-all duration-200 group relative border border-transparent",
        isSelected
          ? "bg-accent border-accent/50 shadow-sm"
          : "hover:bg-muted/30 hover:shadow-sm",
        thread.unreadCount > 0 && !isSelected && "bg-muted/20"
      )}
    >
      {/* Main Content Grid */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start p-3">
        {/* Avatar Column - Clickable */}
        <button
          onClick={() => onSelectThread(thread.id)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <Avatar className="h-10 w-10 mt-0.5">
            {displayInfo.avatarUrl ? (
              <AvatarImage src={displayInfo.avatarUrl} alt={threadName} data-ai-hint={thread.type === 'dm' ? 'person' : 'team icon'} />
            ) : (
              thread.type === 'dm' ? <UserIcon className="h-full w-full p-2 text-muted-foreground" /> : <Users className="h-full w-full p-2 text-muted-foreground" />
            )}
            <AvatarFallback>{fallbackInitials}</AvatarFallback>
          </Avatar>
        </button>

        {/* Content Column - Clickable */}
        <button
          onClick={() => onSelectThread(thread.id)}
          className="min-w-0 space-y-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {/* Thread Name */}
          <h3 className={cn("text-sm font-semibold truncate leading-tight", isSelected ? "text-accent-foreground" : "text-foreground")}>
            {threadName}
          </h3>
          {/* Message Snippet */}
          <p className={cn("text-xs truncate leading-tight", isSelected ? "text-accent-foreground/80" : "text-muted-foreground")}>
            {thread.lastMessageSnippet || (thread.type === 'dm' ? 'No messages yet' : 'Start the conversation!')}
          </p>
        </button>

        {/* Right Column - Time, Badge & Menu */}
        <div className="flex flex-col items-end gap-1 mt-0.5">
          <div className="flex items-center gap-2">
            <time className={cn("text-xs whitespace-nowrap leading-tight", isSelected ? "text-accent-foreground/70" : "text-muted-foreground")}>
              {lastMessageTime.replace("about ", "")}
            </time>
            {onDeleteThread && (
              <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                    title="More options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
          {thread.unreadCount > 0 && (
            <Badge variant={isSelected ? "secondary" : "default"} className="text-xs h-5 px-1.5">
              {thread.unreadCount}
            </Badge>
          )}
        </div>
      </div>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation with <strong>{threadName}</strong>?
              This action cannot be undone and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
