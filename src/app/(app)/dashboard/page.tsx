
// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react'; // Added useState, useEffect
import { useAuth } from '@/contexts/AuthContext';
import OverviewDashboard from '@/components/dashboards/OverviewDashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added Button
import type { Client, SessionNote, User } from '@/lib/types';
import { Lightbulb, RefreshCw, Loader2, CalendarIcon } from 'lucide-react'; // Added RefreshCw, Loader2, CalendarIcon
import { getAllClients, cleanupOrphanedData } from '@/lib/firebase/clients';
import { getRecentSessions } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import { getAllAppointments } from '@/lib/firebase/appointments';
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
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sessionsForCalendarView, setSessionsForCalendarView] = useState<SessionNote[]>([]);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        let [clientsData, sessionsData, usersData, appointmentsData] = await Promise.all([
          getAllClients(),
          getRecentSessions(10),
          getAllUsers(),
          getAllAppointments()
        ]);

        // Auto-cleanup orphaned data
        try {
          const cleanupResult = await cleanupOrphanedData();
          const totalCleaned = cleanupResult.deletedSessions + cleanupResult.deletedAppointments + cleanupResult.deletedTasks + cleanupResult.deletedReports;

          if (totalCleaned > 0) {
            console.log('🧹 Auto-cleanup completed:', cleanupResult);

            // Show user-friendly notification
            toast({
              title: "🧹 Data Cleanup",
              description: `Automatically cleaned ${totalCleaned} orphaned records to keep your data consistent.`,
              duration: 3000,
            });

            // Reload data after cleanup
            const [updatedSessionsData, updatedAppointmentsData] = await Promise.all([
              getRecentSessions(10),
              getAllAppointments()
            ]);

            // Update state with fresh data
            setSessions(updatedSessionsData);
            setAppointments(updatedAppointmentsData);
          }
        } catch (cleanupError) {
          console.warn('Auto-cleanup failed:', cleanupError);
        }

        console.log('Dashboard data loaded:', {
          clients: clientsData.length,
          sessions: sessionsData.length,
          users: usersData.length,
          appointments: appointmentsData.length
        });

        setClients(clientsData);
        setSessions(sessionsData);
        setTeamMembers(usersData);
        setAppointments(appointmentsData);

        // Filter sessions based on user role
        let filteredSessions: SessionNote[];
        if (user.role === 'Admin' || user.role === 'Super Admin') {
          filteredSessions = sessionsData;
        } else if (user.role === 'Clinician') {
          filteredSessions = sessionsData.filter(session => session.attendingClinicianId === user.id);
        } else {
          filteredSessions = [];
        }

        // Filter appointments based on user role
        let filteredAppointments = appointmentsData;
        if (user.role === 'Clinician') {
          filteredAppointments = appointmentsData.filter(appointment =>
            appointment.attendingClinicianId === user.id
          );
        }

        // Combine sessions and appointments for calendar view
        const combinedCalendarData = [...filteredSessions, ...filteredAppointments];
        setSessionsForCalendarView(combinedCalendarData);

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

  // Sessions are now handled by OverviewDashboard component

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




  // Use dynamic OverviewDashboard for all users - no more role-specific dashboards

  return (
    <div className="space-y-6">
      {/* Notification Card - Shows on login and dismisses on navigation */}
      <NotificationCard />

      {/* Notification Popup - Shows after login */}
      {showNotificationPopup && (
        <NotificationPopup onClose={() => setShowNotificationPopup(false)} />
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
                <CalendarIcon className="h-6 w-6" /> Appointments
              </CardTitle>
              <CardDescription>
                View past and upcoming sessions. Click on a day to see details.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(user.role === 'Admin' || user.role === 'Super Admin') && (
                <Button onClick={handleSyncCalendar} disabled={isSyncingCalendar} variant="outline" size="sm">
                  {isSyncingCalendar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {isSyncingCalendar ? 'Syncing Calendar...' : 'Sync Google Calendar'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <EventCalendar sessions={sessionsForCalendarView} />
        </CardContent>
      </Card>

      {/* Use the new dynamic overview dashboard for all users */}
      <OverviewDashboard user={user} />
    </div>
  );
}

