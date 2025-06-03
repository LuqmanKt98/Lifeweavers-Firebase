
// src/app/(app)/messages/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { MessageThread, Message, User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import MessageThreadList from '@/components/messages/MessageThreadList';
import MessageView from '@/components/messages/MessageView';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  subscribeToUserMessageThreads,
  subscribeToThreadMessages,
  createMessageThread,
  sendMessage,
  deleteMessageThread,
  findExistingDMThread,
  markThreadAsRead,
  addMessageReaction,
  deleteMessageForMe,
  deleteMessageForEveryone
} from '@/lib/firebase/messages';


export default function MessagesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  // Subscribe to user's message threads
  useEffect(() => {
    if (!currentUser) return;

    setLoadingThreads(true);
    const unsubscribe = subscribeToUserMessageThreads(currentUser.id, (userThreads) => {
      // Remove duplicates based on thread ID and add unread count for current user
      const uniqueThreads = userThreads.filter((thread, index, self) =>
        index === self.findIndex(t => t.id === thread.id)
      ).map(thread => ({
        ...thread,
        unreadCount: (thread.unreadCounts && thread.unreadCounts[currentUser.id]) || 0
      }));
      setThreads(uniqueThreads);
      setLoadingThreads(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to messages in selected thread
  useEffect(() => {
    if (!selectedThreadId || !currentUser) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = subscribeToThreadMessages(selectedThreadId, (threadMessages) => {
      setMessages(threadMessages.map(msg => ({
        ...msg,
        isOwnMessage: msg.senderId === currentUser.id
      })));
      setLoadingMessages(false);
    });

    // Mark thread as read when selected
    markThreadAsRead(selectedThreadId, currentUser.id).catch(console.error);

    return () => unsubscribe();
  }, [selectedThreadId, currentUser]);

  const handleSelectThread = async (threadId: string) => {
    setSelectedThreadId(threadId);

    // Mark thread as read when selected
    if (currentUser) {
      try {
        await markThreadAsRead(threadId, currentUser.id);
      } catch (error) {
        console.error('Error marking thread as read:', error);
      }
    }
  };

  const handleSendMessage = async (threadId: string, content: string, replyTo?: Message) => {
    if (!currentUser) return;

    try {
      const messageData: Omit<Message, 'id'> = {
        threadId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatarUrl: currentUser.profileImage || '',
        senderAvatarFallback: getInitials(currentUser.name),
        content,
        timestamp: new Date().toISOString(),
        replyTo: replyTo ? {
          messageId: replyTo.id,
          content: replyTo.content,
          senderName: replyTo.senderName,
          senderId: replyTo.senderId
        } : undefined,
      };

      await sendMessage(messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    try {
      await addMessageReaction(messageId, emoji, currentUser.id, currentUser.name);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    if (!currentUser) return;

    try {
      await deleteMessageForMe(messageId, currentUser.id);
    } catch (error) {
      console.error('Error deleting message for me:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (!currentUser) return;

    try {
      await deleteMessageForEveryone(messageId, currentUser.id);
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartNewDm = async (targetUser: User) => {
    if (!currentUser) return;

    try {
      // Check if DM thread already exists
      const existingThread = await findExistingDMThread(currentUser.id, targetUser.id);

      if (existingThread) {
        setSelectedThreadId(existingThread.id);
        toast({
          title: "Existing Chat Found",
          description: `Opened existing conversation with ${targetUser.name}.`
        });
        return;
      }

      // Create new DM thread
      const newThreadData: Omit<MessageThread, 'id'> = {
        type: 'dm',
        participantIds: [currentUser.id, targetUser.id],
        name: targetUser.name,
        avatarUrl: targetUser.profileImage || '',
        avatarFallback: getInitials(targetUser.name),
        lastMessageTimestamp: new Date().toISOString(),
        lastMessageSnippet: 'New conversation started.',
        unreadCount: 0,
        unreadCounts: {
          [currentUser.id]: 0,
          [targetUser.id]: 0
        }
      };

      const newThread = await createMessageThread(newThreadData);

      // Add the new thread to the local state immediately (avoid duplicates)
      setThreads(prevThreads => {
        const exists = prevThreads.some(t => t.id === newThread.id);
        if (exists) return prevThreads;
        return [newThread, ...prevThreads];
      });

      // Immediately select the new thread
      setSelectedThreadId(newThread.id);

      // Send initial welcome message
      const initialMessage: Omit<Message, 'id'> = {
        threadId: newThread.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatarUrl: currentUser.profileImage || '',
        senderAvatarFallback: getInitials(currentUser.name),
        content: `Started a conversation with ${targetUser.name}`,
        timestamp: new Date().toISOString(),
        type: 'system', // Mark as system message
      };

      await sendMessage(initialMessage);

      toast({
        title: "New Chat Started",
        description: `You can now chat with ${targetUser.name}.`
      });
    } catch (error) {
      console.error('Error starting new DM:', error);
      toast({
        title: "Error",
        description: "Failed to start new conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!currentUser) return;

    try {
      await deleteMessageThread(threadId);

      // Clear selection if deleted thread was selected
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }

      toast({
        title: "Chat Deleted",
        description: "The conversation has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return <p>Loading messages...</p>;
  }

  const selectedThreadDetails = threads.find(t => t.id === selectedThreadId);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-background to-secondary/20 overflow-hidden">
        {/* Header Card - Responsive */}
        <Card className="flex-shrink-0 rounded-none border-x-0 border-t-0 sm:rounded-lg sm:border sm:mx-0 sm:mb-4 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-primary flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                      <MessageSquareText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </div>
                    Messages
                </CardTitle>
                <CardDescription className="text-sm sm:text-base hidden sm:block">
                    Connect and collaborate with your team through secure real-time messaging.
                </CardDescription>
            </CardHeader>
        </Card>

        {/* Main Content - Fully Responsive */}
        <div className="flex-1 flex overflow-hidden min-h-0 gap-0 sm:gap-1 md:gap-2">
            {/* Chat List - Responsive Width */}
            <div className={cn(
              "h-full transition-all duration-300 ease-in-out border-r border-border/50",
              selectedThreadId
                ? "hidden sm:flex sm:w-80 md:w-96 lg:w-[400px] xl:w-[450px]"
                : "w-full sm:w-80 md:w-96 lg:w-[400px] xl:w-[450px]"
            )}>
                <MessageThreadList
                    threads={threads}
                    selectedThreadId={selectedThreadId}
                    onSelectThread={handleSelectThread}
                    onStartNewDm={handleStartNewDm}
                    onDeleteThread={handleDeleteThread}
                    currentUserId={currentUser.id}
                />
            </div>

            {/* Message View - Responsive */}
            <div className={cn(
              "h-full transition-all duration-300 ease-in-out",
              selectedThreadId
                ? "flex-1 w-full"
                : "hidden sm:flex sm:flex-1"
            )}>
                 <MessageView
                    thread={selectedThreadDetails || null}
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                    onReaction={handleReaction}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
                    isLoading={loadingMessages}
                    onBackToList={() => setSelectedThreadId(null)}
                />
            </div>
        </div>
    </div>
  );
}
