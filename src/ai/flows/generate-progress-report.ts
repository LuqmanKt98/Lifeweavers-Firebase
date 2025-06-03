
// src/ai/flows/generate-progress-report.ts
'use server';
/**
 * @fileOverview Generates a progress review report for a client based on session notes.
 *
 * - generateProgressReport - A function that takes client name and session notes text and returns an HTML report.
 * - GenerateProgressReportInput - The input type for the generateProgressReport function.
 * - GenerateProgressReportOutput - The return type for the generateProgressReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProgressReportInputSchema = z.object({
  clientName: z.string().describe('The name of the client for whom the report is being generated.'),
  sessionNotesText: z
    .string()
    .describe(
      'A compilation of relevant session notes, formatted for clarity. Each note should ideally include date, clinician, and content.'
    ),
});
export type GenerateProgressReportInput = z.infer<typeof GenerateProgressReportInputSchema>;

const GenerateProgressReportOutputSchema = z.object({
  reportHtmlContent: z
    .string()
    .describe('The generated progress report content in HTML format, suitable for display and email.'),
});
export type GenerateProgressReportOutput = z.infer<typeof GenerateProgressReportOutputSchema>;

export async function generateProgressReport(
  input: GenerateProgressReportInput
): Promise<GenerateProgressReportOutput> {
  return generateProgressReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProgressReportPrompt',
  input: {schema: GenerateProgressReportInputSchema},
  output: {schema: GenerateProgressReportOutputSchema},
  prompt: `You are a clinical assistant AI specialized in drafting progress review reports for therapy clients.
The report is for a client named: {{{clientName}}}.

Based on the following session notes, please generate a concise and professional progress review report in HTML format.
The report should be well-structured with headings (e.g., <h2>, <h3>) and paragraphs (<p>). Use lists (<ul>, <li>) where appropriate for clarity.
The report should highlight:
1.  Overall progress made by the client.
2.  Key achievements or milestones met.
3.  Any ongoing challenges or areas needing further attention.
4.  Observed changes in the client's condition or engagement.
5.  A brief summary or outlook.

Please ensure the language is empathetic, clear, and suitable for sharing with the client or other stakeholders.
Avoid overly technical jargon unless it's commonly understood or briefly explained.

Session Notes Compilation:
{{{sessionNotesText}}}

Begin the report content below:
`,
});

const generateProgressReportFlow = ai.defineFlow(
  {
    name: 'generateProgressReportFlow',
    inputSchema: GenerateProgressReportInputSchema,
    outputSchema: GenerateProgressReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate progress report. The AI model did not return an output.');
    }
    return output;
  }
);
