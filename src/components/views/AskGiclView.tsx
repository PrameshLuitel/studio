
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
import type { ProcessedData } from '@/lib/data-processor';
import { formatCurrency } from '@/lib/data-processor';


interface Message {
  role: 'user' | 'model';
  content: string;
}

const GREETING_MESSAGE: Message = {
    role: 'model',
    content: `Hello! I am Gicl, your portfolio assistant.

I can answer specific questions about your data. Try asking me:
- "What is the total AUM?"
- "How many clients?"
- "Show me asset allocation"
- "Who is my creator?"

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

    if (lowerQuery.includes('creator')) {
        return "Pramesh Luitel created me.";
    }

    if (lowerQuery.includes('aum')) {
        return `The total Assets Under Management (AUM) is ${formatCurrency(data.totalAUM)}.`;
    }

    if (lowerQuery.includes('clients') || lowerQuery.includes('how many clients')) {
        return `There are a total of ${data.totalPMSClients} clients.`;
    }
    
    if (lowerQuery.includes('asset allocation')) {
        if (!data.assetAllocation || data.assetAllocation.length === 0) {
            return "There is no asset allocation data available.";
        }
        const allocationText = data.assetAllocation
            .map(a => `${a.sector}: ${formatCurrency(a.allocation)}`)
            .join('\n');
        return `Here is the asset allocation:\n${allocationText}`;
    }

    if (lowerQuery.includes('help')) {
        return `Here are the commands I understand:
- 'What is the total AUM?'
- 'How many clients?'
- 'Show me asset allocation'
- 'Who is my creator?'`;
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
