
// src/app/(app)/admin/resources/new/page.tsx
"use client";

import ResourceEditorForm from '@/components/admin/resources/ResourceEditorForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { Resource } from '@/lib/types';
import { createResource } from '@/lib/firebase/resources';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function NewResourcePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin')) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            You do not have permission to create new resources.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveResource = async (resourceData: Omit<Resource, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'slug' | 'viewCount'>) => {
    if (!currentUser) return;

    try {
      const newResourceData = {
        ...resourceData,
        slug: resourceData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        authorId: currentUser.id,
        authorName: currentUser.name,
      };

      const newResource = await createResource(newResourceData);

      toast({
        title: "Resource Created",
        description: `"${newResource.title}" has been successfully created.`,
      });
      router.push(`/resources/${newResource.id}`);
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: "Failed to create resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary">Create New Resource</h1>
      <ResourceEditorForm 
        onSave={handleSaveResource} 
        onCancel={() => router.push('/resources')} 
        currentUser={currentUser}
      />
    </div>
  );
}
