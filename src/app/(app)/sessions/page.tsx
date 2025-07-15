"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllSessions } from '@/lib/firebase/sessions';
import { getAllClients, cleanupOrphanedData } from '@/lib/firebase/clients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { SessionNote, Client } from '@/lib/types';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [sessionsData, clientsData] = await Promise.all([
          getAllSessions(),
          getAllClients()
        ]);

        // Filter sessions based on user role
        let filteredSessions = sessionsData;
        if (user.role === 'Clinician') {
          // Clinicians can see sessions for clients they're assigned to
          const assignedClientIds = clientsData
            .filter(client => client.teamMemberIds?.includes(user.id))
            .map(client => client.id);

          filteredSessions = sessionsData.filter(session =>
            session.attendingClinicianId === user.id ||
            assignedClientIds.includes(session.clientId)
          );
        }

        // Auto-cleanup orphaned data
        try {
          const cleanupResult = await cleanupOrphanedData();
          if (cleanupResult.deletedSessions > 0) {
            console.log('🧹 Auto-cleanup completed in sessions page:', cleanupResult);
            // Reload sessions data after cleanup
            const updatedSessionsData = await getAllSessions();
            let updatedFilteredSessions = updatedSessionsData;
            if (user.role === 'Clinician') {
              const assignedClientIds = clientsData
                .filter(client => client.teamMemberIds?.includes(user.id))
                .map(client => client.id);
              updatedFilteredSessions = updatedSessionsData.filter(session =>
                session.attendingClinicianId === user.id ||
                assignedClientIds.includes(session.clientId)
              );
            }
            setSessions(updatedFilteredSessions);
          }
        } catch (cleanupError) {
          console.warn('Auto-cleanup failed:', cleanupError);
        }

        setSessions(filteredSessions);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  if (!user || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <Link href="/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {sessions.map(session => (
          <Card key={session.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {getClientName(session.clientId)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(session.dateOfSession), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(session.dateOfSession), 'h:mm a')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {session.attendingClinicianName}
                    </div>
                  </div>
                </div>
                <Link href={`/sessions/${session.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No sessions found.</p>
            <Link href="/sessions/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
