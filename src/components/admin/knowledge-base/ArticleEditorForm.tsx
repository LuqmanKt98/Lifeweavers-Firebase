
// src/components/admin/knowledge-base/ArticleEditorForm.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import type { User, KnowledgeBaseArticle, Attachment } from '@/lib/types';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Ban, Paperclip, Trash2, FileText, PlusCircle } from 'lucide-react';
// Real file upload will be implemented

interface ArticleEditorFormProps {
  initialData?: KnowledgeBaseArticle;
  onSave: (data: Omit<KnowledgeBaseArticle, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'slug' | 'viewCount'>) => void;
  onCancel: () => void;
  currentUser: User;
}

export default function ArticleEditorForm({ initialData, onSave, onCancel, currentUser }: ArticleEditorFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setExcerpt(initialData.excerpt || '');
      setContent(initialData.content);
      setCoverImageUrl(initialData.coverImageUrl || '');
      setTags(initialData.tags?.join(', ') || '');
      setIsPublished(initialData.isPublished);
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
    if (!title.trim() || !content.trim()) {
      toast({ title: "Missing Information", description: "Title and Content are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const articleData = {
      title,
      excerpt,
      content,
      coverImageUrl,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublished,
      attachments,
      // authorId, authorName, createdAt, updatedAt, slug, viewCount will be handled by the parent page
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(articleData);
    } catch (error) {
      console.error("Error saving article:", error);
      toast({ title: "Save Failed", description: "Could not save article. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{initialData ? "Edit Article" : "Create New Article"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter article title" disabled={isSaving}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (Short Summary)</Label>
            <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Enter a brief summary for listings" disabled={isSaving}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Write your article content here..." editable={!isSaving} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://example.com/image.png or /images/local-image.png" disabled={isSaving}/>
             {coverImageUrl && <img src={coverImageUrl} alt="Cover preview" data-ai-hint="cover preview" className="mt-2 max-h-40 rounded-md border object-contain" />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., physiotherapy, technique, guide" disabled={isSaving}/>
          </div>

          <div className="space-y-4">
            <Label>Attachments</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button type="button" onClick={handleAddAttachment} variant="outline" className="w-full sm:w-auto" disabled={isSaving}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Attachment
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2 p-3 border rounded-md bg-secondary/30">
                <h4 className="text-sm font-medium text-foreground">Current Attachments:</h4>
                <ul className="space-y-1">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between text-sm p-2 bg-background rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{att.name} ({att.fileType})</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAttachment(att.id)} title="Remove attachment" disabled={isSaving}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isPublished" checked={isPublished} onCheckedChange={(checked) => setIsPublished(checked as boolean)} disabled={isSaving}/>
            <Label htmlFor="isPublished" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Publish Article
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            <Ban className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {initialData ? 'Update Article' : 'Create Article'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
