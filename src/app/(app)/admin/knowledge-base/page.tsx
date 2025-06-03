// src/app/(app)/admin/knowledge-base/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ShieldAlert,
  FileText,
  Tag,
  Calendar
} from 'lucide-react';
import type { KnowledgeBaseArticle } from '@/lib/types';
import { getAllArticles, deleteArticle } from '@/lib/firebase/knowledge-base';
import { useRouter } from 'next/navigation';

export default function KnowledgeBaseManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const fetchedArticles = await getAllArticles(false); // Get all articles including drafts
        setArticles(fetchedArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
        toast({
          title: "Error",
          description: "Failed to load articles. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'Super Admin') {
      fetchArticles();
    }
  }, [currentUser, toast]);

  if (!currentUser || currentUser.role !== 'Super Admin') {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            Only Super Administrators can manage knowledge base articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleCreateArticle = () => {
    router.push('/admin/knowledge-base/new');
  };

  const handleEditArticle = (articleId: string) => {
    router.push(`/admin/knowledge-base/${articleId}/edit`);
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      setArticles(prev => prev.filter(article => article.id !== articleId));
      toast({
        title: "Article Deleted",
        description: "The article has been removed from the knowledge base.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewArticle = (articleId: string) => {
    router.push(`/knowledge-base/${articleId}`);
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getStatusText = (isPublished: boolean) => {
    return isPublished ? 'Published' : 'Draft';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Knowledge Base Management
          </CardTitle>
          <CardDescription>
            Create, edit, and manage all knowledge base articles and content.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreateArticle}>
              <Plus className="mr-2 h-4 w-4" />
              Create Article
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <div className="grid gap-4">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No articles found matching your search.' : 'No articles available.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      <Badge className={getStatusColor(article.isPublished)}>
                        {getStatusText(article.isPublished)}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {article.excerpt || article.content.substring(0, 150)}...
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags && article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created: {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated: {new Date(article.updatedAt).toLocaleDateString()}
                      </span>
                      <span>Author: {article.authorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewArticle(article.id)}
                      title="View Article"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditArticle(article.id)}
                      title="Edit Article"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteArticle(article.id)}
                      title="Delete Article"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{articles.length}</div>
              <div className="text-sm text-muted-foreground">Total Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.isPublished).length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {articles.filter(a => !a.isPublished).length}
              </div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(articles.flatMap(a => a.tags)).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Tags</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
