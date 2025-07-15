
// src/components/shared/EventCalendar.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SessionNote, Client, Appointment } from '@/lib/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isFuture, isPast } from 'date-fns';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getAllClients } from '@/lib/firebase/clients';
import Link from 'next/link';

interface EventCalendarProps {
  sessions: SessionNote[] | Appointment[];
}

export default function EventCalendar({ sessions }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session =>
      isSameDay(new Date(session.dateOfSession), date)
    );
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Section */}
      <div className="lg:w-1/2">
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
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayNumber = day.getDate();
                const hasSessions = getSessionsForDate(day).length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      calendar-day-button
                      ${isSelected ? 'selected' : ''}
                      ${isTodayDate ? 'today' : ''}
                    `}
                  >
                    {dayNumber}
                    {hasSessions && (
                      <div className="session-dot"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="lg:w-1/2">
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
                        className="p-3 border rounded-lg bg-background hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-primary">{clientName}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{sessionTime} - {endTime}</span>
                        </div>
                        {session.attendingClinicianName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="h-4 w-4" />
                            <span>{session.attendingClinicianName}</span>
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
}

