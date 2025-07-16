
// src/components/shared/EventCalendar.tsx
"use client";

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SessionNote, Client, Appointment } from '@/lib/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isFuture, isPast } from 'date-fns';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, User, MapPin, Phone, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getAllClients } from '@/lib/firebase/clients';
import { useAppointments } from '@/hooks/useAppointments';
import Link from 'next/link';

interface EventCalendarProps {
  sessions?: SessionNote[] | Appointment[];
  useRealTimeAppointments?: boolean;
  showAppointmentActions?: boolean;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const EventCalendar = memo(function EventCalendar({
  sessions = [],
  useRealTimeAppointments = true,
  showAppointmentActions = false,
  onAppointmentClick
}: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [clients, setClients] = useState<Client[]>([]);

  // Use real-time appointments hook if enabled
  const {
    appointments: realTimeAppointments,
    loading: appointmentsLoading,
    getAppointmentsForDate
  } = useAppointments({
    dateRange: {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    },
    realtime: useRealTimeAppointments
  });

  // Determine which data source to use
  const effectiveSessions = useRealTimeAppointments ? realTimeAppointments : sessions;

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSessionsForDate = useCallback((date: Date) => {
    if (useRealTimeAppointments) {
      return getAppointmentsForDate(date);
    }
    return effectiveSessions.filter(session =>
      isSameDay(new Date(session.dateOfSession), date)
    );
  }, [useRealTimeAppointments, getAppointmentsForDate, effectiveSessions]);

  // Get appointment status color - memoized
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'tentative': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  }, []);

  // Get appointment status icon - memoized
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'tentative': return <AlertCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  }, []);

  // Memoized calendar calculations
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return { monthStart, monthEnd, calendarDays };
  }, [currentDate]);

  const selectedDateSessions = useMemo(() =>
    selectedDate ? getSessionsForDate(selectedDate) : [],
    [selectedDate, getSessionsForDate]
  );

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const getClientName = useCallback((clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  }, [clients]);

  const weekDays = useMemo(() => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], []);

  return (
    <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
      {/* Calendar Section */}
      <div className="xl:w-1/2">
        <div className="bg-card rounded-lg border">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              View past and upcoming sessions. Click on a day to see details.
            </p>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {appointmentsLoading && useRealTimeAppointments ? (
                // Loading skeleton for calendar
                Array.from({ length: 35 }).map((_, index) => (
                  <div key={index} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))
              ) : (
                calendarData.calendarDays.map(day => {
                  const dayNumber = day.getDate();
                  const daySessions = getSessionsForDate(day);
                  const hasSessions = daySessions.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      aria-label={`${format(day, 'MMMM d, yyyy')}${hasSessions ? ` - ${daySessions.length} appointment${daySessions.length !== 1 ? 's' : ''}` : ''}`}
                      aria-pressed={isSelected}
                      className={`
                        relative h-8 sm:h-10 p-1 text-xs sm:text-sm rounded hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                        ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                        ${isTodayDate ? 'bg-accent font-semibold' : ''}
                        ${hasSessions ? 'font-medium' : ''}
                      `}
                    >
                      {dayNumber}
                      {hasSessions && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {daySessions.slice(0, 3).map((session, index) => {
                            const isAppointment = 'status' in session;
                            const status = isAppointment ? (session as Appointment).status : 'completed';
                            return (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status)}`}
                                title={isAppointment ? `${(session as Appointment).type} - ${status}` : 'Session'}
                              />
                            );
                          })}
                          {daySessions.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${daySessions.length - 3} more`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="xl:w-1/2">
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">
              {selectedDate ? `Sessions on ${format(selectedDate, 'MMMM do, yyyy')}` : 'Sessions on Selected Date'}
            </h3>
          </div>
          <div className="p-4">
            {selectedDate ? (
              selectedDateSessions.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateSessions.map(session => {
                    const isAppointment = 'type' in session;
                    const clientName = isAppointment
                      ? (session as Appointment).clientName
                      : getClientName(session.clientId);
                    const sessionTime = format(new Date(session.dateOfSession), 'h:mm a');
                    const endTime = format(
                      new Date(new Date(session.dateOfSession).getTime() +
                        (isAppointment ? (session as Appointment).duration : 60) * 60000),
                      'h:mm a'
                    );

                    return (
                      <div
                        key={session.id}
                        role={onAppointmentClick ? "button" : "article"}
                        tabIndex={onAppointmentClick ? 0 : undefined}
                        aria-label={`Appointment with ${clientName} at ${sessionTime}`}
                        className={`p-3 sm:p-4 border rounded-lg bg-background hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          onAppointmentClick ? 'hover:border-primary' : ''
                        }`}
                        onClick={() => {
                          if (onAppointmentClick && isAppointment) {
                            onAppointmentClick(session as Appointment);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && onAppointmentClick && isAppointment) {
                            e.preventDefault();
                            onAppointmentClick(session as Appointment);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-primary">{clientName}</h4>
                          {isAppointment && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusColor((session as Appointment).status)} text-white border-none`}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon((session as Appointment).status)}
                                {(session as Appointment).status}
                              </span>
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span>{sessionTime} - {endTime}</span>
                        </div>

                        {session.attendingClinicianName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <User className="h-4 w-4" />
                            <span>{session.attendingClinicianName}</span>
                          </div>
                        )}

                        {isAppointment && (session as Appointment).location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-4 w-4" />
                            <span>{(session as Appointment).location}</span>
                          </div>
                        )}

                        {isAppointment && (session as Appointment).type && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {(session as Appointment).type}
                            </Badge>
                            {(session as Appointment).duration && (
                              <span className="text-xs">
                                {(session as Appointment).duration} min
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No sessions scheduled for this day.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a date from the calendar to view sessions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventCalendar;

