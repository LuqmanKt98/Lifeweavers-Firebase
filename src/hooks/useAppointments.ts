"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface UseAppointmentsOptions {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  clinicianId?: string;
  clientId?: string;
  status?: string[];
  realtime?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getAppointmentsForDate: (date: Date) => Appointment[];
  getUpcomingAppointments: (limit?: number) => Appointment[];
  getTodayAppointments: () => Appointment[];
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const {
    dateRange,
    clinicianId,
    clientId,
    status,
    realtime = true
  } = options;

  // Build Firestore query based on options
  const buildQuery = useCallback(() => {
    try {
      let q = query(
        collection(db, 'appointments'),
        orderBy('dateOfSession', 'asc')
      );

      // Add filters based on options - Use Firestore Timestamps for date queries
      if (dateRange?.start) {
        q = query(q, where('dateOfSession', '>=', Timestamp.fromDate(dateRange.start)));
      }

      if (dateRange?.end) {
        q = query(q, where('dateOfSession', '<=', Timestamp.fromDate(dateRange.end)));
      }

      if (clinicianId) {
        q = query(q, where('attendingClinicianId', '==', clinicianId));
      }

      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      return q;
    } catch (error) {
      console.error('Error building appointments query:', error);
      // Return basic query without filters if there's an error
      return query(
        collection(db, 'appointments'),
        orderBy('dateOfSession', 'asc')
      );
    }
  }, [dateRange, clinicianId, clientId, status]);

  // Real-time listener
  useEffect(() => {
    if (!realtime) return;

    try {
      setLoading(true);
      setError(null);

      const q = buildQuery();

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const appointmentsData: Appointment[] = [];

            snapshot.forEach((doc) => {
              try {
                const data = doc.data();

                // Safely handle date conversions
                const processedData = {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                  updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                  dateOfSession: data.dateOfSession?.toDate?.()?.toISOString() || data.dateOfSession || new Date().toISOString(),
                } as Appointment;

                appointmentsData.push(processedData);
              } catch (docError) {
                console.warn('Error processing appointment document:', doc.id, docError);
                // Skip this document but continue with others
              }
            });

            setAppointments(appointmentsData);
            setLoading(false);
          } catch (err) {
            console.error('Error processing appointments snapshot:', err);
            setError('Failed to process appointments data');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error listening to appointments:', err);
          setError(`Failed to load appointments: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up appointments listener:', error);
      setError(`Failed to initialize appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [buildQuery, realtime]);

  // Manual refetch function
  const refetch = useCallback(() => {
    if (realtime) return; // Real-time updates handle this automatically
    
    // For non-realtime usage, you could implement manual fetching here
    setLoading(true);
    // Implementation would go here for manual fetch
  }, [realtime]);

  // Memoized helper functions for better performance
  const getAppointmentsForDate = useCallback((date: Date): Appointment[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.dateOfSession);
      return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
    });
  }, [appointments]);

  // Memoized upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(appointment => new Date(appointment.dateOfSession) > now)
      .sort((a, b) => new Date(a.dateOfSession).getTime() - new Date(b.dateOfSession).getTime());
  }, [appointments]);

  const getUpcomingAppointments = useCallback((limit: number = 5): Appointment[] => {
    return upcomingAppointments.slice(0, limit);
  }, [upcomingAppointments]);

  // Memoized today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    return getAppointmentsForDate(today);
  }, [getAppointmentsForDate]);

  const getTodayAppointments = useCallback((): Appointment[] => {
    return todayAppointments;
  }, [todayAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch,
    getAppointmentsForDate,
    getUpcomingAppointments,
    getTodayAppointments,
  };
}

// Specialized hook for clinician's appointments
export function useClinicianAppointments(clinicianId?: string) {
  const { currentUser } = useAuth();
  const effectiveClinicianId = clinicianId || currentUser?.id;

  return useAppointments({
    clinicianId: effectiveClinicianId,
    realtime: true,
  });
}

// Specialized hook for client's appointments
export function useClientAppointments(clientId: string) {
  return useAppointments({
    clientId,
    realtime: true,
  });
}

// Specialized hook for today's appointments
export function useTodayAppointments() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return useAppointments({
    dateRange: {
      start: startOfDay,
      end: endOfDay,
    },
    realtime: true,
  });
}
