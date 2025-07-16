
'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { queryPortfolio } from '@/ai/flows/portfolio-query-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, Loader2, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const AskGiclView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const excelDataJson = useRef<string>('');

  useEffect(() => {
    if (excelProcessor) {
      excelDataJson.current = excelProcessor.getAllSheetsRawData();
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
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await queryPortfolio({ query: currentInput, excelData: excelDataJson.current });
      setMessages([...newMessages, { role: 'model', content: result.answer }]);
    } catch (error) {
      console.error('AI query failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'The chatbot could not be reached. Please check your API key and try again.'
      });
       setMessages(newMessages); // Revert to messages before AI call
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in-50">
      <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed">
              <Bot className="mx-auto h-12 w-12 mb-4 text-primary/50" />
              <h3 className="font-headline text-lg text-foreground">Ask Gicl</h3>
              <p className="mt-2 text-sm">I am an AI assistant that can answer questions about your uploaded portfolio data.</p>
            </div>
          )}
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
