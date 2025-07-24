
'use client';

import React, { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { MainLayout } from '@/components/MainLayout';
import { storage } from '@/lib/firebase';
import { ref, getBlob } from 'firebase/storage';
import { ExcelDataProcessor } from '@/lib/data-processor';

export default function Home() {
  const { excelProcessor, setIsLoading, setExcelProcessor, setFileName } = useContext(AppContext);

  const loadPublicFile = useCallback(async () => {
    // This function runs in the background. It doesn't block the UI.
    // We only show a loader inside the dashboard if we start loading.
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
        // If file is not found, or on any other error, we just proceed to the empty state.
        // The local upload will be available. The AppContext will still have a null processor.
    } finally {
        setIsLoading(false);
    }
  }, [setIsLoading, setExcelProcessor, setFileName]);


  useEffect(() => {
    // On initial mount, attempt to load the public file.
    // The UI will show the "Upload" prompt until the processor is set.
    if (!excelProcessor) {
        loadPublicFile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // We no longer show a full-screen loader here. 
  // MainLayout will handle its own empty/loaded state.
  return (
    <main className="h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50">
        <MainLayout />
    </main>
  );
}
