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
  RefreshCw, 
  Clock,
  Users,
  MapPin,
  Video,
  Eye,
  Edit,
  Trash2,
  Filter,
  CalendarDays
} from 'lucide-react';
import { syncGoogleCalendar } from '@/ai/flows/sync-google-calendar-flow';
import type { SessionNote } from '@/lib/types';
import { format, parseISO, addMinutes, isFuture, isPast, isToday } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EventCalendar from '@/components/shared/EventCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AppointmentsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState<SessionNote[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<SessionNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
    }
  }, [currentUser]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, filterType]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const result = await syncGoogleCalendar({
        userId: currentUser.id,
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
        },
        includeRecurring: true,
        eventTypes: ['appointment', 'consultation', 'follow-up', 'assessment']
      });
      
      setAppointments(result.events);
      toast({
        title: "Appointments Loaded",
        description: `Loaded ${result.events.length} appointments.`,
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load appointments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await loadAppointments();
      toast({
        title: "Sync Complete",
        description: "Calendar has been synced successfully.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment as any).location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      const now = new Date();
      switch (filterType) {
        case 'upcoming':
          filtered = filtered.filter(appointment => isFuture(parseISO(appointment.dateOfSession)));
          break;
        case 'today':
          filtered = filtered.filter(appointment => isToday(parseISO(appointment.dateOfSession)));
          break;
        case 'past':
          filtered = filtered.filter(appointment => isPast(parseISO(appointment.dateOfSession)));
          break;
        case 'appointment':
        case 'consultation':
        case 'follow-up':
        case 'assessment':
          filtered = filtered.filter(appointment => (appointment as any).type === filterType);
          break;
      }
    }

    // Sort by date (upcoming first, then past in reverse order)
    filtered.sort((a, b) => {
      const dateA = parseISO(a.dateOfSession);
      const dateB = parseISO(b.dateOfSession);
      const now = new Date();
      
      const aIsFuture = isFuture(dateA);
      const bIsFuture = isFuture(dateB);
      
      if (aIsFuture && bIsFuture) {
        return dateA.getTime() - dateB.getTime(); // Upcoming: earliest first
      } else if (!aIsFuture && !bIsFuture) {
        return dateB.getTime() - dateA.getTime(); // Past: latest first
      } else {
        return aIsFuture ? -1 : 1; // Future appointments first
      }
    });

    setFilteredAppointments(filtered);
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'consultation': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'follow-up': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'assessment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tentative': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const upcomingAppointments = filteredAppointments.filter(apt => isFuture(parseISO(apt.dateOfSession)));
  const todayAppointments = filteredAppointments.filter(apt => isToday(parseISO(apt.dateOfSession)));
  const pastAppointments = filteredAppointments.filter(apt => isPast(parseISO(apt.dateOfSession)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarDays className="h-7 w-7" />
                Appointments
              </CardTitle>
              <CardDescription>
                Manage your appointments and view your schedule
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isSyncing ? 'Syncing...' : 'Sync Calendar'}
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Appointments</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="consultation">Consultations</SelectItem>
                <SelectItem value="follow-up">Follow-ups</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">{todayAppointments.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                    <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{filteredAppointments.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments ({filteredAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading appointments...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== 'all'
                      ? 'No appointments found matching your criteria.'
                      : 'No appointments scheduled.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => {
                    const startTime = parseISO(appointment.dateOfSession);
                    const duration = (appointment as any).duration || 60;
                    const endTime = addMinutes(startTime, duration);
                    const appointmentType = (appointment as any).type || 'appointment';
                    const status = (appointment as any).status || 'confirmed';
                    const location = (appointment as any).location || 'Not specified';
                    const isUpcoming = isFuture(startTime);
                    const isAppointmentToday = isToday(startTime);

                    return (
                      <div
                        key={appointment.id}
                        className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          isAppointmentToday
                            ? 'border-primary bg-primary/5'
                            : isUpcoming
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{appointment.clientName}</h3>
                              <Badge className={getAppointmentTypeColor(appointmentType)}>
                                {appointmentType}
                              </Badge>
                              <Badge className={getStatusColor(status)}>
                                {status}
                              </Badge>
                              {isAppointmentToday && (
                                <Badge variant="default">Today</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(startTime, 'PPP')} at {format(startTime, 'p')} - {format(endTime, 'p')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{appointment.attendingClinicianName || 'Unassigned'}</span>
                              </div>
                            </div>

                            {appointment.content && (
                              <div className="text-sm text-muted-foreground">
                                <div dangerouslySetInnerHTML={{ __html: appointment.content.substring(0, 150) + '...' }} />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {(currentUser.role === 'Admin' || currentUser.role === 'Super Admin') && (
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="pt-6">
              <EventCalendar sessions={appointments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
