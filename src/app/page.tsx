
'use client';

import React, { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { MainLayout } from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isLoading, setIsLoading } = useContext(AppContext);

  useEffect(() => {
    // This is a placeholder for any initial loading logic you might need.
    // For now, we'll just ensure loading is false on mount.
    setIsLoading(false);
  }, [setIsLoading]);
  
  if (isLoading) {
      return (
          <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
              <div className="flex flex-col items-center gap-4 text-primary">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <p className="text-lg font-headline">Loading...</p>
              </div>
          </main>
      );
  }

  return (
    <main className="h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50">
        <MainLayout />
    </main>
  );
}
