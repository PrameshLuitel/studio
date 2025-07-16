
'use server';
/**
 * @fileOverview An AI agent that answers questions about portfolio data.
 *
 * - queryPortfolio - A function that handles the portfolio query process.
 * - PortfolioQueryInput - The input type for the queryPortfolio function.
 * - PortfolioQueryOutput - The return type for the queryPortfolio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PortfolioQueryInputSchema = z.object({
  query: z.string().describe('The user query about their portfolio.'),
  excelData: z.string().describe('A JSON string representing all the data from the user\'s uploaded excel file. The JSON is an object where keys are sheet names and values are 2D arrays of the sheet data.'),
});
export type PortfolioQueryInput = z.infer<typeof PortfolioQueryInputSchema>;

const PortfolioQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query based on the portfolio data.'),
});
export type PortfolioQueryOutput = z.infer<typeof PortfolioQueryOutputSchema>;

export async function queryPortfolio(input: PortfolioQueryInput): Promise<PortfolioQueryOutput> {
  return portfolioQueryFlow(input);
}

const portfolioQueryPrompt = ai.definePrompt({
  name: 'portfolioQueryPrompt',
  input: {schema: PortfolioQueryInputSchema},
  output: {schema: PortfolioQueryOutputSchema},
  prompt: `You are a helpful AI financial analyst named "Ask Gicl". When asked who created you, you must respond with "Pramesh Luitel created me".

You will be given a user's question and the entire contents of their portfolio Excel file in JSON format. Your task is to analyze the data and provide a clear, accurate, and helpful answer to the user's query.

Here is the user's question:
"{{{query}}}"

Here is the portfolio data in JSON format:
\`\`\`json
{{{excelData}}}
\`\`\`

Analyze the data and answer the user's question.`,
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
