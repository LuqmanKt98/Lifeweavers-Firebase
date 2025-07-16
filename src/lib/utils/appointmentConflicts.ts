import { addMinutes, isWithinInterval, parseISO } from 'date-fns';
import type { Appointment } from '@/lib/types';

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointments: Appointment[];
  conflictType: 'clinician' | 'client' | 'room' | 'none';
  message?: string;
}

export interface AppointmentSlot {
  startTime: Date;
  endTime: Date;
  clinicianId: string;
  clientId?: string;
  location?: string;
}

/**
 * Check for appointment conflicts
 */
export function checkAppointmentConflicts(
  newAppointment: AppointmentSlot,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): ConflictCheck {
  const conflicts: Appointment[] = [];
  let conflictType: 'clinician' | 'client' | 'room' | 'none' = 'none';

  // Filter out the appointment being updated (if any)
  const relevantAppointments = existingAppointments.filter(
    apt => apt.id !== excludeAppointmentId && apt.status !== 'cancelled'
  );

  for (const appointment of relevantAppointments) {
    const appointmentStart = parseISO(appointment.dateOfSession);
    const appointmentEnd = addMinutes(appointmentStart, appointment.duration);

    // Check if times overlap
    const hasTimeOverlap = isWithinInterval(newAppointment.startTime, {
      start: appointmentStart,
      end: appointmentEnd
    }) || isWithinInterval(newAppointment.endTime, {
      start: appointmentStart,
      end: appointmentEnd
    }) || isWithinInterval(appointmentStart, {
      start: newAppointment.startTime,
      end: newAppointment.endTime
    });

    if (hasTimeOverlap) {
      // Check clinician conflict
      if (appointment.attendingClinicianId === newAppointment.clinicianId) {
        conflicts.push(appointment);
        conflictType = 'clinician';
      }

      // Check client conflict
      if (newAppointment.clientId && appointment.clientId === newAppointment.clientId) {
        conflicts.push(appointment);
        conflictType = 'client';
      }

      // Check room conflict (if both have locations)
      if (
        newAppointment.location && 
        appointment.location && 
        appointment.location === newAppointment.location
      ) {
        conflicts.push(appointment);
        conflictType = 'room';
      }
    }
  }

  const hasConflict = conflicts.length > 0;
  let message: string | undefined;

  if (hasConflict) {
    switch (conflictType) {
      case 'clinician':
        message = `Clinician is already booked during this time slot.`;
        break;
      case 'client':
        message = `Client already has an appointment during this time.`;
        break;
      case 'room':
        message = `Room "${newAppointment.location}" is already booked during this time.`;
        break;
    }
  }

  return {
    hasConflict,
    conflictingAppointments: conflicts,
    conflictType,
    message
  };
}

/**
 * Get available time slots for a clinician on a specific date
 */
export function getAvailableTimeSlots(
  date: Date,
  clinicianId: string,
  existingAppointments: Appointment[],
  options: {
    startHour?: number;
    endHour?: number;
    slotDuration?: number; // in minutes
    breakBetweenSlots?: number; // in minutes
  } = {}
): Date[] {
  const {
    startHour = 9,
    endHour = 17,
    slotDuration = 60,
    breakBetweenSlots = 0
  } = options;

  const availableSlots: Date[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

  // Get clinician's appointments for the day
  const clinicianAppointments = existingAppointments.filter(apt => {
    const aptDate = parseISO(apt.dateOfSession);
    return apt.attendingClinicianId === clinicianId &&
           apt.status !== 'cancelled' &&
           aptDate.toDateString() === date.toDateString();
  });

  // Sort appointments by start time
  clinicianAppointments.sort((a, b) => 
    parseISO(a.dateOfSession).getTime() - parseISO(b.dateOfSession).getTime()
  );

  let currentTime = new Date(dayStart);

  for (const appointment of clinicianAppointments) {
    const appointmentStart = parseISO(appointment.dateOfSession);
    const appointmentEnd = addMinutes(appointmentStart, appointment.duration);

    // Add slots before this appointment
    while (addMinutes(currentTime, slotDuration) <= appointmentStart) {
      availableSlots.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, slotDuration + breakBetweenSlots);
    }

    // Move current time to after this appointment
    currentTime = addMinutes(appointmentEnd, breakBetweenSlots);
  }

  // Add remaining slots after the last appointment
  while (addMinutes(currentTime, slotDuration) <= dayEnd) {
    availableSlots.push(new Date(currentTime));
    currentTime = addMinutes(currentTime, slotDuration + breakBetweenSlots);
  }

  return availableSlots;
}

/**
 * Suggest alternative time slots when there's a conflict
 */
export function suggestAlternativeSlots(
  preferredStart: Date,
  duration: number,
  clinicianId: string,
  existingAppointments: Appointment[],
  options: {
    maxSuggestions?: number;
    searchDays?: number;
    preferredHours?: { start: number; end: number };
  } = {}
): Date[] {
  const {
    maxSuggestions = 5,
    searchDays = 7,
    preferredHours = { start: 9, end: 17 }
  } = options;

  const suggestions: Date[] = [];
  const searchDate = new Date(preferredStart);

  for (let day = 0; day < searchDays && suggestions.length < maxSuggestions; day++) {
    const currentDate = new Date(searchDate);
    currentDate.setDate(searchDate.getDate() + day);

    // Skip weekends (optional - can be configured)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    const availableSlots = getAvailableTimeSlots(
      currentDate,
      clinicianId,
      existingAppointments,
      {
        startHour: preferredHours.start,
        endHour: preferredHours.end,
        slotDuration: duration
      }
    );

    // If it's the same day as preferred, try to find slots close to preferred time
    if (day === 0) {
      const preferredTime = preferredStart.getHours() * 60 + preferredStart.getMinutes();
      
      availableSlots.sort((a, b) => {
        const aTime = a.getHours() * 60 + a.getMinutes();
        const bTime = b.getHours() * 60 + b.getMinutes();
        return Math.abs(aTime - preferredTime) - Math.abs(bTime - preferredTime);
      });
    }

    suggestions.push(...availableSlots.slice(0, maxSuggestions - suggestions.length));
  }

  return suggestions;
}

/**
 * Validate appointment timing
 */
export function validateAppointmentTiming(
  startTime: Date,
  duration: number,
  options: {
    minDuration?: number;
    maxDuration?: number;
    allowPastBooking?: boolean;
    businessHours?: { start: number; end: number };
  } = {}
): { isValid: boolean; errors: string[] } {
  const {
    minDuration = 15,
    maxDuration = 480, // 8 hours
    allowPastBooking = false,
    businessHours = { start: 8, end: 18 }
  } = options;

  const errors: string[] = [];
  const now = new Date();
  const endTime = addMinutes(startTime, duration);

  // Check if appointment is in the past
  if (!allowPastBooking && startTime < now) {
    errors.push('Cannot schedule appointments in the past');
  }

  // Check duration limits
  if (duration < minDuration) {
    errors.push(`Appointment duration must be at least ${minDuration} minutes`);
  }

  if (duration > maxDuration) {
    errors.push(`Appointment duration cannot exceed ${maxDuration} minutes`);
  }

  // Check business hours
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();

  if (startHour < businessHours.start || endHour > businessHours.end) {
    errors.push(`Appointments must be scheduled between ${businessHours.start}:00 and ${businessHours.end}:00`);
  }

  // Check if appointment spans multiple days
  if (startTime.toDateString() !== endTime.toDateString()) {
    errors.push('Appointments cannot span multiple days');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
