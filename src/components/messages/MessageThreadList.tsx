
// src/components/messages/MessageThreadList.tsx
"use client";

import type { MessageThread, User } from '@/lib/types';
import MessageThreadListItem from './MessageThreadListItem';
import NewChatDialog from './NewChatDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MessageSquarePlus } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface MessageThreadListProps {
  threads: MessageThread[];
  selectedThreadId: string | null;
  currentUserId: string;
  onSelectThread: (threadId: string) => void;
  onStartNewDm: (targetUser: User) => void;
  onDeleteThread: (threadId: string) => void;
}

export default function MessageThreadList({ threads, selectedThreadId, onSelectThread, onStartNewDm, onDeleteThread, currentUserId }: MessageThreadListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const filteredThreads = threads.filter(thread =>
    thread.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.lastMessageSnippet?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

  const handleStartNewChat = (targetUser: User) => {
    onStartNewDm(targetUser);
    setShowNewChatDialog(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-card/50 backdrop-blur-sm">
      <div className="p-3 sm:p-4 border-b bg-card/80 backdrop-blur-sm space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
             <MessageSquarePlus className="h-5 w-5 sm:h-6 sm:w-6" />
             <span className="hidden sm:inline">Messages</span>
           </h2>
           <Button
             variant="default"
             size="sm"
             onClick={() => setShowNewChatDialog(true)}
             title="Start new chat"
             className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0"
           >
             <MessageSquarePlus className="h-4 w-4" />
           </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            className="pl-10 bg-background/80 border-2 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredThreads.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredThreads.map(thread => (
              <MessageThreadListItem
                key={thread.id}
                thread={thread}
                isSelected={thread.id === selectedThreadId}
                onSelectThread={onSelectThread}
                onDeleteThread={onDeleteThread}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-6 text-center text-muted-foreground">
            <MessageSquarePlus className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm font-medium mb-2">
              {searchTerm ? "No conversations match your search" : "No conversations yet"}
            </p>
            <p className="text-xs mb-4">
              {searchTerm ? "Try a different search term" : "Start chatting with your team"}
            </p>
            {!searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewChatDialog(true)}
                className="rounded-full text-xs"
              >
                <MessageSquarePlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Start a conversation</span>
                <span className="sm:hidden">Start chat</span>
              </Button>
            )}
          </div>
        )}
      </ScrollArea>

      <NewChatDialog
        isOpen={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        onStartChat={handleStartNewChat}
      />
    </div>
  );
}
