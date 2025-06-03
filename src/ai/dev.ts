
import { config } from 'dotenv';
config();

import '@/ai/flows/expand-shorthand.ts';
import '@/ai/flows/generate-progress-report.ts';
import '@/ai/flows/sync-google-calendar-flow.ts'; // Added new flow
