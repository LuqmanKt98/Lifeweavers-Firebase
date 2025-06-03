
// src/app/(app)/knowledge-base/[articleId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { KnowledgeBaseArticle } from '@/lib/types';
import { getArticle, getArticleBySlug, incrementArticleViewCount } from '@/lib/firebase/knowledge-base';
import KnowledgeBaseArticleDisplay from '@/components/knowledge-base/KnowledgeBaseArticleDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function KnowledgeBaseArticlePage() {
  const params = useParams();
  const articleId = params.articleId as string;
  const router = useRouter();

  const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (articleId) {
        setIsLoading(true);
        try {
          // Try to get by ID first, then by slug
          let foundArticle = await getArticle(articleId);
          if (!foundArticle) {
            foundArticle = await getArticleBySlug(articleId);
          }

          if (foundArticle && foundArticle.isPublished) {
            setArticle(foundArticle);
            // Increment view count
            try {
              await incrementArticleViewCount(foundArticle.id);
            } catch (error) {
              console.error('Error incrementing view count:', error);
            }
          } else {
            setArticle(null);
          }
        } catch (error) {
          console.error('Error fetching article:', error);
          setArticle(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchArticle();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full mt-4" />
        </div>
      </div>
    );
  }

  if (!article) {
    // Call notFound() to render the nearest not-found.tsx or a default 404 page
    // This should ideally be handled in a server component with generateStaticParams for better static generation,
    // but for a client component approach, this is how you'd trigger it.
    // However, direct notFound() usage is tricky in purely client components after initial render.
    // A common pattern is to redirect or show a custom message.
    // For simplicity, we'll show a message here.
    return (
        <div className="text-center py-10">
            <h1 className="text-2xl font-bold text-destructive">Article Not Found</h1>
            <p className="text-muted-foreground mt-2">The requested knowledge base article could not be found or is not published.</p>
            <Button onClick={() => router.push('/knowledge-base')} variant="outline" className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Knowledge Base
            </Button>
        </div>
    );
  }

  return (
    <div>
        <Button onClick={() => router.back()} variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <KnowledgeBaseArticleDisplay article={article} />
    </div>
  );
}
