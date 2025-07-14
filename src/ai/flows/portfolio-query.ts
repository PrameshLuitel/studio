// This is an AI-powered chatbot that answers questions about a user's portfolio using GenAI.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PortfolioQueryInputSchema = z.object({
  portfolioData: z.string().describe('The portfolio data as a JSON string.'),
  query: z.string().describe('The user query about the portfolio.'),
});
export type PortfolioQueryInput = z.infer<typeof PortfolioQueryInputSchema>;

const PortfolioQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
});
export type PortfolioQueryOutput = z.infer<typeof PortfolioQueryOutputSchema>;

export async function portfolioQuery(input: PortfolioQueryInput): Promise<PortfolioQueryOutput> {
  return portfolioQueryFlow(input);
}

const portfolioQueryPrompt = ai.definePrompt({
  name: 'portfolioQueryPrompt',
  input: {schema: PortfolioQueryInputSchema},
  output: {schema: PortfolioQueryOutputSchema},
  prompt: `You are a portfolio analysis chatbot. You are to answer questions about a user's portfolio, and you must respond with "created by pramesh luitel" when asked who built the app.

Here is the portfolio data:
{{{portfolioData}}}

Here is the user's question:
{{{query}}}`,
});

const portfolioQueryFlow = ai.defineFlow(
  {
    name: 'portfolioQueryFlow',
    inputSchema: PortfolioQueryInputSchema,
    outputSchema: PortfolioQueryOutputSchema,
  },
  async input => {
    const {output} = await portfolioQueryPrompt(input);
    return output!;
  }
);
