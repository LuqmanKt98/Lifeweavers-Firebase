// src/app/(app)/admin/calendar/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  ShieldAlert,
  Clock,
  Users,
  MapPin,
  Video,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { syncGoogleCalendar } from '@/ai/flows/sync-google-calendar-flow';
import type { SessionNote } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import CalendarSyncSettings from '@/components/admin/CalendarSyncSettings';

export default function CalendarManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<SessionNote[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SessionNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!currentUser || currentUser.role !== 'Super Admin') {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            Only Super Administrators can access calendar management.
          </p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterType]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Load events from Google Calendar sync
      const result = await syncGoogleCalendar({
        userId: currentUser.id,
        dateRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
        },
        includeRecurring: true,
        eventTypes: ['appointment', 'consultation', 'follow-up', 'assessment', 'meeting']
      });
      
      setEvents(result.events);
      toast({
        title: "Events Loaded",
        description: `Loaded ${result.events.length} calendar events.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load calendar events.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.attendingClinicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event as any).location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => (event as any).eventType === filterType);
    }

    setFilteredEvents(filtered);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await loadEvents();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportEvents = () => {
    const exportData = {
      events: filteredEvents,
      exportDate: new Date().toISOString(),
      exportedBy: currentUser.name,
      totalEvents: filteredEvents.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Events Exported",
      description: `Exported ${filteredEvents.length} calendar events.`,
    });
  };

  const getEventTypeColor = (eventType?: string) => {
    switch (eventType) {
      case 'appointment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'consultation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'assessment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'meeting':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const eventTypes = ['all', 'appointment', 'consultation', 'follow-up', 'assessment', 'meeting'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Calendar Management
          </CardTitle>
          <CardDescription>
            Manage all calendar events, sync with Google Calendar, and configure sync settings.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, clinicians, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Calendar'}
              </Button>
              <Button onClick={handleExportEvents} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Events ({filteredEvents.length})</CardTitle>
          <CardDescription>
            {searchTerm || filterType !== 'all' 
              ? `Filtered results from ${events.length} total events`
              : `All calendar events`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading calendar events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' 
                  ? 'No events found matching your criteria.'
                  : 'No calendar events available.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const startTime = parseISO(event.dateOfSession);
                const duration = (event as any).duration || 60;
                
                return (
                  <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            Session #{event.sessionNumber}
                          </h3>
                          {(event as any).eventType && (
                            <Badge className={`text-xs ${getEventTypeColor((event as any).eventType)}`}>
                              {(event as any).eventType}
                            </Badge>
                          )}
                          {(event as any).status && (event as any).status !== 'confirmed' && (
                            <Badge className={`text-xs ${getStatusColor((event as any).status)}`}>
                              {(event as any).status}
                            </Badge>
                          )}
                          {(event as any).isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="mr-1 h-2.5 w-2.5" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" />
                            <span>{event.attendingClinicianName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {format(startTime, 'PPP p')} ({duration} min)
                            </span>
                          </div>
                          {(event as any).location && (
                            <div className="flex items-center gap-2">
                              {(event as any).location.includes('Zoom') || (event as any).location.includes('zoom') ? (
                                <Video className="h-3.5 w-3.5" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5" />
                              )}
                              <span>{(event as any).location}</span>
                            </div>
                          )}
                          {(event as any).googleEventId && (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Synced from Google Calendar</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="icon" title="View Event">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title="Edit Event">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title="Delete Event" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Sync Settings */}
      <CalendarSyncSettings onSyncTriggered={handleSync} />
    </div>
  );
}
