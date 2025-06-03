
// src/app/(app)/admin/cases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldAlert, FolderSync, Loader2, CheckCircle, XCircle, Info, Edit2, Users, ArrowRight, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import type { Client, SessionNote, User } from '@/lib/types';
import { getAllClients } from '@/lib/firebase/clients';
import { getAllSessions } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import { Input } from '@/components/ui/input';


// Mock representation of Google Drive structure
interface MockDriveFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // For Google Docs
  children?: MockDriveFile[]; // For folders
  lastModifiedTime?: string; // ISO date string
}

const MOCK_GOOGLE_DRIVE_ROOT: MockDriveFile[] = [
  {
    id: 'folder_2023',
    name: '2023', // Year
    type: 'folder',
    children: [
      {
        id: 'folder_client_mary_jane_2023',
        name: 'Mary Jane', // Client Name
        type: 'folder',
        children: [
          {
            id: 'doc_mary_jane_notes_2023',
            name: 'Internal Doc for Mary Jane - Therapy Notes.gdoc',
            type: 'file',
            content: `Session: 1 | Clinician: Casey Clinician | Date: 2023-01-15 10:00\nInitial consultation for Mary. Discussed history and goals.\n---\nSession: 2 | Clinician: Casey Clinician | Date: 2023-01-22 10:00 | Location: Clinic A\nReviewed initial exercises. Patient reports mild improvement in pain levels.`,
            lastModifiedTime: new Date(2023, 0, 23).toISOString(),
          },
        ],
      },
      {
        id: 'folder_client_peter_parker_2023',
        name: 'Peter Parker',
        type: 'folder',
        children: [
          {
            id: 'doc_peter_parker_notes_2023',
            name: 'Internal Doc - Peter Parker Sessions.gdoc',
            type: 'file',
            content: `Session: 1 | Clinician: Jamie Therapist | Date: 2023-03-01 14:30 | Duration: 45min\nAssessment of Peter's shoulder pain. ROM exercises prescribed.\n---\nSession: 2 | Clinician: Jamie Therapist | Date: 2023-03-08 14:30\nFollow-up. Patient compliant with exercises. Pain reduced significantly.`,
            lastModifiedTime: new Date(2023, 2, 9).toISOString(),
          }
        ],
      },
    ],
  },
  {
    id: 'folder_2024',
    name: '2024', // Year
    type: 'folder',
    children: [
       {
        id: 'folder_client_gwen_stacy_2024',
        name: 'Gwen Stacy',
        type: 'folder',
        children: [
          {
            id: 'doc_gwen_stacy_notes_2024',
            name: 'Internal Doc - Gwen Stacy Therapy.gdoc',
            type: 'file',
            content: `Session: 1 | Clinician: Taylor New | Date: 2024-02-10 09:00\nIntake session for Gwen. Focus on anxiety management techniques. Provided initial resources.`,
            lastModifiedTime: new Date(2024, 1, 10).toISOString(),
          }
        ],
      },
      { // Add an existing client from MOCK_CLIENTS_DB to test updates
        id: 'folder_client_john_doe_2024',
        name: 'John Doe', // Existing client
        type: 'folder',
        children: [
          {
            id: 'doc_john_doe_notes_2024',
            name: 'Internal Doc for John Doe - Therapy Notes.gdoc',
            type: 'file',
            // Add a new session for John Doe
            content: `Session: 5 | Clinician: Casey Clinician | Date: 2024-01-05 11:00\nNew session for John in 2024. Patient reports feeling much better. Discussed maintenance plan.`,
            lastModifiedTime: new Date(2024, 0, 6).toISOString(),
          },
        ],
      },
    ]
  }
];


