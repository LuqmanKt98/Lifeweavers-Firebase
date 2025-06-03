// src/components/dashboards/SuperAdminDashboard.tsx
"use client";

import type { User, SessionNote, Client } from '@/lib/types';
import AdminDashboard from './AdminDashboard'; // Super Admin can see everything Admin sees
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, UserCog, MessagesSquare, ListChecks, Settings, Database, FileText, Users, BookOpen, Package, Calendar } from 'lucide-react';

interface SuperAdminDashboardProps {
  user: User;
  recentSessions: SessionNote[];
  // allSessions prop (if any for calendar) removed, handled by DashboardPage
  clients: Client[];
  team: User[];
}

export default function SuperAdminDashboard({ user, recentSessions, clients, team }: SuperAdminDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="border-accent bg-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent-foreground/80">
            <ShieldCheck className="h-6 w-6" />
            Super Admin Panel
          </CardTitle>
          <CardDescription className="text-accent-foreground/70">
            You have full access to system data and administrative functions.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" /> User Management
            </CardTitle>
            <CardDescription>
              Add, edit, remove users and manage their roles. Full CRUD operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/users">
                 Manage All Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings, preferences, and security options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/settings">
                System Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Data Management
            </CardTitle>
            <CardDescription>
              Manage all client data, sessions, and system records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/data">
                Manage Data
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Notification Control
            </CardTitle>
            <CardDescription>
              Create, edit, and delete all system notifications and broadcasts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/notifications">
                Manage Notifications
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Knowledge Base
            </CardTitle>
            <CardDescription>
              Manage articles, content, and knowledge base resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/knowledge-base">
                Manage Articles
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Resources
            </CardTitle>
            <CardDescription>
              Manage all system resources, documents, and external links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/resources">
                Manage Resources
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Calendar Management
            </CardTitle>
            <CardDescription>
              Manage calendar events, sync with Google Calendar, and configure sync settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/admin/calendar">
                Manage Calendar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inherit Admin Dashboard sections - pass props without allSessions */}
      <AdminDashboard user={user} recentSessions={recentSessions} clients={clients} team={team} />
    </div>
  );
}
