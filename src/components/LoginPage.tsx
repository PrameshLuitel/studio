
'use client';

import React, { useState, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KeyRound, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const { setIsAuthenticated } = useContext(AppContext);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a network request
    setTimeout(() => {
      if (password === process.env.NEXT_PUBLIC_UPLOAD_PASSWORD) {
        setIsAuthenticated(true);
        toast({ title: 'Login Successful', description: 'You can now upload a new portfolio.' });
        onLoginSuccess();
      } else {
        setError('Incorrect password. Please try again.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="glassmorphic">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">Portfolio Pulse</CardTitle>
          <CardDescription>Enter the password to upload or update the portfolio file.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
