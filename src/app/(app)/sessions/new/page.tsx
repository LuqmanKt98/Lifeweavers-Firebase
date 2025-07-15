"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllClients, createClient } from '@/lib/firebase/clients';
import { createSession } from '@/lib/firebase/sessions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';

export default function NewSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    dateOfSession: '',
    content: '',
    sessionType: 'therapy',
    duration: '60',
    location: ''
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('User:', user);

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a session",
        variant: "destructive",
      });
      return;
    }

    if (!formData.clientName || !formData.dateOfSession) {
      toast({
        title: "Validation Error",
        description: "Please enter client name and date/time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create or find client by name
      let clientId = '';
      const existingClient = clients.find(c => c.name.toLowerCase() === formData.clientName.toLowerCase());

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client if doesn't exist
        const newClient = {
          name: formData.clientName,
          email: '',
          phone: '',
          dateOfBirth: '',
          address: '',
          emergencyContact: '',
          medicalHistory: '',
          currentMedications: '',
          allergies: '',
          notes: '',
          isActive: true,
          dateAdded: new Date().toISOString(),
          addedByUserId: user.id,
          addedByUserName: user.name
        };

        const createdClient = await createClient(newClient);
        clientId = createdClient.id;
      }

      const sessionData = {
        clientId: clientId,
        clientName: formData.clientName,
        attendingClinicianId: user.id,
        attendingClinicianName: user.name,
        attendingClinicianVocation: user.vocation || 'Therapist',
        dateOfSession: new Date(formData.dateOfSession).toISOString(),
        content: formData.content,
        sessionType: formData.sessionType,
        duration: parseInt(formData.duration),
        location: formData.location,
        createdByUserId: user.id,
        createdByUserName: user.name,
        attachments: []
      };

      console.log('Creating session with data:', sessionData);
      const newSession = await createSession(sessionData);
      console.log('Session created successfully:', newSession);

      toast({
        title: "Success",
        description: `Session created successfully for ${formData.clientName}!`,
      });

      // Redirect to sessions page which will show the new session
      router.push('/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
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
        <h1 className="text-3xl font-bold">New Session</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfSession">Date & Time</Label>
                <Input
                  id="dateOfSession"
                  type="datetime-local"
                  value={formData.dateOfSession}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfSession: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type</Label>
                <Select 
                  value={formData.sessionType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sessionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="therapy">Therapy</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  min="15"
                  max="180"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Therapy Room A, Online, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Session Notes</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter session notes and observations..."
                rows={6}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Session'}
              </Button>
              <Link href="/sessions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
