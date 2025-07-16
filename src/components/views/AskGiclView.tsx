
'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, Loader2, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ProcessedData, SectorAllocation, ClientDetails } from '@/lib/data-processor';
import { formatCurrency } from '@/lib/data-processor';


interface Message {
  role: 'user' | 'model';
  content: string;
}

const GREETING_MESSAGE: Message = {
    role: 'model',
    content: `Hello! I am Gicl, your portfolio assistant.

I can answer specific questions about your data. Try asking me questions about the dashboard or a specific client.

Type 'help' to see all commands.`
};

export const AskGiclView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const processedData = useRef<ProcessedData | null>(null);

  useEffect(() => {
    if (excelProcessor) {
        processedData.current = excelProcessor.getProcessedData();
    }
  }, [excelProcessor]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const getBotResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    const data = processedData.current;

    if (!data) {
        return "I'm sorry, but I don't have any data loaded. Please upload an Excel file first.";
    }

    const formatAllocations = (title: string, allocations: SectorAllocation[] | undefined): string => {
        if (!allocations || allocations.length === 0) {
            return `There is no data for ${title}.`;
        }
        const allocationText = allocations
            .map(a => `${a.sector}: ${formatCurrency(a.allocation)}`)
            .join('\n');
        return `Here is the ${title}:\n${allocationText}`;
    };

    if (lowerQuery.includes('aum')) {
         const clientNameMatch = lowerQuery.match(/for (.+)/);
        if (clientNameMatch && clientNameMatch[1]) {
            const clientName = clientNameMatch[1].trim();
            const clientDetails = excelProcessor?.getDataForClient(clientName);
            if (clientDetails) {
                return `The AUM for ${clientDetails.name} is ${formatCurrency(clientDetails.totalValue)}.`;
            }
            return `Could not find client: ${clientName}`;
        }
        return `The total Assets Under Management (AUM) is ${formatCurrency(data.totalAUM)}.`;
    }

    if (lowerQuery.includes('how many clients') || lowerQuery.startsWith('clients')) {
        return `There are a total of ${data.totalPMSClients} clients.`;
    }

    if (lowerQuery.includes('gain') && lowerQuery.includes('loss')) {
        const { gain, loss, neutral } = data.clientGainLoss;
        return `There are ${gain} clients in gain, ${loss} clients in loss, and ${neutral} neutral.`;
    }

    if (lowerQuery.includes('asset allocation')) {
        if (lowerQuery.includes('gain')) return formatAllocations("asset allocation for clients in gain", data.assetAllocationGain);
        if (lowerQuery.includes('loss')) return formatAllocations("asset allocation for clients in loss", data.assetAllocationLoss);
        return formatAllocations("asset allocation", data.assetAllocation);
    }
    
    if (lowerQuery.includes('sector allocation') || lowerQuery.includes('sector-wise allocation')) {
        const clientNameMatch = lowerQuery.match(/for (.+)/);
        if (clientNameMatch && clientNameMatch[1]) {
            const clientName = clientNameMatch[1].trim();
            const clientDetails = excelProcessor?.getDataForClient(clientName);
            if (clientDetails) {
                 return formatAllocations(`sector allocation for ${clientDetails.name}`, clientDetails.sectorAllocations.map(s => ({ sector: s.sector, allocation: s.value })));
            }
            return `Could not find client: ${clientName}`;
        }
        if (lowerQuery.includes('gain')) return formatAllocations("sector-wise allocation for clients in gain", data.sectorAllocationGain);
        if (lowerQuery.includes('loss')) return formatAllocations("sector-wise allocation for clients in loss", data.sectorAllocationLoss);
        return formatAllocations("sector-wise allocation", data.sectorAllocation);
    }

    if (lowerQuery.includes('expiry') || lowerQuery.includes('years to expiry')) {
        if (!data.yearsToExpiryBuckets) return "No data available for years to expiry.";
        const expiryText = Object.entries(data.yearsToExpiryBuckets)
            .map(([bucket, { value, count }]) => `${bucket}: ${formatCurrency(value)} from ${count} clients`)
            .join('\n');
        return `Years to Expiry Breakdown:\n${expiryText}`;
    }
    
    if (lowerQuery.includes('equity') && lowerQuery.includes('cash') && lowerQuery.includes('ratio')) {
        let response = 'Equity to Cash Ratio Analysis:\n';
        if(data.equityToCashRatioStats.highest) {
            response += `- Highest Ratio: ${data.equityToCashRatioStats.highest.clientName} (${(data.equityToCashRatioStats.highest.ratio * 100).toFixed(2)}% Equity)\n`;
        }
        if(data.equityToCashRatioStats.lowest) {
            response += `- Lowest Ratio: ${data.equityToCashRatioStats.lowest.clientName} (${(data.equityToCashRatioStats.lowest.ratio * 100).toFixed(2)}% Equity)`;
        }
        return response;
    }
    
    if (lowerQuery.startsWith('show me data for')) {
        const clientName = query.substring('show me data for'.length).trim();
        const clientDetails = excelProcessor?.getDataForClient(clientName);
        if (clientDetails) {
            const detailsText = clientDetails.portfolioData
                .map(d => `${d.header}: ${d.value}`)
                .join('\n');
            return `Details for ${clientName}:\n${detailsText}`;
        }
        return `Could not find data for client: ${clientName}`;
    }

    if (lowerQuery.includes('help')) {
        return `Here are some questions you can ask:
- What is the total AUM?
- How many clients are in gain/loss?
- Show me asset allocation.
- Show me sector allocation for clients in gain.
- What is the AUM for [Client Name]?
- Show me sector allocation for [Client Name].
- What is the years to expiry breakdown?
- Who has the highest equity to cash ratio?`;
    }
    
    return "I'm sorry, I don't understand that question. Please type 'help' to see what I can answer.";
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    // Simulate a slight delay for a more natural feel
    setTimeout(() => {
        const botResponseContent = getBotResponse(currentInput);
        const botMessage: Message = { role: 'model', content: botResponseContent };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in-50">
      <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'model' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-prose p-3 rounded-2xl', message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
               {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
                <div className="max-w-md p-3 rounded-2xl bg-muted rounded-bl-none">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
          )}
        </div>
      </ScrollArea>
      <div className="mt-4 pt-4 border-t border-primary/10 space-y-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your portfolio..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
         <Alert variant="default" className="text-xs text-muted-foreground bg-muted/50 border-muted-foreground/20">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-normal">Disclaimer</AlertTitle>
            <AlertDescription>
                AI generated answers can be wrong. Do not fully rely on it.
            </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
