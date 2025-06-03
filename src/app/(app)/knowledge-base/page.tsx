"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Book,
  FileText,
} from "lucide-react";
import type { KnowledgeBaseArticle } from "@/lib/types";
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "@/lib/firebase/knowledge-base";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ARTICLE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "clinical", label: "Clinical" },
  { value: "technical", label: "Technical" },
  { value: "policy", label: "Policy" },
  { value: "procedure", label: "Procedure" },
];

const formatDate = (date: any) => {
  if (!date) return "Unknown date";
  try {
    // Handle Firebase Timestamp
    if (date && typeof date === "object" && "seconds" in date) {
      return format(new Date(date.seconds * 1000), "MMM d, yyyy");
    }
    // Handle ISO string
    if (typeof date === "string") {
      return format(new Date(date), "MMM d, yyyy");
    }
    // Handle Date object
    if (date instanceof Date) {
      return format(date, "MMM d, yyyy");
    }
    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] =
    useState<KnowledgeBaseArticle | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const canManageArticles =
    user?.role === "Super Admin" || user?.role === "Admin";

  useEffect(() => {
    loadArticles();
  }, [user]);

  const loadArticles = async () => {
    try {
      const fetchedArticles = await getAllArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error loading articles:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base articles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!title || !content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newArticle = await createArticle({
        title,
        content,
        excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublished,
        authorId: user?.id || "",
        authorName: user?.name || "",
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      });

      setArticles((prev) => [newArticle, ...prev]);
      resetForm();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Article created successfully.",
      });
    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create article.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateArticle = async () => {
    if (!selectedArticle || !title || !content) return;

    try {
      await updateArticle(selectedArticle.id, {
        title,
        content,
        excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublished,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      });

      setArticles((prev) =>
        prev.map((article) =>
          article.id === selectedArticle.id
            ? {
                ...article,
                title,
                content,
                category,
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
                isPublished,
                updatedAt: new Date().toISOString(),
              }
            : article
        )
      );

      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Article updated successfully.",
      });
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Error",
        description: "Failed to update article.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((article) => article.id !== id));
      toast({
        title: "Success",
        description: "Article deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setTags("");
    setIsPublished(true);
    setSelectedArticle(null);
  };

  const handleEdit = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setTags(article.tags.join(", "));
    setIsPublished(article.isPublished);
    setIsEditDialogOpen(true);
  };

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Access and manage knowledge base articles.
          </p>
        </div>
        {canManageArticles && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Article</DialogTitle>
                <DialogDescription>
                  Create a new knowledge base article.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Article title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Article content"
                    className="min-h-[200px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="published">Published</Label>
                  <Select
                    value={isPublished ? "true" : "false"}
                    onValueChange={(value) => setIsPublished(value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateArticle}>Create Article</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Book className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>{article.title}</CardTitle>
                    <CardDescription>
                      By {article.authorName || "Unknown"} • Updated{" "}
                      {formatDate(article.updatedAt)}
                    </CardDescription>
                  </div>
                </div>
                {canManageArticles && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(article)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteArticle(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{article.content}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <FileText className="mr-1 h-3 w-3" />
                  {ARTICLE_CATEGORIES.find(
                    (cat) => cat.value === article.category
                  )?.label || article.category}
                </Badge>
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
                {!article.isPublished && (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>Update article details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Article content"
                className="min-h-[200px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-published">Published</Label>
              <Select
                value={isPublished ? "true" : "false"}
                onValueChange={(value) => setIsPublished(value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateArticle}>Update Article</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
