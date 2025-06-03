// src/components/dashboards/AdminDashboard.tsx
"use client";

import type { User, SessionNote, Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, FileText, Briefcase, Clock, ArrowRight, Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
// EventCalendar import removed as it's now in DashboardPage

interface AdminDashboardProps {
  user: User;
  recentSessions: SessionNote[]; // For the list of recent sessions
  // allSessions prop (if any for calendar) removed, handled by DashboardPage
  clients: Client[];
  team: User[];
}

export default function AdminDashboard({ user, recentSessions, clients, team }: AdminDashboardProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };
  
  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown Client';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* EventCalendar rendering removed from here */}

      <Card className="lg:col-span-2 md:col-span-2"> {/* Adjusted span since calendar is removed */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Latest Session Notes
          </CardTitle>
          <CardDescription>Overview of the most recent therapy sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <ul className="space-y-4">
              {recentSessions.slice(0, 5).map((session) => ( // Show latest 5 sessions
                <li key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg transition-colors gap-3 sm:gap-2">
                  <div className="flex items-center gap-3">
                     <Avatar className="h-10 w-10">
                       <AvatarImage src={`https://picsum.photos/seed/${session.attendingClinicianId}/40/40`} alt={session.attendingClinicianName} data-ai-hint="therapist photo" />
                       <AvatarFallback>{getInitials(session.attendingClinicianName)}</AvatarFallback>
                     </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        Session {session.sessionNumber} for {getClientName(session.clientId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {session.attendingClinicianName} ({session.attendingClinicianVocation}) on {format(new Date(session.dateOfSession), 'MMM d, yyyy')}
                      </p>
                       <p className="text-sm mt-1 italic text-foreground/80 line-clamp-1">"{session.content.replace(/<[^>]*>/g, '')}"</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="mt-2 sm:mt-0 self-end sm:self-center">
                    <Link href={`/clients/${session.clientId}#session-${session.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No recent session notes available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-1"> {/* Adjusted span */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Client Overview
          </CardTitle>
          <CardDescription>Summary of active clients.</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <ul className="space-y-3">
              {clients.slice(0, 5).map((client) => ( // Show first 5 clients for overview
                <li key={client.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                  <div className="flex items-center gap-3">
                     <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://picsum.photos/seed/${client.id}/36/36`} alt={client.name} data-ai-hint="client profile"/>
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Active for {formatDistanceToNow(new Date(client.dateAdded), { addSuffix: false })}
                      </p>
                    </div>
                  </div>
                   <Button variant="ghost" size="icon" asChild>
                      <Link href={`/clients/${client.id}`}><Users className="h-4 w-4"/></Link>
                   </Button>
                </li>
              ))}
               {clients.length > 5 && <p className="text-xs text-muted-foreground mt-2">And {clients.length - 5} more clients...</p>}
            </ul>
          ) : (
            <p className="text-muted-foreground">No clients found.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3 md:col-span-2"> {/* Keep this full width */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Team Details
          </CardTitle>
          <CardDescription>Overview of the LWV CLINIC E-DOC team.</CardDescription>
        </CardHeader>
        <CardContent>
           {team.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                     <AvatarImage src={`https://picsum.photos/seed/${member.id}/40/40`} alt={member.name} data-ai-hint="team member" />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.vocation || member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Team information is not available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
