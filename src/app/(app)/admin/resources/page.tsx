// src/app/(app)/admin/resources/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  ShieldAlert,
  FileText,
  Video,
  Link,
  Download,
  Calendar,
  Eye
} from 'lucide-react';
import type { Resource } from '@/lib/types';
import { getAllResources, deleteResource } from '@/lib/firebase/resources';
import { useRouter } from 'next/navigation';

export default function ResourcesManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const fetchedResources = await getAllResources(false); // Get all resources including drafts
        setResources(fetchedResources);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'Super Admin') {
      fetchResources();
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
            Only Super Administrators can manage system resources.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.excerpt && resource.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    resource.resourceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateResource = () => {
    router.push('/admin/resources/new');
  };

  const handleEditResource = (resourceId: string) => {
    router.push(`/admin/resources/${resourceId}/edit`);
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteResource(resourceId);
      setResources(prev => prev.filter(resource => resource.id !== resourceId));
      toast({
        title: "Resource Deleted",
        description: "The resource has been removed from the system.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewResource = (resource: Resource) => {
    if (resource.resourceType === 'website') {
      window.open(resource.externalLink || '#', '_blank');
    } else {
      router.push(`/resources/${resource.id}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'website':
        return <Link className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'video':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'website':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const resourcesByCategory = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.resourceType]) {
      acc[resource.resourceType] = [];
    }
    acc[resource.resourceType].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Resources Management
          </CardTitle>
          <CardDescription>
            Manage all system resources including documents, videos, and external links.
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
                placeholder="Search resources, descriptions, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreateResource}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources by Category */}
      {Object.keys(resourcesByCategory).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No resources found matching your search.' : 'No resources available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>
                {categoryResources.length} resource{categoryResources.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categoryResources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getTypeIcon(resource.resourceType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{resource.title}</h4>
                          <Badge className={getTypeColor(resource.resourceType)}>
                            {resource.resourceType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {resource.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Added: {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                          {resource.externalLink && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              External Link
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewResource(resource)}
                        title={resource.resourceType === 'website' ? 'Open Link' : 'View Resource'}
                      >
                        {resource.resourceType === 'website' ? (
                          <ExternalLink className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditResource(resource.id)}
                        title="Edit Resource"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteResource(resource.id)}
                        title="Delete Resource"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resource Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{resources.length}</div>
              <div className="text-sm text-muted-foreground">Total Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resources.filter(r => r.resourceType === 'document').length}
              </div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {resources.filter(r => r.resourceType === 'video').length}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {resources.filter(r => r.resourceType === 'website').length}
              </div>
              <div className="text-sm text-muted-foreground">Websites</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
