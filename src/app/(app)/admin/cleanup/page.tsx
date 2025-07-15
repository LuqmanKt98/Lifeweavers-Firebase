"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { getAllAppointments, deleteAppointment } from '@/lib/firebase/appointments';
import { getAllSessions, deleteSession } from '@/lib/firebase/sessions';
import type { Appointment, SessionNote } from '@/lib/types';

export default function CleanupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, sessionsData] = await Promise.all([
        getAllAppointments(),
        getAllSessions()
      ]);
      
      setAppointments(appointmentsData);
      setSessions(sessionsData);
      
      toast({
        title: "Data Loaded",
        description: `Found ${appointmentsData.length} appointments and ${sessionsData.length} sessions.`,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupMockAppointments = async () => {
    if (!user || user.role !== 'Super Admin') {
      toast({
        title: "Access Denied",
        description: "Only Super Admins can perform cleanup operations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Delete all appointments (they're likely mock data)
      let deletedCount = 0;
      for (const appointment of appointments) {
        await deleteAppointment(appointment.id);
        deletedCount++;
      }

      toast({
        title: "Cleanup Complete",
        description: `Deleted ${deletedCount} mock appointments.`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup mock data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupMockSessions = async () => {
    if (!user || user.role !== 'Super Admin') {
      toast({
        title: "Access Denied",
        description: "Only Super Admins can perform cleanup operations.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Filter sessions that look like mock data (you can adjust this logic)
      const mockSessions = sessions.filter(session =>
        session.attendingClinicianName?.includes('luqman') ||
        session.content?.includes('Test') ||
        session.content?.includes('Mock') ||
        new Date(session.dateOfSession).getFullYear() === 2025
      );

      let deletedCount = 0;
      for (const session of mockSessions) {
        await deleteSession(session.id);
        deletedCount++;
      }

      toast({
        title: "Session Cleanup Complete",
        description: `Deleted ${deletedCount} mock sessions.`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error during session cleanup:', error);
      toast({
        title: "Session Cleanup Failed",
        description: "Failed to cleanup mock sessions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrphanedSessionCleanup = async () => {
    if (sessions.length === 0) {
      toast({
        title: "No Sessions Found",
        description: "No sessions available for cleanup.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get all existing client IDs
      const existingClientIds = clients.map(client => client.id);

      // Find sessions that reference non-existent clients
      const orphanedSessions = sessions.filter(session =>
        !existingClientIds.includes(session.clientId)
      );

      let deletedCount = 0;
      for (const session of orphanedSessions) {
        await deleteSession(session.id);
        deletedCount++;
      }

      toast({
        title: "Orphaned Sessions Cleanup Complete",
        description: `Deleted ${deletedCount} sessions with missing client references.`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error during orphaned session cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean up orphaned sessions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'Super Admin') {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Access denied. Only Super Admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Database Cleanup
          </CardTitle>
          <CardDescription>
            Remove mock data and test appointments from the database.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments ({appointments.length})</CardTitle>
            <CardDescription>
              Clean up mock appointments from the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadData} disabled={isLoading} variant="outline" className="w-full">
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Load Data
            </Button>
            <Button onClick={cleanupMockAppointments} disabled={isLoading || appointments.length === 0} variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Appointments
            </Button>
            {appointments.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Found appointments:</p>
                <ul className="list-disc list-inside mt-2">
                  {appointments.slice(0, 5).map(apt => (
                    <li key={apt.id}>{apt.clientName} - {new Date(apt.dateOfSession).toLocaleDateString()}</li>
                  ))}
                  {appointments.length > 5 && <li>...and {appointments.length - 5} more</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions ({sessions.length})</CardTitle>
            <CardDescription>
              Clean up mock sessions from the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={cleanupMockSessions} disabled={isLoading || sessions.length === 0} variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Mock Sessions
            </Button>
            {sessions.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Found sessions:</p>
                <ul className="list-disc list-inside mt-2">
                  {sessions.slice(0, 5).map(session => (
                    <li key={session.id}>{session.attendingClinicianName} - {new Date(session.dateOfSession).toLocaleDateString()}</li>
                  ))}
                  {sessions.length > 5 && <li>...and {sessions.length - 5} more</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
