
// src/ai/flows/sync-google-calendar-flow.ts
'use server';
/**
 * @fileOverview Simulates fetching calendar events from Google Calendar with enhanced logic.
 *
 * - syncGoogleCalendar - A function that simulates fetching events with realistic calendar data.
 * - SyncGoogleCalendarInput - The input type for the syncGoogleCalendar function.
 * - SyncGoogleCalendarOutput - The return type for the syncGoogleCalendar function, returning events in SessionNote-like format.
 * - Enhanced with multiple event types, recurring events, and realistic scheduling patterns.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SessionNote } from '@/lib/types';
import { getAllUsers } from '@/lib/firebase/users';
import { getAllClients } from '@/lib/firebase/clients';
import { addHours, addDays, addWeeks, formatISO, startOfDay, setHours } from 'date-fns';

const SyncGoogleCalendarInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to sync the calendar.'),
  dateRange: z.object({
    startDate: z.string().optional().describe('Start date for calendar sync (ISO string). Defaults to today.'),
    endDate: z.string().optional().describe('End date for calendar sync (ISO string). Defaults to 30 days from now.'),
  }).optional(),
  includeRecurring: z.boolean().optional().describe('Whether to include recurring events. Defaults to true.'),
  eventTypes: z.array(z.enum(['appointment', 'meeting', 'consultation', 'follow-up', 'assessment'])).optional().describe('Types of events to sync.'),
});
export type SyncGoogleCalendarInput = z.infer<typeof SyncGoogleCalendarInputSchema>;

// Enhanced calendar event schema with additional metadata
const CalendarEventSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  sessionNumber: z.number(),
  dateOfSession: z.string().describe('ISO date string for the event start time.'),
  attendingClinicianId: z.string(),
  attendingClinicianName: z.string(),
  attendingClinicianVocation: z.string().optional(),
  content: z.string().describe('Event description or notes.'),
  attachments: z.array(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Enhanced fields for calendar integration
  eventType: z.enum(['appointment', 'meeting', 'consultation', 'follow-up', 'assessment']).optional(),
  duration: z.number().optional().describe('Duration in minutes'),
  location: z.string().optional().describe('Meeting location or video link'),
  isRecurring: z.boolean().optional().describe('Whether this is a recurring event'),
  recurringPattern: z.string().optional().describe('Recurrence pattern description'),
  googleEventId: z.string().optional().describe('Original Google Calendar event ID'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
});

const SyncGoogleCalendarOutputSchema = z.object({
  events: z.array(CalendarEventSchema).describe('A list of calendar events, formatted like SessionNotes with enhanced metadata.'),
  syncMetadata: z.object({
    syncedAt: z.string().describe('Timestamp when sync was performed'),
    totalEvents: z.number().describe('Total number of events synced'),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
    userId: z.string(),
  }),
});
export type SyncGoogleCalendarOutput = z.infer<typeof SyncGoogleCalendarOutputSchema>;

// Helper function to generate realistic calendar events
async function generateMockCalendarEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  includeRecurring: boolean = true,
  eventTypes?: string[]
): Promise<SessionNote[]> {
  const events: SessionNote[] = [];

  // Get real data from Firebase
  const [users, clients] = await Promise.all([
    getAllUsers(),
    getAllClients()
  ]);

  const clinicians = users.filter(u => u.role === 'Clinician');
  const now = new Date();

  // Find the requesting user
  const requestingUser = users.find(u => u.id === userId);
  const isClinicianRequest = requestingUser?.role === 'Clinician';

  // Event types and their patterns
  const eventPatterns = [
    { type: 'appointment', duration: 60, frequency: 'weekly' },
    { type: 'consultation', duration: 90, frequency: 'biweekly' },
    { type: 'follow-up', duration: 30, frequency: 'monthly' },
    { type: 'assessment', duration: 120, frequency: 'quarterly' },
    { type: 'meeting', duration: 45, frequency: 'weekly' },
  ];

  // Generate events for the next 30 days
  let currentDate = new Date(startDate);
  let sessionCounter = 1000; // Start with high numbers to avoid conflicts

  while (currentDate <= endDate) {
    // Generate 1-3 events per day (randomly)
    const eventsPerDay = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < eventsPerDay; i++) {
      const pattern = eventPatterns[Math.floor(Math.random() * eventPatterns.length)];

      // Skip if event type filtering is enabled and this type isn't included
      if (eventTypes && !eventTypes.includes(pattern.type)) continue;

      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const randomClinician = isClinicianRequest
        ? requestingUser
        : clinicians[Math.floor(Math.random() * clinicians.length)];

      if (!randomClinician) continue;

      // Generate realistic appointment times (9 AM to 5 PM)
      const hour = 9 + Math.floor(Math.random() * 8);
      const minute = Math.random() < 0.5 ? 0 : 30;
      const eventDate = setHours(startOfDay(currentDate), hour);
      eventDate.setMinutes(minute);

      // Skip past events unless they're very recent
      if (eventDate < addHours(now, -2)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      const eventId = `gcal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const googleEventId = `google_${eventId}`;

      // Generate content based on event type
      const contentMap = {
        appointment: `<p><strong>Scheduled Appointment</strong><br/>Regular session with ${randomClient.name}. Review progress and adjust treatment plan as needed.</p>`,
        consultation: `<p><strong>Initial Consultation</strong><br/>Comprehensive assessment with ${randomClient.name}. Discuss goals, expectations, and develop treatment strategy.</p>`,
        'follow-up': `<p><strong>Follow-up Session</strong><br/>Check progress with ${randomClient.name}. Review homework assignments and address any concerns.</p>`,
        assessment: `<p><strong>Comprehensive Assessment</strong><br/>Detailed evaluation session with ${randomClient.name}. Conduct standardized assessments and update care plan.</p>`,
        meeting: `<p><strong>Team Meeting</strong><br/>Interdisciplinary team discussion regarding ${randomClient.name}'s care coordination and treatment planning.</p>`,
      };

      const locationMap = {
        appointment: 'Therapy Room A',
        consultation: 'Assessment Suite',
        'follow-up': 'Therapy Room B',
        assessment: 'Assessment Suite',
        meeting: 'Conference Room / Zoom',
      };

      const isRecurring = includeRecurring && Math.random() < 0.3; // 30% chance of recurring
      const status = Math.random() < 0.9 ? 'confirmed' : (Math.random() < 0.5 ? 'tentative' : 'cancelled');

      const event: SessionNote = {
        id: eventId,
        clientId: randomClient.id,
        sessionNumber: sessionCounter++,
        dateOfSession: formatISO(eventDate),
        attendingClinicianId: randomClinician.id,
        attendingClinicianName: randomClinician.name,
        attendingClinicianVocation: randomClinician.vocation,
        content: contentMap[pattern.type as keyof typeof contentMap],
        attachments: [],
        createdAt: formatISO(now),
        updatedAt: formatISO(now),
        // Enhanced fields
        eventType: pattern.type as any,
        duration: pattern.duration,
        location: locationMap[pattern.type as keyof typeof locationMap],
        isRecurring,
        recurringPattern: isRecurring ? `Every ${pattern.frequency}` : undefined,
        googleEventId,
        status: status as any,
      };

      events.push(event);
    }

    currentDate = addDays(currentDate, 1);
  }

  return events;
}

export async function syncGoogleCalendar(input: SyncGoogleCalendarInput): Promise<SyncGoogleCalendarOutput> {
  return syncGoogleCalendarFlow(input);
}

const syncGoogleCalendarFlow = ai.defineFlow(
  {
    name: 'syncGoogleCalendarFlow',
    inputSchema: SyncGoogleCalendarInputSchema,
    outputSchema: SyncGoogleCalendarOutputSchema,
  },
  async (input) => {
    const now = new Date();

    // Parse date range or use defaults
    const startDate = input.dateRange?.startDate ? new Date(input.dateRange.startDate) : now;
    const endDate = input.dateRange?.endDate ? new Date(input.dateRange.endDate) : addDays(now, 30);

    // Generate realistic calendar events
    const events = await generateMockCalendarEvents(
      input.userId,
      startDate,
      endDate,
      input.includeRecurring ?? true,
      input.eventTypes
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const syncMetadata = {
      syncedAt: formatISO(now),
      totalEvents: events.length,
      dateRange: {
        start: formatISO(startDate),
        end: formatISO(endDate),
      },
      userId: input.userId,
    };

    return {
      events,
      syncMetadata
    };
  }
);
