
// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react'; // Added useState, useEffect
import { useAuth } from '@/contexts/AuthContext';
import ClinicianDashboard from '@/components/dashboards/ClinicianDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added Button
import type { Client, SessionNote, User } from '@/lib/types';
import { Lightbulb, RefreshCw, Loader2, CalendarIcon } from 'lucide-react'; // Added RefreshCw, Loader2, CalendarIcon
import { getAllClients } from '@/lib/firebase/clients';
import { getRecentSessions } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import EventCalendar from '@/components/shared/EventCalendar';
import NotificationCard from '@/components/shared/NotificationCard';
import NotificationPopup from '@/components/notifications/NotificationPopup';
import { syncGoogleCalendar } from '@/ai/flows/sync-google-calendar-flow'; // Added import for the new flow
import { useToast } from '@/hooks/use-toast'; // Added useToast

// Dashboard will load real data from Firebase

// Real data will be loaded from Firebase


// Real team data will be loaded from Firebase


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [sessionsForCalendarView, setSessionsForCalendarView] = useState<SessionNote[]>([]);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [clientsData, sessionsData, usersData] = await Promise.all([
          getAllClients(),
          getRecentSessions(10),
          getAllUsers()
        ]);

        setClients(clientsData);
        setSessions(sessionsData);
        setTeamMembers(usersData);

        // Filter sessions based on user role
        let filteredSessions: SessionNote[];
        if (user.role === 'Admin' || user.role === 'Super Admin') {
          filteredSessions = sessionsData;
        } else if (user.role === 'Clinician') {
          filteredSessions = sessionsData.filter(session => session.attendingClinicianId === user.id);
        } else {
          filteredSessions = [];
        }
        setSessionsForCalendarView(filteredSessions);

        // Show notification popup after successful data load (simulating login)
        setTimeout(() => {
          setShowNotificationPopup(true);
        }, 1000);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, toast]);

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  // Process recent sessions for Admin/SuperAdmin dashboards
  const sortedRecentSessions = sessions
    .map(s => ({...s, attachments: s.attachments || []}))
    .slice()
    .sort((a,b) => new Date(b.dateOfSession).getTime() - new Date(a.dateOfSession).getTime());

  const handleSyncCalendar = async () => {
    if (!user) return;
    setIsSyncingCalendar(true);

    toast({
      title: "Calendar Sync Started",
      description: "Fetching events from Google Calendar...",
    });

    try {
      // Enhanced sync with date range and options
      const result = await syncGoogleCalendar({
        userId: user.id,
        dateRange: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        },
        includeRecurring: true,
        eventTypes: ['appointment', 'consultation', 'follow-up', 'assessment', 'meeting']
      });

      // Filter original calendar sessions based on role
      let baseSessions: SessionNote[];
      if (user.role === 'Admin' || user.role === 'Super Admin') {
        baseSessions = sessions;
      } else if (user.role === 'Clinician') {
        baseSessions = sessions.filter(session => session.attendingClinicianId === user.id);
      } else {
        baseSessions = [];
      }

      // Remove any existing Google Calendar events to avoid duplicates
      const filteredBaseSessions = baseSessions.filter(session =>
        !session.id.startsWith('gcal-') && !session.googleEventId
      );

      // Filter synced events based on user role
      let filteredSyncedEvents = result.events;
      if (user.role === 'Clinician') {
        filteredSyncedEvents = result.events.filter(event => event.attendingClinicianId === user.id);
      }

      // Combine existing sessions with new calendar events
      const combinedSessions = [...filteredBaseSessions, ...filteredSyncedEvents];

      // Sort by date
      combinedSessions.sort((a, b) => new Date(a.dateOfSession).getTime() - new Date(b.dateOfSession).getTime());

      setSessionsForCalendarView(combinedSessions);

      toast({
        title: "Calendar Sync Complete",
        description: `Successfully synced ${filteredSyncedEvents.length} events from Google Calendar (${result.syncMetadata.totalEvents} total events found).`,
      });

      // Log sync metadata for debugging
      console.log('Calendar sync metadata:', result.syncMetadata);

    } catch (error) {
      console.error('Calendar sync error:', error);
      toast({
        title: "Calendar Sync Failed",
        description: "Unable to sync with Google Calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };


  const renderDashboard = () => {
    switch (user.role) {
      case 'Clinician':
        const clinicianClients = clients.filter(client =>
          client.teamMemberIds?.includes(user.id)
        );
        return <ClinicianDashboard user={user} clients={clinicianClients} team={teamMembers} />;
      case 'Admin':
        return <AdminDashboard user={user} recentSessions={sortedRecentSessions} clients={clients} team={teamMembers} />;
      case 'Super Admin':
        return <SuperAdminDashboard user={user} recentSessions={sortedRecentSessions} clients={clients} team={teamMembers} />;
      default:
        return <p>Unknown user role.</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Card - Shows on login and dismisses on navigation */}
      <NotificationCard />

      {/* Notification Popup - Shows after login */}
      {showNotificationPopup && (
        <NotificationPopup onClose={() => setShowNotificationPopup(false)} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
            <CalendarIcon className="h-6 w-6" /> Appointments
          </CardTitle>
          {(user.role === 'Admin' || user.role === 'Super Admin') && (
            <Button onClick={handleSyncCalendar} disabled={isSyncingCalendar} variant="outline" size="sm">
              {isSyncingCalendar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isSyncingCalendar ? 'Syncing Calendar...' : 'Sync Google Calendar'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
           <EventCalendar sessions={sessionsForCalendarView} />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            {getWelcomeMessage()}, {user.name}!
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            Here's what's happening in LWV CLINIC E-DOC today.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-foreground/70">
            <Lightbulb className="h-5 w-5 text-accent-foreground" />
            <span>Quick Tip: Use the sidebar to navigate to your clients or manage users.</span>
        </CardContent>
      </Card>
      {renderDashboard()}
    </div>
  );
}

