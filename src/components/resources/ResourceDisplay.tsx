
// src/components/resources/ResourceDisplay.tsx
"use client";

import type { Resource, Attachment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarDays, UserCircle, Paperclip, Eye, FileText, Image as ImageIcon, Video, FileArchive, LinkIcon as LinkIconLucide, Package as PackageIcon, Edit3, EyeOff, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import FilePreviewModal from '@/components/shared/FilePreviewModal';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ResourceDisplayProps {
  resource: Resource;
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

export default function ResourceDisplay({ resource }: ResourceDisplayProps) {
  const { currentUser } = useAuth();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const handlePreviewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsPreviewModalOpen(true);
  };

  const canManageResources = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Super Admin');

  return (
    <>
    <Card className={cn("shadow-lg", !resource.isPublished && canManageResources && "border-dashed border-amber-500 bg-amber-500/5")}>
      <CardHeader className="border-b pb-4">
        {resource.coverImageUrl && (
          <div className="relative h-60 w-full mb-6 rounded-t-md overflow-hidden">
            <Image
                src={resource.coverImageUrl}
                alt={`Cover image for ${resource.title}`}
                layout="fill"
                objectFit="cover"
                data-ai-hint={`${resource.resourceType} illustration`}
             />
          </div>
        )}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
                <PackageIcon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline" className="capitalize">{resource.resourceType}</Badge>
            </div>
            {canManageResources && (
                 <div className="flex flex-col items-end gap-2">
                     {!resource.isPublished && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        <EyeOff className="mr-1 h-3 w-3" /> Draft - Not Visible to Others
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/resources/${resource.id}/edit`}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit Resource
                        </Link>
                    </Button>
                </div>
            )}
        </div>
        <CardTitle className="text-3xl font-bold text-primary">{resource.title}</CardTitle>
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(resource.authorName)}</AvatarFallback>
            </Avatar>
            <span>By {resource.authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>
              {resource.isPublished && resource.publishedAt
                ? `Published: ${format(new Date(resource.publishedAt), 'PPP')}`
                : `Created: ${format(new Date(resource.createdAt), 'PPP')}`}
            </span>
          </div>
          {resource.updatedAt && resource.updatedAt !== resource.createdAt && (
            <div className="flex items-center gap-1 text-xs">
              <span>(Updated: {format(new Date(resource.updatedAt), 'PPP')})</span>
            </div>
          )}
          {resource.viewCount !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <Eye className="h-3 w-3" />
              <span>{resource.viewCount} views</span>
            </div>
          )}
        </div>
        {resource.tags && resource.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {resource.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
        )}
      </CardHeader>
      <CardContent className="py-6">
        {resource.externalLink && (
            <div className="mb-6 p-4 border border-dashed border-primary/50 rounded-md bg-primary/5">
                <h3 className="text-md font-semibold mb-2 text-primary flex items-center gap-2">
                    <LinkIconLucide className="h-5 w-5" /> External Resource Link
                </h3>
                <p className="text-sm text-foreground/80 mb-3">This resource is primarily available at an external location:</p>
                <Button asChild>
                    <Link href={resource.externalLink} target="_blank" rel="noopener noreferrer">
                        Open Resource <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )}
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      </CardContent>
      {resource.attachments && resource.attachments.length > 0 && (
        <CardFooter className="border-t pt-6 flex-col items-start">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" /> Attached Files
            </h3>
            <ul className="space-y-2 w-full">
            {resource.attachments.map((att) => (
                <li key={att.id} className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 rounded-md transition-colors">
                <div className="flex items-center gap-2 text-sm text-foreground">
                    {getFileIcon(att.fileType)}
                    <span className="font-medium">{att.name}</span>
                    <span className="text-xs text-muted-foreground">({att.fileType})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreviewAttachment(att)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                     <Button variant="secondary" size="sm" asChild>
                        <Link href={att.url} target="_blank" rel="noopener noreferrer" download={att.name}>
                           Download
                        </Link>
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
