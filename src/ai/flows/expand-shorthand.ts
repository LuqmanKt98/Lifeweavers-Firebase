// src/ai/flows/expand-shorthand.ts
'use server';

/**
 * @fileOverview Expands shorthand notations into complete sentences for clinicians during note-taking.
 *
 * - expandShorthand - A function that takes shorthand text and expands it.
 * - ExpandShorthandInput - The input type for the expandShorthand function.
 * - ExpandShorthandOutput - The return type for the expandShorthand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandShorthandInputSchema = z.object({
  shorthandText: z
    .string()
    .describe('The shorthand text that needs to be expanded.'),
});
export type ExpandShorthandInput = z.infer<typeof ExpandShorthandInputSchema>;

const ExpandShorthandOutputSchema = z.object({
  expandedText: z.string().describe('The expanded text with complete sentences.'),
});
export type ExpandShorthandOutput = z.infer<typeof ExpandShorthandOutputSchema>;

export async function expandShorthand(input: ExpandShorthandInput): Promise<ExpandShorthandOutput> {
  return expandShorthandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandShorthandPrompt',
  input: {schema: ExpandShorthandInputSchema},
  output: {schema: ExpandShorthandOutputSchema},
  prompt: `You are a helpful assistant that expands shorthand notations into complete sentences for medical professionals. Given the shorthand text, please expand it into a full, coherent sentence or paragraph. Focus on maintaining accuracy and clarity.

Shorthand Text: {{{shorthandText}}}`,
});

const expandShorthandFlow = ai.defineFlow(
  {
    name: 'expandShorthandFlow',
    inputSchema: ExpandShorthandInputSchema,
    outputSchema: ExpandShorthandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
