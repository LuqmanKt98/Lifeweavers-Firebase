
// src/app/(app)/admin/knowledge-base/new/page.tsx
"use client";

import ArticleEditorForm from '@/components/admin/knowledge-base/ArticleEditorForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { KnowledgeBaseArticle } from '@/lib/types';
import { createArticle } from '@/lib/firebase/knowledge-base';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function NewKnowledgeBaseArticlePage() {
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
            You do not have permission to create new knowledge base articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveArticle = async (articleData: Omit<KnowledgeBaseArticle, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'slug' | 'viewCount'>) => {
    if (!currentUser) return;

    try {
      const newArticleData = {
        ...articleData,
        slug: articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        authorId: currentUser.id,
        authorName: currentUser.name,
      };

      const newArticle = await createArticle(newArticleData);

      toast({
        title: "Article Created",
        description: `"${newArticle.title}" has been successfully created.`,
      });
      router.push(`/knowledge-base/${newArticle.id}`);
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary">Create New Knowledge Base Article</h1>
      <ArticleEditorForm 
        onSave={handleSaveArticle} 
        onCancel={() => router.push('/knowledge-base')} 
        currentUser={currentUser}
      />
    </div>
  );
}
