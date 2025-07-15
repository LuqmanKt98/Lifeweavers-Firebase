"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  Plus,
  Eye,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Edit,
  Trash2
} from 'lucide-react';
import { getAllClients } from '@/lib/firebase/clients';
import { getSessionsByClient } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import EditClientDialog from '@/components/clients/EditClientDialog';
import type { Client, User } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ClientWithStats extends Client {
  sessionCount: number;
  lastSessionDate?: string;
  teamMemberNames: string[];
}

export default function CasesManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const [clientsData, usersData] = await Promise.all([
        getAllClients(),
        getAllUsers()
      ]);

      setUsers(usersData);

      // Get session counts and stats for each client
      const clientsWithStats = await Promise.all(
        clientsData.map(async (client) => {
          try {
            const sessions = await getSessionsByClient(client.id);
            const teamMemberNames = client.teamMemberIds?.map(id => {
              const user = usersData.find(u => u.id === id);
              return user?.name || 'Unknown';
            }) || [];

            const lastSession = sessions.length > 0 
              ? sessions.sort((a, b) => new Date(b.dateOfSession).getTime() - new Date(a.dateOfSession).getTime())[0]
              : null;

            return {
              ...client,
              sessionCount: sessions.length,
              lastSessionDate: lastSession?.dateOfSession,
              teamMemberNames
            };
          } catch (error) {
            console.error(`Error loading sessions for client ${client.id}:`, error);
            return {
              ...client,
              sessionCount: 0,
              teamMemberNames: []
            };
          }
        })
      );

      setClients(clientsWithStats);
      
      toast({
        title: "Cases Loaded",
        description: `Loaded ${clientsWithStats.length} client cases.`,
      });
    } catch (error) {
      console.error('Error loading cases:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load client cases.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleClientUpdated = (updatedClient: Client) => {
    setClients(prev => prev.map(client =>
      client.id === updatedClient.id
        ? { ...client, ...updatedClient }
        : client
    ));
  };

  const handleClientDeleted = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  const canEditClients = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  if (!currentUser) {
    return <div>Please log in to view cases.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="h-7 w-7" />
                Cases Management
              </CardTitle>
              <CardDescription>
                Manage client cases, synchronize data, and view all client records.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} disabled={isLoading} variant="outline">
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
              <Link href="/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Client (Manual)
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* All Client Cases */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Client Cases
              </CardTitle>
              <CardDescription>
                View and manage all client records in the system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Client List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading client cases...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No clients found matching your search.' : 'No client cases found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                <div className="col-span-3">Client Name</div>
                <div className="col-span-2">Date Added</div>
                <div className="col-span-3">Team Members</div>
                <div className="col-span-2">Sessions</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Client Rows */}
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                >
                  {/* Client Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {client.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {/* Date Added */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="text-sm">
                        {format(new Date(client.dateAdded), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({formatDistanceToNow(new Date(client.dateAdded), { addSuffix: true })})
                      </p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="col-span-3 flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {client.teamMemberNames.length > 0 ? (
                        client.teamMemberNames.slice(0, 2).map((name, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No team assigned</span>
                      )}
                      {client.teamMemberNames.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.teamMemberNames.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{client.sessionCount}</span>
                        <span className="text-sm text-muted-foreground">sessions</span>
                      </div>
                      {client.lastSessionDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {format(new Date(client.lastSessionDate), 'MMM dd')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    {canEditClients && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditClientDialog
        client={editingClient}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onClientUpdated={handleClientUpdated}
        onClientDeleted={handleClientDeleted}
      />
    </div>
  );
}
