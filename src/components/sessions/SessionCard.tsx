// src/components/sessions/SessionCard.tsx
"use client";

import { useState } from 'react';
import type { SessionNote, Attachment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CalendarDays, Edit3, Paperclip, Eye, FileText, Image as ImageIcon, Video, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FilePreviewModal from '@/components/shared/FilePreviewModal';
import { cn } from '@/lib/utils';

// Helper function to check if HTML content is effectively empty
const isContentEffectivelyEmpty = (htmlContent: string | undefined): boolean => {
  if (!htmlContent) {
    return true;
  }
  // For client-side components, DOMParser is available.
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const textContent = doc.body.textContent || "";
      return textContent.trim() === "";
    } catch (e) {
      // Fallback if DOMParser fails (e.g. very malformed HTML, though unlikely for Tiptap output)
      console.error("DOMParser failed in isContentEffectivelyEmpty:", e);
      // Basic fallback: check if string only contains whitespace or common empty HTML tags
      const simplifiedContent = htmlContent
        .replace(/<p><\/p>/gi, '')
        .replace(/<br\s*\/?>/gi, '')
        .replace(/&nbsp;/gi, '')
        .trim();
      return simplifiedContent === '' || simplifiedContent.replace(/<[^>]+>/g, '').trim() === '';
    }
  }
  // Fallback for non-browser environments (SSR, though this is 'use client')
  // This is a very basic fallback and might not cover all cases of "empty" HTML.
  return htmlContent.replace(/<[^>]+>/g, '').trim() === '';
};


interface SessionCardProps {
  session: SessionNote;
  canModifyNotes: boolean;
}

export default function SessionCard({ session, canModifyNotes }: SessionCardProps) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handlePreviewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewModalOpen(true);
  };

  const getFileIcon = (fileType: Attachment['fileType']) => {
    switch(fileType) {
      case 'image': return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
      case 'pdf': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'video': return <Video className="h-4 w-4 text-muted-foreground" />;
      case 'document':
      case 'spreadsheet':
      case 'presentation':
        return <FileArchive className="h-4 w-4 text-muted-foreground" />; 
      default: return <Paperclip className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const contentIsEmpty = isContentEffectivelyEmpty(session.content);
  const attachmentsAreEmpty = !session.attachments || session.attachments.length === 0;

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300" id={`session-${session.id}`}>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-xl font-semibold text-primary">
              Session {session.sessionNumber}
            </CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{format(new Date(session.dateOfSession), 'PPP')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://picsum.photos/seed/${session.attendingClinicianId}/32/32`} alt={session.attendingClinicianName} data-ai-hint="professional person"/>
              <AvatarFallback>{getInitials(session.attendingClinicianName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{session.attendingClinicianName}</p>
              <p className="text-xs">{session.attendingClinicianVocation || 'Clinician'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6">
          {contentIsEmpty && attachmentsAreEmpty ? (
            <p className="text-muted-foreground italic">No content or attachments for this session.</p>
          ) : (
            <>
              {contentIsEmpty && !attachmentsAreEmpty ? (
                <p className="text-muted-foreground italic mb-4">No textual content for this session. See attachments below.</p>
              ) : (
                !contentIsEmpty && session.content && ( 
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: session.content }}
                  />
                )
              )}

              {!attachmentsAreEmpty && session.attachments && (
                <div className={cn("mt-6 pt-4", !contentIsEmpty && "border-t")}>
                  <h4 className="text-md font-semibold mb-3 text-foreground/90 flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-primary" /> Attached Files
                  </h4>
                  <ul className="space-y-2">
                    {session.attachments.map((att) => (
                      <li key={att.id} className="flex items-center justify-between p-2 bg-secondary/20 hover:bg-secondary/40 rounded-md transition-colors">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          {getFileIcon(att.fileType)}
                          <span>{att.name}</span>
                          <span className="text-xs text-muted-foreground">({att.fileType})</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handlePreviewAttachment(att)}>
                          <Eye className="mr-2 h-4 w-4" /> Preview
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Last updated: {format(new Date(session.updatedAt), 'Pp')}
          </p>
          {canModifyNotes && (
            <Button variant="outline" size="sm" disabled> 
                <Edit3 className="mr-2 h-4 w-4" /> Edit Session
            </Button>
          )}
        </CardFooter>
      </Card>

      {selectedAttachment && (
        <FilePreviewModal
          attachment={selectedAttachment}
          isOpen={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
        />
      )}
    </>
  );
}
