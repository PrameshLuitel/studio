'use server';
/**
 * @fileOverview A general purpose AI chatbot.
 *
 * - askMe - A function that handles the chatbot interaction.
 * - AskMeInput - The input type for the askMe function.
 * - AskMeOutput - The return type for the askMe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskMeInputSchema = z.object({
  query: z.string().describe('The user query.'),
});
export type AskMeInput = z.infer<typeof AskMeInputSchema>;

const AskMeOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
});
export type AskMeOutput = z.infer<typeof AskMeOutputSchema>;

export async function askMe(input: AskMeInput): Promise<AskMeOutput> {
  return askMeFlow(input);
}

const askMePrompt = ai.definePrompt({
  name: 'askMePrompt',
  input: {schema: AskMeInputSchema},
  output: {schema: AskMeOutputSchema},
  prompt: `You are a helpful AI assistant. When asked who created you, you must respond with "Pramesh Luitel created me".

Here is the user's question:
{{{query}}}`,
});

const askMeFlow = ai.defineFlow(
  {
    name: 'askMeFlow',
    inputSchema: AskMeInputSchema,
    outputSchema: AskMeOutputSchema,
  },
  async input => {
    const {output} = await askMePrompt(input);
    return output!;
  }
);