export default function CasesManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<{ success: boolean; timestamp: string | null; details?: string }>({ success: false, timestamp: null });
  const [syncedItemsLog, setSyncedItemsLog] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

  // Load real Firebase data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, sessionsData, usersData] = await Promise.all([
          getAllClients(),
          getAllSessions(),
          getAllUsers()
        ]);

        setClients(clientsData);
        setSessions(sessionsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load cases data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, toast]);

  if (!user || (user.role !== 'Super Admin' && user.role !== 'Admin')) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            You do not have permission to access this page. Only Admins and Super Admins can manage cases and data synchronization.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <FolderSync className="h-7 w-7" />
              Cases Management
            </CardTitle>
            <CardDescription>
              Loading cases data...
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading client data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const parseSessionString = (sessionStr: string, defaultClinicianName: string, defaultDate: string): Partial<SessionNote> => {
    const sessionData: Partial<SessionNote> = {};
    const parts = sessionStr.split('|').map(p => p.trim());
    let noteContent = sessionStr;

    parts.forEach(part => {
        if (part.toLowerCase().startsWith('session:')) {
            sessionData.sessionNumber = parseInt(part.substring(8).trim(), 10);
            noteContent = noteContent.replace(part, '').trim().replace(/^\|/, '').trim();
        } else if (part.toLowerCase().startsWith('clinician:')) {
            sessionData.attendingClinicianName = part.substring(10).trim();
            noteContent = noteContent.replace(part, '').trim().replace(/^\|/, '').trim();
        } else if (part.toLowerCase().startsWith('date:')) {
            const dateStr = part.substring(5).trim();
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
               sessionData.dateOfSession = parsedDate.toISOString();
            }
            noteContent = noteContent.replace(part, '').trim().replace(/^\|/, '').trim();
        }
    });

    const contentBreak = noteContent.indexOf('\n');
    if (contentBreak !== -1 && contentBreak < 100) {
        const firstLine = noteContent.substring(0, contentBreak).toLowerCase();
        if (!firstLine.includes('session:') && !firstLine.includes('clinician:') && !firstLine.includes('date:')) {
            sessionData.content = `<p>${noteContent.substring(contentBreak + 1).trim().replace(/\n/g, '</p><p>')}</p>`;
        } else {
             sessionData.content = `<p>${noteContent.substring(contentBreak + 1).trim().replace(/\n/g, '</p><p>')}</p>`;
        }
    } else {
        sessionData.content = `<p>${noteContent.trim().replace(/\n/g, '</p><p>')}</p>`;
    }

    if (!sessionData.attendingClinicianName) sessionData.attendingClinicianName = defaultClinicianName;
    if (!sessionData.dateOfSession) sessionData.dateOfSession = new Date(defaultDate).toISOString();

    const clinicianUser = users.find(u => u.name === sessionData.attendingClinicianName);
    sessionData.attendingClinicianId = clinicianUser?.id || users[0]?.id || 'unknown_clinician';
    sessionData.attendingClinicianVocation = clinicianUser?.vocation;

    return sessionData;
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncedItemsLog([]);
    toast({
      title: "Synchronization Started",
      description: "Attempting to sync client data from Google Drive... (Mock Operation)",
    });

    let newClientsCount = 0;
    let updatedClientsCount = 0;
    let newSessionsCount = 0;
    const currentSyncedItems: string[] = [];

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      for (const yearFolder of MOCK_GOOGLE_DRIVE_ROOT) {
        currentSyncedItems.push(`Processing year: ${yearFolder.name}`);
        setSyncedItemsLog([...currentSyncedItems]);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!yearFolder.children) continue;

        for (const clientFolder of yearFolder.children) {
          currentSyncedItems.push(`  Found client folder: ${clientFolder.name}`);
          setSyncedItemsLog([...currentSyncedItems]);
          await new Promise(resolve => setTimeout(resolve, 300));

          const clientName = clientFolder.name;
          const clientKey = `client-${clientName.toLowerCase().replace(/\s+/g, '-')}`;
          let clientObject = clients.find(c => c.id === clientKey);

          if (!clientObject) {
            // In a real implementation, you would create the client in Firebase here
            // For now, we'll just simulate the process
            newClientsCount++;
            currentSyncedItems.push(`    Would add new client: ${clientName}`);
          } else {
            updatedClientsCount++;
            currentSyncedItems.push(`    Would update existing client: ${clientName}`);
          }
          setSyncedItemsLog([...currentSyncedItems]);

          const notesFile = clientFolder.children?.find(file => file.name.toLowerCase().includes('internal doc') && file.name.toLowerCase().endsWith('.gdoc'));
          if (notesFile && notesFile.content) {
            currentSyncedItems.push(`    Processing notes file: ${notesFile.name}`);
            setSyncedItemsLog([...currentSyncedItems]);
            await new Promise(resolve => setTimeout(resolve, 500));

            const clientSessions = sessions.filter(s => s.clientId === clientKey);

            const sessionStrings = notesFile.content.split('---').map(s => s.trim()).filter(s => s);
            sessionStrings.forEach((sessionStr, index) => {
              const parsedSession = parseSessionString(sessionStr, users[0]?.name || 'Unknown Clinician', notesFile.lastModifiedTime || new Date().toISOString());

              const existingSession = clientSessions.find(
                s => s.content === parsedSession.content &&
                     new Date(s.dateOfSession).toDateString() === new Date(parsedSession.dateOfSession || Date.now()).toDateString() &&
                     s.sessionNumber === parsedSession.sessionNumber
              );

              if (!existingSession && parsedSession.content && parsedSession.sessionNumber && parsedSession.dateOfSession) {
                // In a real implementation, you would create the session in Firebase here
                // For now, we'll just simulate the process
                newSessionsCount++;
                currentSyncedItems.push(`      Would add session #${parsedSession.sessionNumber} for ${clientName}`);
                setSyncedItemsLog([...currentSyncedItems]);
              }
            });
          }
        }
      }

      const summary = `Sync complete. New Clients: ${newClientsCount}. Updated Clients: ${updatedClientsCount}. New Sessions: ${newSessionsCount}.`;
      currentSyncedItems.push(summary);
      setLastSyncStatus({ success: true, timestamp: new Date().toISOString(), details: summary });
      toast({
        title: "Synchronization Successful (Mock)",
        description: summary,
        className: "bg-green-500/10 border-green-500 text-green-700 dark:bg-green-500/20 dark:text-green-400",
      });

    } catch (error) {
      const errorMsg = `Mock Sync Error: ${(error as Error).message}.`;
      currentSyncedItems.push(errorMsg);
      setLastSyncStatus({ success: false, timestamp: new Date().toISOString(), details: errorMsg });
      toast({
        title: "Synchronization Failed (Mock)",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setSyncedItemsLog([...currentSyncedItems, "--- Sync Finished ---"]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FolderSync className="h-7 w-7" />
            Cases Management
          </CardTitle>
          <CardDescription>
            Manage client cases, synchronize data, and view all client records.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> All Client Cases
            </CardTitle>
            <CardDescription>
                View and manage all client records in the system.
            </CardDescription>
          </div>
           <Button variant="default" disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Client (Manual)
          </Button>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search clients by name..."
                    className="pl-9 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            </div>
          {filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Team Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(client.dateAdded), 'PPP')} ({formatDistanceToNow(new Date(client.dateAdded), { addSuffix: true })})</TableCell>
                    <TableCell>{client.teamMemberIds?.length || 0} member(s)</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
                {searchTerm ? "No clients match your search." : "No clients in the system yet. Try syncing from Drive."}
            </p>
          )}
        </CardContent>
         <CardFooter className="border-t pt-4">
             <p className="text-sm text-muted-foreground">Total clients: {clients.length}</p>
         </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Google Drive Synchronization (Mock)</CardTitle>
          <CardDescription>
            This simulates updating client information and session notes from a mock Google Drive structure.
            Client data is stored at <a href="https://drive.google.com/drive/folders/1IxuDBR22XIlHw96kuaePqfyZPPJIQR8l?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">this mock Drive link</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center p-3 rounded-md bg-accent/20 border border-accent/50">
            <Info className="h-5 w-5 text-accent-foreground mr-3 flex-shrink-0" />
            <p className="text-sm text-accent-foreground">
              <strong>Mock Feature:</strong> This is a demonstration of Google Drive synchronization. No actual data is transferred from a live Google Drive. All operations are simulated using predefined mock data structures.
            </p>
          </div>
          <Button onClick={handleSyncData} disabled={isSyncing} className="w-full sm:w-auto">
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderSync className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? 'Syncing Data...' : 'Sync Client Data from Mock Drive'}
          </Button>
           {syncedItemsLog.length > 0 && (
            <div className="mt-4 p-3 border rounded-md bg-secondary/30 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-semibold mb-2">Sync Log:</h4>
              <pre className="text-xs whitespace-pre-wrap">
                {syncedItemsLog.join('\n')}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          {lastSyncStatus.timestamp ? (
            <div className={`flex flex-col items-start gap-1 text-sm ${lastSyncStatus.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              <div className="flex items-center gap-2">
                {lastSyncStatus.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>
                  Last sync attempt: {format(new Date(lastSyncStatus.timestamp), 'PPPp')} - Status: {lastSyncStatus.success ? 'Successful' : 'Failed'}
                </span>
              </div>
              {lastSyncStatus.details && <p className="text-xs pl-6">{lastSyncStatus.details}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No synchronization attempts yet in this session.</p>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Manual Case Adjustments (Placeholder)
            </CardTitle>
            <CardDescription>
                Future functionality for manual case creation, archival, or data export will be available here.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                This section is a placeholder for more advanced case management tools, such as manually adding clients not found in Drive, archiving old cases, or exporting data for compliance. The "Add New Client" button above would activate this section.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

