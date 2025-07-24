
'use client';

import React, { useEffect, useContext } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { AppContext } from '@/contexts/AppContext';
import { ExcelDataProcessor } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_DRIVE_URL = 'https://drive.google.com/uc?export=download&id=1iiFLaZ0Wpn0xkT0FdNSEMJZ1dAjWXatN';

export default function Home() {
  const { setExcelProcessor, setFileName, setIsLoading, excelProcessor } = useContext(AppContext);
  const { toast } = useToast();

  useEffect(() => {
    const loadFromUrl = async () => {
      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

      try {
        const response = await fetch(GOOGLE_DRIVE_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch file, status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const file = new File([arrayBuffer], "portfolio_gdrive.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        const processor = new ExcelDataProcessor();
        await processor.loadExcelFile(file);

        setExcelProcessor(processor);
        setFileName('Central Portfolio');
        toast({
            title: 'Portfolio Loaded',
            description: 'The central portfolio has been loaded successfully.',
        });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('File fetch timed out.');
           toast({
            variant: 'destructive',
            title: 'Loading Timed Out',
            description: 'Could not fetch the central portfolio in time. Please upload a file manually.',
          });
        } else {
          console.error('Failed to load or process file from URL:', error);
           toast({
            variant: 'destructive',
            title: 'Failed to Load Central Portfolio',
            description: 'The central file could not be loaded. Please upload one manually.',
          });
        }
        // Ensure we don't keep stale data if loading fails
        setExcelProcessor(null);
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only attempt to load from URL if no processor is already set
    if (!excelProcessor) {
        loadFromUrl();
    }
  }, []); // Run only once on component mount

  return (
    <main className="h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50">
        <MainLayout />
    </main>
  );
}
