// src/components/shared/FilePreviewModal.tsx
"use client";

import type { Attachment } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ExternalLink, FileWarning, X } from 'lucide-react';

interface FilePreviewModalProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function FilePreviewModal({ attachment, isOpen, onOpenChange }: FilePreviewModalProps) {
  if (!attachment) return null;

  const renderPreviewContent = () => {
    switch (attachment.fileType) {
      case 'image':
        return (
          <div className="relative w-full h-auto max-h-[70vh] flex justify-center items-center">
            <Image
                src={attachment.previewUrl || attachment.url}
                alt={`Preview of ${attachment.name}`}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-md"
                data-ai-hint="file preview"
            />
          </div>
        );
      case 'video':
        return (
          <video controls className="w-full max-h-[70vh] rounded-md" src={attachment.url}>
            Your browser does not support the video tag.
          </video>
        );
      case 'pdf':
        return (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(attachment.url)}&embedded=true`} // Basic Google Docs viewer for PDFs
            className="w-full h-[70vh] border-0 rounded-md"
            title={`Preview of ${attachment.name}`}
            sandbox="allow-scripts allow-same-origin" // Security for iframes
          />
        );
      case 'document':
      case 'spreadsheet':
      case 'presentation':
        // For actual Google Drive files, you'd use a different embed URL structure from Drive API.
        // This is a generic placeholder for GSuite like docs.
        return (
           <div className="p-4 text-center bg-muted rounded-md">
             <p className="text-lg font-semibold">Document Preview</p>
             <p className="text-sm text-muted-foreground mb-2">
                Preview for {attachment.fileType} files.
                Full integration with document services will be implemented.
             </p>
             <iframe
                src={attachment.url}
                className="w-full h-[60vh] border rounded-md"
                title={`Preview of ${attachment.name}`}
                sandbox="allow-scripts allow-same-origin"
             ></iframe>
           </div>
        );
      default:
        return (
          <div className="p-6 text-center bg-muted rounded-md">
            <FileWarning className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold">Preview Not Available</p>
            <p className="text-sm text-muted-foreground">
              No direct preview available for "{attachment.name}" ({attachment.mimeType}).
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">{attachment.name}</DialogTitle>
          <DialogDescription>
            File Type: {attachment.mimeType}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 max-h-[calc(90vh-150px)] overflow-y-auto">
          {renderPreviewContent()}
        </div>
        <DialogFooter className="p-6 pt-0 border-t flex flex-col sm:flex-row justify-between items-center">
           <Button variant="outline" onClick={() => window.open(attachment.url, '_blank')} className="w-full sm:w-auto" title="Opens in new tab">
            <ExternalLink className="mr-2 h-4 w-4" /> Open Original File
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto mt-2 sm:mt-0">
            <X className="mr-2 h-4 w-4" /> Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
