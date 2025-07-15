"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionById } from '@/lib/firebase/sessions';
import { getClientById } from '@/lib/firebase/clients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, MapPin, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { SessionNote, Client } from '@/lib/types';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionNote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!params.id || typeof params.id !== 'string') return;

      try {
        const sessionData = await getSessionById(params.id);
        if (sessionData) {
          setSession(sessionData);
          
          // Load client data
          const clientData = await getClientById(sessionData.clientId);
          setClient(clientData);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [params.id]);

  if (!user || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Session Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">The requested session could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Session Details</h1>
      </div>

      <div className="grid gap-6">
        {/* Session Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Session Overview</span>
              <Badge variant="secondary">
                {session.sessionType || 'Session'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Client:</span>
                <span>{client?.name || session.clientName || 'Unknown Client'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>{format(new Date(session.dateOfSession), 'MMMM dd, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Time:</span>
                <span>{format(new Date(session.dateOfSession), 'h:mm a')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Clinician:</span>
                <span>{session.attendingClinicianName}</span>
              </div>
              
              {session.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Duration:</span>
                  <span>{session.duration} minutes</span>
                </div>
              )}
              
              {session.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{session.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session.content ? (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{session.content}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No session notes available.</p>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        {client && (
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{client.name}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{client.email}</span>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2">{client.phone}</span>
                </div>
                <div>
                  <span className="font-medium">Date of Birth:</span>
                  <span className="ml-2">
                    {client.dateOfBirth ? format(new Date(client.dateOfBirth), 'MMMM dd, yyyy') : 'Not provided'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {session.attachments && session.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {session.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="h-4 w-4" />
                    <span>{attachment.name || `Attachment ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
