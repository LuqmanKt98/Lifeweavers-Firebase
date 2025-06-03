
// src/components/messages/MessageInput.tsx
"use client";

import { useState, FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: Message) => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export default function MessageInput({ onSendMessage, disabled, replyingTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content.trim(), replyingTo || undefined);
      setContent('');
      onCancelReply?.();
    }
  };

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-2 sm:px-4 pt-2 sm:pt-4 pb-0">
          <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Replying to {replyingTo.senderName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {replyingTo.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onCancelReply}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3 p-2 sm:p-4">
        <div className="flex-1">
          <Textarea
            placeholder={replyingTo ? "Reply to message..." : "Type your message..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={1}
            className="resize-none min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] bg-background border-2 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 w-full text-sm sm:text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
              if (e.key === 'Escape' && replyingTo) {
                onCancelReply?.();
              }
            }}
            disabled={disabled}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || disabled}
          title="Send Message"
          className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </form>
    </div>
  );
}
