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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Link as LinkIcon,
  FileText,
  Video,
  Package,
} from "lucide-react";
import type { Resource } from "@/lib/firebase-utils";
import {
  getResources,
  createResource,
  updateDocument,
  deleteDocument,
} from "@/lib/firebase-utils";

const RESOURCE_TYPES = [
  { value: "document", label: "Document", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: LinkIcon },
  { value: "other", label: "Other", icon: Package },
];

const ACCESS_LEVELS = [
  { value: "all", label: "Everyone" },
  { value: "admin", label: "Admins Only" },
  { value: "clinician", label: "Clinicians & Admins" },
];

export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"document" | "video" | "link" | "other">(
    "document"
  );
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [accessLevel, setAccessLevel] = useState<"all" | "admin" | "clinician">(
    "all"
  );

  const canManageResources =
    user?.role === "Super Admin" || user?.role === "Admin";

  useEffect(() => {
    loadResources();
  }, [user]);

  const loadResources = async () => {
    try {
      let fetchedResources: Resource[];
      if (user?.role === "Super Admin" || user?.role === "Admin") {
        // Admins see all resources
        fetchedResources = await getResources();
      } else {
        // Get all resources and filter client-side for proper access control
        const allResources = await getResources();

        if (user?.role === "Clinician") {
          // Clinicians see resources with "all" or "clinician" access
          fetchedResources = allResources.filter(resource =>
            resource.accessLevel === "all" || resource.accessLevel === "clinician"
          );
        } else {
          // Other users see only resources with "all" access
          fetchedResources = allResources.filter(resource =>
            resource.accessLevel === "all"
          );
        }
      }
      console.log(`Loaded ${fetchedResources.length} resources for user role: ${user?.role}`, fetchedResources);
      setResources(fetchedResources);
    } catch (error) {
      console.error("Error loading resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async () => {
    if (!title || !url) {
      toast({
        title: "Validation Error",
        description: "Title and URL are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newResource = await createResource({
        title,
        description,
        type,
        url,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        accessLevel,
      });

      setResources((prev) => [newResource, ...prev]);
      resetForm();
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Resource created successfully.",
      });
    } catch (error) {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: "Failed to create resource.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateResource = async () => {
    if (!selectedResource || !title || !url) return;

    try {
      await updateDocument("resources", selectedResource.id, {
        title,
        description,
        type,
        url,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        accessLevel,
      });

      setResources((prev) =>
        prev.map((resource) =>
          resource.id === selectedResource.id
            ? {
                ...resource,
                title,
                description,
                type,
                url,
                category,
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
                accessLevel,
              }
            : resource
        )
      );

      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Resource updated successfully.",
      });
    } catch (error) {
      console.error("Error updating resource:", error);
      toast({
        title: "Error",
        description: "Failed to update resource.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await deleteDocument("resources", id);
      setResources((prev) => prev.filter((resource) => resource.id !== id));
      toast({
        title: "Success",
        description: "Resource deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("document");
    setUrl("");
    setCategory("");
    setTags("");
    setAccessLevel("all");
    setSelectedResource(null);
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setTitle(resource.title);
    setDescription(resource.description);
    setType(resource.type);
    setUrl(resource.url);
    setCategory(resource.category);
    setTags(resource.tags.join(", "));
    setAccessLevel(resource.accessLevel);
    setIsEditDialogOpen(true);
  };

  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const ResourceTypeIcon = ({ type }: { type: string }) => {
    const resourceType = RESOURCE_TYPES.find((t) => t.value === type);
    const Icon = resourceType?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">
            Access and manage shared resources and materials.
          </p>
        </div>
        {canManageResources && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
                <DialogDescription>
                  Add a new resource to share with the team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Resource title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value: any) => setType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <type.icon className="mr-2 h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Resource URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Resource category"
                  />
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
                <div className="grid gap-2">
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Select
                    value={accessLevel}
                    onValueChange={(value: any) => setAccessLevel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
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
                <Button onClick={handleCreateResource}>Add Resource</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6">
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm
                  ? "No resources match your search criteria."
                  : "No resources have been added yet or you don't have access to view them."
                }
              </p>
              {canManageResources && !searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Resource" to create the first resource.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ResourceTypeIcon type={resource.type} />
                    <div>
                      <CardTitle className="text-xl">{resource.title}</CardTitle>
                      <CardDescription>{resource.category}</CardDescription>
                    </div>
                  </div>
                {canManageResources && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(resource)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{resource.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-center justify-between">
                <Button variant="link" className="px-0" asChild>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Resource →
                  </a>
                </Button>
                <Badge variant="outline">
                  {
                    ACCESS_LEVELS.find(
                      (level) => level.value === resource.accessLevel
                    )?.label
                  }
                </Badge>
              </div>
            </CardFooter>
          </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: any) => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Resource URL"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Resource category"
              />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-accessLevel">Access Level</Label>
              <Select
                value={accessLevel}
                onValueChange={(value: any) => setAccessLevel(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
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
            <Button onClick={handleUpdateResource}>Update Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
