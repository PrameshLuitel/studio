
'use client';

import React, { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { MainLayout } from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, getBlob } from 'firebase/storage';
import { ExcelDataProcessor } from '@/lib/data-processor';

export default function Home() {
  const { isLoading, setIsLoading, setExcelProcessor, setFileName } = useContext(AppContext);

  const loadPublicFile = useCallback(async () => {
    setIsLoading(true);
    try {
        const fileRef = ref(storage, 'portfolio/portfolio.xlsx');
        const blob = await getBlob(fileRef);
        const file = new File([blob], "GICL Portfolio.xlsx", { type: blob.type });

        const processor = new ExcelDataProcessor();
        await processor.loadExcelFile(file);
        setExcelProcessor(processor);
        setFileName(file.name);
    } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
            console.error("Failed to load public portfolio:", error);
        }
        // If file is not found, we just proceed to the empty state.
    } finally {
        setIsLoading(false);
    }
  }, [setIsLoading, setExcelProcessor, setFileName]);


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
