
// src/components/reports/ProgressReportModal.tsx
"use client";

import type { ProgressReviewReport, Client } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Send, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProgressReportModalProps {
  report: ProgressReviewReport | null;
  client: Client | null; // Pass client for naming files/emails
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isGenerating: boolean; // To show loading state in the modal
}

export default function ProgressReportModal({ report, client, isOpen, onOpenChange, isGenerating }: ProgressReportModalProps) {
  const { toast } = useToast();

  const handleExportPdfMock = () => {
    if (!report || !client) return;
    // Mock PDF export by downloading HTML content as a .html file or text as .txt
    const blob = new Blob([`<h1>Progress Report for ${client.name}</h1>${report.reportHtmlContent}`], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Progress_Report_${client.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported (Mock)", description: `HTML version of the report for ${client.name} has been downloaded.` });
  };

  const handleSendEmailMock = () => {
    if (!report || !client) return;
    // Mock email sending
    toast({ 
      title: "Email Sending (Mock)", 
      description: `An email with the progress report for ${client.name} would be sent. (Client email predefinition and actual sending is a backend feature).` 
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl text-primary">
            {isGenerating ? "Generating Progress Report..." : `Progress Review Report for ${report?.clientName || client?.name || 'Client'}`}
          </DialogTitle>
          <DialogDescription>
            {isGenerating ? "Please wait while the AI compiles the report from session notes." : "Review the generated report below. You can mock export it or send it via email."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0"> {/* Allows content to scroll */}
          <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI is drafting the report...</p>
              </div>
            )}
            {!isGenerating && report && (
              <div dangerouslySetInnerHTML={{ __html: report.reportHtmlContent }} />
            )}
            {!isGenerating && !report && (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-muted-foreground">No report data to display.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
          {!isGenerating && report && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleExportPdfMock} className="w-full sm:w-auto" variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Export as HTML (Mock)
              </Button>
              <Button onClick={handleSendEmailMock} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" /> Send via Email (Mock)
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
