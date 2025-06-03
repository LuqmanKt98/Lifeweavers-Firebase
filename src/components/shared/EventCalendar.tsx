
// src/components/shared/EventCalendar.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SessionNote, Client } from '@/lib/types';
import { format, isSameDay, parseISO, addMinutes, isFuture, isPast, isToday } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, MapPin, RefreshCw, Users, Video, Eye, Edit } from 'lucide-react';
import { getAllClients } from '@/lib/firebase/clients';

interface EventCalendarProps {
  sessions: SessionNote[];
}

export default function EventCalendar({ sessions }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients data
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

  const sessionDates = useMemo(() => {
    return sessions.map(s => new Date(s.dateOfSession));
  }, [sessions]);

  const sessionsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return sessions
      .filter(session => isSameDay(new Date(session.dateOfSession), selectedDate))
      .sort((a, b) => new Date(a.dateOfSession).getTime() - new Date(b.dateOfSession).getTime());
  }, [selectedDate, sessions]);

  const modifiers = {
    hasSession: sessionDates,
  };

  const modifiersClassNames = {
    hasSession: 'day-with-session',
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(undefined);
    }
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        {/* Title and Description remain unchanged as per previous requests */}
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
            <CalendarIcon className="h-6 w-6" /> Appointments
        </CardTitle>
        <CardDescription>
            View past and upcoming sessions. Click on a day to see details.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[calc(50%-0.75rem)] xl:w-[calc(40%-0.75rem)]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border bg-card p-0 sm:p-1"
            numberOfMonths={1}
            pagedNavigation
            showOutsideDays
            fixedWeeks
          />
        </div>
        <div className="lg:w-[calc(50%-0.75rem)] xl:w-[calc(60%-0.75rem)]">
          <h3 className="text-lg font-semibold mb-3 text-foreground">
            Sessions on {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}
          </h3>
          <ScrollArea className="h-72 border rounded-md p-3 bg-secondary/30">
            {sessionsOnSelectedDate.length > 0 ? (
              <div className="space-y-3">
                {sessionsOnSelectedDate.map(session => {
                  const startTime = parseISO(session.dateOfSession);
                  const duration = (session as any).duration || 60;
                  const endTime = addMinutes(startTime, duration);
                  const isGoogleEvent = session.id.startsWith('gcal-') || !!(session as any).googleEventId;
                  const appointmentType = (session as any).type || 'appointment';
                  const status = (session as any).status || 'confirmed';
                  const location = (session as any).location || 'Not specified';
                  const isUpcoming = isFuture(startTime);
                  const isSessionToday = isToday(startTime);

                  const getTypeColor = (type: string) => {
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

                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        isSessionToday
                          ? 'border-primary bg-primary/5'
                          : isUpcoming
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-base">{session.clientName}</h4>
                            <Badge className={getTypeColor(appointmentType)}>
                              {appointmentType}
                            </Badge>
                            <Badge className={getStatusColor(status)}>
                              {status}
                            </Badge>
                            {isGoogleEvent && (
                              <Badge variant="outline" className="text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Synced
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(startTime, 'p')} - {format(endTime, 'p')} ({duration} min)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{session.attendingClinicianName || 'Unassigned'}</span>
                          </div>
                        </div>

                        {session.content && (
                          <div className="text-sm text-muted-foreground">
                            <div dangerouslySetInnerHTML={{ __html: session.content.substring(0, 100) + '...' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">
                {selectedDate ? 'No sessions scheduled for this day.' : 'Select a day from the calendar to view sessions.'}
              </p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

