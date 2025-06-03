// src/components/sessions/SessionEditor.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import type { User, SessionNote, Attachment } from '@/lib/types';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Ban, Paperclip, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Real file upload will be implemented


interface SessionEditorProps {
  clientId: string;
  currentUser: User;
  onSave: (sessionData: Omit<SessionNote, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  existingSessionsCount: number;
  initialData?: Partial<SessionNote>;
}


export default function SessionEditor({
  clientId,
  currentUser,
  onSave,
  onCancel,
  existingSessionsCount,
  initialData,
}: SessionEditorProps) {
  const [dateOfSession, setDateOfSession] = useState(initialData?.dateOfSession ? format(new Date(initialData.dateOfSession), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState(initialData?.content || '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  // Mock file selection removed - real file upload will be implemented
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setDateOfSession(format(new Date(initialData.dateOfSession || Date.now()), "yyyy-MM-dd"));
      setContent(initialData.content || '');
      setAttachments(initialData.attachments || []);
    }
  }, [initialData]);

  const handleAddAttachment = () => {
    // Real file upload functionality will be implemented here
    toast({
      title: "File Upload",
      description: "Real file upload functionality will be implemented.",
      variant: "default"
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    toast({ title: "Attachment Removed", variant: "default" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) {
      toast({ title: "Content Missing", description: "Session notes or attachments cannot both be empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const sessionData: Omit<SessionNote, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt'> = {
      clientId,
      dateOfSession: new Date(dateOfSession).toISOString(),
      attendingClinicianId: currentUser.id,
      attendingClinicianName: currentUser.name,
      attendingClinicianVocation: currentUser.vocation,
      content,
      attachments,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(sessionData);
      toast({ title: "Session Saved", description: `Session ${initialData ? 'updated' : 'added'} successfully.`, variant: "default" });
    } catch (error) {
      console.error("Error saving session:", error);
      toast({ title: "Save Failed", description: "Could not save session. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const sessionTitle = initialData
    ? `Edit Session ${initialData.sessionNumber}`
    : `New Session (Session ${existingSessionsCount + 1})`;

  return (
    <Card className="shadow-xl border-primary/20 bg-gradient-to-br from-card to-secondary/10">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{sessionTitle}</CardTitle>
        <CardDescription>
          Use the rich text editor below for formatting session notes.
          File attachments are currently mocked. Full Google Drive integration would be a backend feature.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfSession">Date of Session</Label>
              <Input
                id="dateOfSession"
                type="date"
                value={dateOfSession}
                onChange={(e) => setDateOfSession(e.target.value)}
                required
                className="bg-background"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="attendingClinician">Attending Clinician</Label>
              <Input
                id="attendingClinician"
                type="text"
                value={`${currentUser.name} (${currentUser.vocation || currentUser.role})`}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Session Notes</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Enter session notes here..."
            />
          </div>

          <div className="space-y-4">
            <Label>Attachments</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button type="button" onClick={handleAddAttachment} variant="outline" className="w-full sm:w-auto">
                <Paperclip className="mr-2 h-4 w-4" /> Upload File
              </Button>
              <p className="text-sm text-muted-foreground">Real file upload functionality will be implemented</p>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2 p-3 border rounded-md bg-secondary/30">
                <h4 className="text-sm font-medium text-foreground">Attached Files:</h4>
                <ul className="space-y-1">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between text-sm p-2 bg-background rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{att.name} ({att.fileType})</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAttachment(att.id)} title="Remove attachment">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            <Ban className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData ? 'Update Session' : 'Save Session'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
