"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Users, 
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: 'all' | 'admins' | 'clinicians' | 'clients';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
}

export default function NotificationsManagement() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetAudience: 'all' as const,
    expiresAt: ''
  });

  useEffect(() => {
    if (!user) return;

    // Subscribe to admin notifications
    const notificationsRef = collection(db, 'admin_notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData: AdminNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          targetAudience: data.targetAudience,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          createdBy: data.createdBy,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt
        });
      });
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        targetAudience: formData.targetAudience,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user.name,
        ...(formData.expiresAt && { expiresAt: Timestamp.fromDate(new Date(formData.expiresAt)) })
      };

      if (editingNotification) {
        // Update existing notification
        const notificationRef = doc(db, 'admin_notifications', editingNotification.id);
        await updateDoc(notificationRef, {
          ...notificationData,
          updatedAt: Timestamp.now()
        });
        toast.success('Notification updated successfully');
      } else {
        // Create new notification
        await addDoc(collection(db, 'admin_notifications'), notificationData);
        toast.success('Notification created successfully');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      expiresAt: ''
    });
    setIsCreating(false);
    setEditingNotification(null);
  };

  const handleEdit = (notification: AdminNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience,
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toISOString().slice(0, 16) : ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteDoc(doc(db, 'admin_notifications', id));
        toast.success('Notification deleted successfully');
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;

      const notificationRef = doc(db, 'admin_notifications', id);
      await updateDoc(notificationRef, {
        isActive: !notification.isActive,
        updatedAt: Timestamp.now()
      });
      toast.success('Notification status updated');
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast.error('Failed to update notification status');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'admins': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'clinicians': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'clients': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Notification Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and delete all system notifications and broadcasts
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </CardTitle>
            <CardDescription>
              {editingNotification ? 'Update the notification details' : 'Create a new system notification'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Users</option>
                    <option value="admins">Admins Only</option>
                    <option value="clinicians">Clinicians Only</option>
                    <option value="clients">Clients Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Expires At (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  {editingNotification ? 'Update' : 'Create'} Notification
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Notifications ({notifications.length})
          </CardTitle>
          <CardDescription>
            Manage all system notifications and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.isActive ? 'bg-card' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(notification.type)}
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created by {notification.createdBy} on{' '}
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge className={getAudienceColor(notification.targetAudience)}>
                        {notification.targetAudience}
                      </Badge>
                      <Badge variant={notification.isActive ? 'default' : 'secondary'}>
                        {notification.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm mb-3">{notification.message}</p>

                  {notification.expiresAt && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Expires: {new Date(notification.expiresAt).toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notification)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(notification.id)}
                    >
                      {notification.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
