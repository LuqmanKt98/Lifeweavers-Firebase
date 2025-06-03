
// src/components/knowledge-base/KnowledgeBaseArticleDisplay.tsx
"use client";

import type { KnowledgeBaseArticle, Attachment, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarDays, UserCircle, Paperclip, Eye, FileText, Image as ImageIcon, Video, FileArchive, LinkIcon, Edit3, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import FilePreviewModal from '@/components/shared/FilePreviewModal';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface KnowledgeBaseArticleDisplayProps {
  article: KnowledgeBaseArticle;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
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

export default function KnowledgeBaseArticleDisplay({ article }: KnowledgeBaseArticleDisplayProps) {
  const { currentUser } = useAuth();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const handlePreviewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewModalOpen(true);
  };

  const canManageKB = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Super Admin');
  
  return (
    <>
    <Card className={cn("shadow-lg", !article.isPublished && canManageKB && "border-dashed border-amber-500 bg-amber-500/5")}>
      <CardHeader className="border-b pb-4">
        {article.coverImageUrl && (
          <div className="relative h-60 w-full mb-6 rounded-t-md overflow-hidden">
            <Image 
                src={article.coverImageUrl} 
                alt={`Cover image for ${article.title}`} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="article cover"
             />
          </div>
        )}
        <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold text-primary">{article.title}</CardTitle>
            {canManageKB && (
                <div className="flex flex-col items-end gap-2">
                     {!article.isPublished && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        <EyeOff className="mr-1 h-3 w-3" /> Draft - Not Visible to Others
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/knowledge-base/${article.id}/edit`}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit Article
                        </Link>
                    </Button>
                </div>
            )}
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://picsum.photos/seed/${article.authorId}/32/32`} alt={article.authorName} data-ai-hint="author photo"/>
              <AvatarFallback>{getInitials(article.authorName)}</AvatarFallback>
            </Avatar>
            <span>By {article.authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>
              {article.isPublished && article.publishedAt 
                ? `Published: ${format(new Date(article.publishedAt), 'PPP')}`
                : `Created: ${format(new Date(article.createdAt), 'PPP')}`}
            </span>
          </div>
          {article.updatedAt && article.updatedAt !== article.createdAt && (
            <div className="flex items-center gap-1 text-xs">
              <span>(Updated: {format(new Date(article.updatedAt), 'PPP')})</span>
            </div>
          )}
           {article.viewCount !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <Eye className="h-3 w-3" />
              <span>{article.viewCount} views</span>
            </div>
          )}
        </div>
        {article.tags && article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
        )}
      </CardHeader>
      <CardContent className="py-6 prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
      {article.attachments && article.attachments.length > 0 && (
        <CardFooter className="border-t pt-6 flex-col items-start">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" /> Attached Files
            </h3>
            <ul className="space-y-2 w-full">
            {article.attachments.map((att) => (
                <li key={att.id} className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 rounded-md transition-colors">
                <div className="flex items-center gap-2 text-sm text-foreground">
                    {getFileIcon(att.fileType)}
                    <span className="font-medium">{att.name}</span>
                    <span className="text-xs text-muted-foreground">({att.fileType})</span>
                </div>
                <div className="flex items-center gap-2">
                    {att.url.startsWith('http') && // Simple check for external link
                        <Button variant="outline" size="sm" asChild>
                            <Link href={att.url} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" /> Open Link
                            </Link>
                        </Button>
                    }
                    <Button variant="outline" size="sm" onClick={() => handlePreviewAttachment(att)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                </div>
                </li>
            ))}
            </ul>
        </CardFooter>
      )}
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
