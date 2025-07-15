"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  FileText, 
  Clock,
  TrendingUp,
  Activity,
  User,
  ArrowRight,
  Plus
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isFuture, isPast } from 'date-fns';
import { getAllClients } from '@/lib/firebase/clients';
import { getAllSessions } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import type { Client, SessionNote, User as UserType } from '@/lib/types';
import Link from 'next/link';

interface OverviewDashboardProps {
  user: UserType;
}

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  todaySessions: number;
  upcomingSessions: number;
  activeTeamMembers: number;
}

interface RecentSession extends SessionNote {
  clientName: string;
  clinicianName: string;
}

interface ClientWithStats extends Client {
  sessionCount: number;
  lastSessionDate?: string;
  isActive: boolean;
}

export default function OverviewDashboard({ user }: OverviewDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    todaySessions: 0,
    upcomingSessions: 0,
    activeTeamMembers: 0
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeClients, setActiveClients] = useState<ClientWithStats[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, sessionsData, usersData] = await Promise.all([
        getAllClients(),
        getAllSessions(),
        getAllUsers()
      ]);

      // Calculate stats
      const today = new Date();
      const todaySessions = sessionsData.filter(session => 
        isToday(new Date(session.dateOfSession))
      );
      const upcomingSessions = sessionsData.filter(session => 
        isFuture(new Date(session.dateOfSession))
      );
      const activeTeamMembers = usersData.filter(u => 
        u.role === 'Clinician' || u.role === 'Admin'
      );

      setStats({
        totalClients: clientsData.length,
        totalSessions: sessionsData.length,
        todaySessions: todaySessions.length,
        upcomingSessions: upcomingSessions.length,
        activeTeamMembers: activeTeamMembers.length
      });

      // Get recent sessions with client and clinician names
      const recentSessionsWithDetails = sessionsData
        .sort((a, b) => new Date(b.dateOfSession).getTime() - new Date(a.dateOfSession).getTime())
        .slice(0, 5)
        .map(session => {
          const client = clientsData.find(c => c.id === session.clientId);
          const clinician = usersData.find(u => u.id === session.attendingClinicianId);
          return {
            ...session,
            clientName: client?.name || 'Unknown Client',
            clinicianName: clinician?.name || session.attendingClinicianName || 'Unknown Clinician'
          };
        });

      setRecentSessions(recentSessionsWithDetails);

      // Get active clients with session counts
      const clientsWithStats = clientsData.map(client => {
        const clientSessions = sessionsData.filter(s => s.clientId === client.id);
        const lastSession = clientSessions.length > 0 
          ? clientSessions.sort((a, b) => new Date(b.dateOfSession).getTime() - new Date(a.dateOfSession).getTime())[0]
          : null;
        
        return {
          ...client,
          sessionCount: clientSessions.length,
          lastSessionDate: lastSession?.dateOfSession,
          isActive: clientSessions.length > 0
        };
      }).sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 5);

      setActiveClients(clientsWithStats);
      setTeamMembers(activeTeamMembers);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSessionStatusColor = (session: RecentSession) => {
    const sessionDate = new Date(session.dateOfSession);
    if (isPast(sessionDate) && !isToday(sessionDate)) {
      return 'text-green-600';
    } else if (isToday(sessionDate)) {
      return 'text-blue-600';
    } else if (isFuture(sessionDate)) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">
            Good morning, {user.name}!
          </CardTitle>
          <CardDescription className="text-lg">
            Here's what's happening in your clinic today.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sessions</p>
                <p className="text-3xl font-bold">{stats.todaySessions}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-3xl font-bold">{stats.activeTeamMembers}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Session Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Latest Session Notes
                </CardTitle>
                <CardDescription>
                  Overview of the most recent therapy sessions.
                </CardDescription>
              </div>
              <Link href="/sessions">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No session notes found.</p>
                <Link href="/sessions/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(session.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{session.clientName}</h3>
                        <Badge variant="outline" className="text-xs">
                          Session #{session.sessionNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {session.clinicianName} on {format(new Date(session.dateOfSession), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.dateOfSession), { addSuffix: true })}
                      </p>
                    </div>
                    <Link href={`/clients/${session.clientId}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Overview
                </CardTitle>
                <CardDescription>
                  Summary of active clients.
                </CardDescription>
              </div>
              <Link href="/clients">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No clients found.</p>
                <Link href="/clients/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Client
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeClients.map((client) => (
                  <div key={client.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{client.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Active for {formatDistanceToNow(new Date(client.dateAdded))}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {client.sessionCount} sessions
                        </span>
                      </div>
                    </div>
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
