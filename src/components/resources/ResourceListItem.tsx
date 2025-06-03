
// src/components/resources/ResourceListItem.tsx
"use client";

import type { Resource, User } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, UserCircle, Package, Link as LinkIconLucide, Edit3, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResourceListItemProps {
  resource: Resource;
  currentUser: User | null;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
};

export default function ResourceListItem({ resource, currentUser }: ResourceListItemProps) {
  const canManageResources = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Super Admin');

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200 relative", !resource.isPublished && canManageResources && "border-dashed border-amber-500 bg-amber-500/5")}>
      {canManageResources && !resource.isPublished && (
        <Badge variant="outline" className="absolute top-2 right-2 bg-amber-100 text-amber-700 border-amber-300">
          <EyeOff className="mr-1 h-3 w-3" /> Draft
        </Badge>
      )}
      <Link href={`/resources/${resource.id}`} className="block group">
        <CardHeader className="pb-3">
          {resource.coverImageUrl && (
            <div className="relative h-40 w-full mb-4 rounded-t-md overflow-hidden">
              <Image 
                src={resource.coverImageUrl} 
                alt={`Cover image for ${resource.title}`} 
                layout="fill" 
                objectFit="cover" 
                className="group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={`${resource.resourceType} cover`}
              />
            </div>
          )}
          <CardTitle className="text-xl font-semibold text-primary group-hover:underline">
            {resource.title}
          </CardTitle>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <div className="flex items-center gap-1">
              <UserCircle className="h-3.5 w-3.5" />
              <span>{resource.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                 {resource.isPublished && resource.publishedAt 
                  ? `Published: ${format(new Date(resource.publishedAt), 'MMM d, yyyy')}`
                  : `Created: ${format(new Date(resource.createdAt), 'MMM d, yyyy')}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                <span className="capitalize">{resource.resourceType}</span>
            </div>
            {resource.externalLink && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <LinkIconLucide className="h-3.5 w-3.5" />
                    <span>External Link</span>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-foreground/80 line-clamp-3">
            {resource.excerpt || resource.content.substring(0, 150).replace(/<[^>]+>/g, '') + '...'}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between items-center pt-3">
        <div className="flex flex-wrap gap-1">
          {resource.tags?.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {resource.tags && resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{resource.tags.length - 3} more</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
            {canManageResources && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/resources/${resource.id}/edit`}>
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                    </Link>
                </Button>
            )}
            <Link href={`/resources/${resource.id}`} className="text-sm text-primary group-hover:underline flex items-center gap-1">
                View Resource <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
