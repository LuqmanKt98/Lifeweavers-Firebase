
// src/components/messages/MessageView.tsx
"use client";

import type { Message, MessageThread, User } from '@/lib/types';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, User as UserIcon, MessageSquareDashed, ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserById } from '@/lib/firebase/users';

interface MessageViewProps {
  thread: MessageThread | null;
  messages: Message[];
  currentUser: User;
  onSendMessage: (threadId: string, content: string, replyTo?: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForEveryone?: (messageId: string) => void;
  isLoading?: boolean;
  onBackToList?: () => void;
}

export default function MessageView({
  thread,
  messages,
  currentUser,
  onSendMessage,
  onReaction,
  onDeleteForMe,
  onDeleteForEveryone,
  isLoading,
  onBackToList
}: MessageViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch other participant info for DM threads
  useEffect(() => {
    const fetchOtherParticipant = async () => {
      if (thread?.type === 'dm' && thread.participantIds.length === 2) {
        const otherUserId = thread.participantIds.find(id => id !== currentUser.id);
        if (otherUserId) {
          try {
            const user = await getUserById(otherUserId);
            setOtherParticipant(user);
          } catch (error) {
            console.error('Error fetching other participant:', error);
          }
        }
      } else {
        setOtherParticipant(null);
      }
    };

    fetchOtherParticipant();
  }, [thread?.participantIds, currentUser.id, thread?.type]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendMessage = (content: string, replyTo?: Message) => {
    if (!thread) return;
    onSendMessage(thread.id, content, replyTo);
    setReplyingTo(null);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (onReaction) {
      onReaction(messageId, emoji);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    if (onDeleteForMe) {
      onDeleteForMe(messageId);
      toast({
        title: "Message deleted",
        description: "Message deleted for you only.",
      });
    }
  };

  const handleDeleteForEveryone = (messageId: string) => {
    if (onDeleteForEveryone) {
      onDeleteForEveryone(messageId);
      toast({
        title: "Message deleted",
        description: "Message deleted for everyone.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
        <MessageSquareDashed className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground animate-pulse" />
        <p className="mt-4 text-sm sm:text-base text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
        <MessageSquareDashed className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
        <p className="mt-4 text-sm sm:text-base text-muted-foreground">Select a chat to start messaging</p>
        <p className="text-xs sm:text-sm text-muted-foreground">or start a new conversation.</p>
      </div>
    );
  }

  // Determine display name and avatar based on thread type
  const getDisplayInfo = () => {
    if (thread?.type === 'dm' && otherParticipant) {
      return {
        name: otherParticipant.name,
        avatarUrl: otherParticipant.profileImage || '',
        fallbackInitials: getInitials(otherParticipant.name)
      };
    }

    // Fallback to thread data for team chats or when other participant is not loaded
    return {
      name: thread?.name || (thread?.type === 'dm' ? "Direct Message" : "Team Chat"),
      avatarUrl: thread?.avatarUrl || '',
      fallbackInitials: thread?.avatarFallback || getInitials(thread?.name)
    };
  };

  const displayInfo = getDisplayInfo();
  const threadName = displayInfo.name;
  const fallbackInitials = displayInfo.fallbackInitials;


  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full">
      {/* Header - Responsive */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b bg-card">
        {/* Back Button for Mobile */}
        {onBackToList && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            className="sm:hidden p-2 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
           {displayInfo.avatarUrl ? (
            <AvatarImage src={displayInfo.avatarUrl} alt={threadName} data-ai-hint={thread.type === 'dm' ? 'person' : 'team icon'}/>
          ) : (
             thread.type === 'dm' ? <UserIcon className="h-full w-full p-2 text-muted-foreground" /> : <Users className="h-full w-full p-2 text-muted-foreground" />
          )}
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-md font-semibold text-foreground truncate">{threadName}</h2>
          {thread.type === 'team_chat' && (
            <p className="text-xs text-muted-foreground">
              {thread.participantIds.length} member{thread.participantIds.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {/* Messages Area - Responsive Padding */}
      <ScrollArea className="flex-1 p-2 sm:p-4" viewportRef={viewportRef} ref={scrollAreaRef}>
        <div className="space-y-1">
          {messages.map(msg => (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUser.id}
              currentUser={currentUser}
              onReply={handleReply}
              onReaction={handleReaction}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!thread}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}
