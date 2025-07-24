
'use client';

import React, { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { MainLayout } from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, getBlob, getMetadata } from 'firebase/storage';
import { ExcelDataProcessor } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';

const PORTFOLIO_FILE_PATH = 'portfolio/portfolio.xlsx';

export default function Home() {
  const { setExcelProcessor, isLoading, setIsLoading, setFileName } = useContext(AppContext);
  const { toast } = useToast();

  const loadPublicFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const fileRef = ref(storage, PORTFOLIO_FILE_PATH);
      const metadata = await getMetadata(fileRef);
      const blob = await getBlob(fileRef);
      
      const processor = new ExcelDataProcessor();
      await processor.loadExcelFile(new File([blob], metadata.name));
      setExcelProcessor(processor);
      setFileName(metadata.name);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Error loading file from storage:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load the portfolio file from storage.",
        });
      }
      // If the file is not found, we just show the empty state in MainLayout.
      setExcelProcessor(null);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setExcelProcessor, setFileName, toast]);

  useEffect(() => {
    loadPublicFile();
  }, [loadPublicFile]);
  
  if (isLoading) {
      return (
          <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
              <div className="flex flex-col items-center gap-4 text-primary">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <p className="text-lg font-headline">Loading Portfolio...</p>
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
