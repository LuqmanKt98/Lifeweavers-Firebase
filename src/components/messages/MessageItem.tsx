
// src/components/messages/MessageItem.tsx
"use client";

import type { Message, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, MoreVertical, Reply, Trash2, Heart, Smile, ThumbsUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { useState } from 'react';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  currentUser: User;
  onReply?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
}

export default function MessageItem({
  message,
  isOwnMessage,
  currentUser,
  onReply,
  onReaction,
  onDeleteForMe,
  onDeleteForEveryone
}: MessageItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'me' | 'everyone'>('me');
  const [showReactions, setShowReactions] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleDeleteClick = (type: 'me' | 'everyone') => {
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteType === 'me' && onDeleteForMe) {
      onDeleteForMe(message.id);
    } else if (deleteType === 'everyone' && onDeleteForEveryone) {
      onDeleteForEveryone(message.id);
    }
    setShowDeleteDialog(false);
  };

  const handleReactionClick = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Check if message is deleted for current user
  const isDeletedForMe = message.deletedForUsers?.includes(currentUser.id);
  const isDeletedForEveryone = message.isDeleted && message.deletedFor === 'everyone';

  // Don't render if deleted for current user
  if (isDeletedForMe) {
    return null;
  }

  // Handle system messages differently
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2 sm:py-3">
        <div className="bg-muted/50 text-muted-foreground text-xs sm:text-sm px-3 py-1.5 rounded-full border border-border/50">
          <span className="font-medium">{message.content}</span>
          <span className="ml-2 opacity-60">
            {format(new Date(message.timestamp), 'p')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "flex gap-2 sm:gap-3 py-1 sm:py-1.5 group relative hover:bg-muted/20 rounded-lg px-2 transition-colors duration-200",
        isOwnMessage ? "justify-end" : "justify-start"
      )}>
        {!isOwnMessage && (
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 self-end flex-shrink-0">
            <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} data-ai-hint="person avatar" />
            <AvatarFallback className="text-xs">{message.senderAvatarFallback || getInitials(message.senderName)}</AvatarFallback>
          </Avatar>
        )}

        <div className="flex flex-col max-w-[85%] sm:max-w-[70%]">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm transition-all duration-200 group-hover:shadow-md relative",
              isDeletedForEveryone
                ? "bg-muted/50 text-muted-foreground italic border border-dashed"
                : isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border text-card-foreground rounded-bl-md"
            )}
          >
            {/* Reply indicator inside the message bubble */}
            {message.replyTo && (
              <div className={cn("mb-2 px-3 py-2 rounded-md text-xs border-l-4",
                isOwnMessage
                  ? "bg-white/20 border-white/50 text-white/90"
                  : "bg-gray-100 border-gray-400 text-gray-700"
              )}>
                <p className="text-xs font-medium leading-relaxed">
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {!isOwnMessage && !isDeletedForEveryone && (
              <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
            )}

            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
              {isDeletedForEveryone ? "This message was deleted" : message.content}
            </div>

            <div className={cn("flex items-center gap-1", isOwnMessage ? "justify-end" : "justify-start")}>
              <time className={cn("text-xs", isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {format(new Date(message.timestamp), 'p')}
              </time>
              {message.editedAt && (
                <span className={cn("text-xs", isOwnMessage ? "text-primary-foreground/50" : "text-muted-foreground/50")}>
                  (edited)
                </span>
              )}
              {isOwnMessage && !isDeletedForEveryone && (
                <div className="flex items-center ml-1">
                  <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                </div>
              )}
            </div>


          </div>

          {/* Reactions display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-6 px-2 py-0 text-xs rounded-full",
                    reaction.userIds.includes(currentUser.id)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-background"
                  )}
                  onClick={() => handleReactionClick(reaction.emoji)}
                  title={`${reaction.userNames.join(', ')} reacted with ${reaction.emoji}`}
                >
                  {reaction.emoji} {reaction.userIds.length}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Message actions - positioned outside the message bubble */}
        {!isDeletedForEveryone && (
          <div className={cn(
            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-end mb-2",
            isOwnMessage ? "order-first mr-2" : "order-last ml-2"
          )}>
            {/* Quick reaction button */}
            <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/90 hover:bg-background border shadow-sm rounded-full"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto p-2">
                <div className="flex gap-1">
                  {quickReactions.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                      onClick={() => handleReactionClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/90 hover:bg-background border shadow-sm rounded-full"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="w-48">
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteClick('me')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete for me
                </DropdownMenuItem>
                {isOwnMessage && (
                  <DropdownMenuItem onClick={() => handleDeleteClick('everyone')}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete for everyone
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {isOwnMessage && (
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 self-end flex-shrink-0">
            <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} data-ai-hint="person avatar" />
            <AvatarFallback className="text-xs">{message.senderAvatarFallback || getInitials(message.senderName)}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'me'
                ? "This message will be deleted for you only. Other participants will still see it."
                : "This message will be deleted for everyone in this conversation. This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete {deleteType === 'me' ? 'for me' : 'for everyone'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
