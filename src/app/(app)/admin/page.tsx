"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  Database, 
  Bell, 
  BookOpen, 
  FolderOpen, 
  Calendar,
  ArrowRight,
  Activity,
  Shield,
  FileText,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/lib/firebase/users';
import { getAllClients } from '@/lib/firebase/clients';
import { getAllSessions } from '@/lib/firebase/sessions';
import type { User } from '@/lib/types';

interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalSessions: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClients: 0,
    totalSessions: 0,
    activeUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const [users, clients, sessions] = await Promise.all([
        getAllUsers(),
        getAllClients(),
        getAllSessions()
      ]);

      const activeUsers = users.filter(u => u.role !== 'Client').length;

      setStats({
        totalUsers: users.length,
        totalClients: clients.length,
        totalSessions: sessions.length,
        activeUsers
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const managementSections = [
    {
      title: "User Management",
      description: "Add, edit, remove users and manage their roles. Full CRUD operations.",
      icon: Users,
      href: "/admin/users",
      buttonText: "Manage All Users",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Data Management",
      description: "Manage all client data, sessions, and system records.",
      icon: Database,
      href: "/admin/cases",
      buttonText: "Manage Data",
      color: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Notification Control",
      description: "Create, edit, and delete all system notifications and broadcasts.",
      icon: Bell,
      href: "/admin/notifications",
      buttonText: "Manage Notifications",
      color: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
      iconColor: "text-yellow-600 dark:text-yellow-400"
    },
    {
      title: "Knowledge Base",
      description: "Manage articles, content, and knowledge base resources.",
      icon: BookOpen,
      href: "/admin/knowledge-base",
      buttonText: "Manage Articles",
      color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Resources",
      description: "Manage all system resources, documents, and external links.",
      icon: FolderOpen,
      href: "/admin/resources",
      buttonText: "Manage Resources",
      color: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
      iconColor: "text-pink-600 dark:text-pink-400"
    },
    {
      title: "Calendar Management",
      description: "Manage calendar events, sync with Google Calendar, and configure sync settings.",
      icon: Calendar,
      href: "/admin/calendar",
      buttonText: "Manage Calendar",
      color: "bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800",
      iconColor: "text-teal-600 dark:text-teal-400"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive system management and configuration center
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{stats.totalSessions}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className={`transition-all duration-200 hover:shadow-lg ${section.color}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-8 w-8 ${section.iconColor}`} />
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={section.href}>
                  <Button className="w-full" variant="default">
                    {section.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used administrative functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users/new">
              <Button variant="outline" className="w-full">
                Add New User
              </Button>
            </Link>
            <Link href="/admin/notifications">
              <Button variant="outline" className="w-full">
                Manage Notifications
              </Button>
            </Link>
            <Link href="/admin/knowledge-base">
              <Button variant="outline" className="w-full">
                Knowledge Base
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
