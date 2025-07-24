
'use client';

import React, { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { FileUpload } from '@/components/FileUpload';
import { MainLayout } from '@/components/MainLayout';
import { LoginPage } from '@/components/LoginPage';
import { Loader2 } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, getBlob, getMetadata } from 'firebase/storage';
import { ExcelDataProcessor } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';

const PORTFOLIO_FILE_PATH = 'portfolio/portfolio.xlsx';

export default function Home() {
  const { excelProcessor, setExcelProcessor, isLoading, setIsLoading, isAuthenticated, setIsAuthenticated, setFileName } = useContext(AppContext);
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
      // If the file is not found, we just stay on the login/upload page.
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setExcelProcessor, setFileName, toast]);

  useEffect(() => {
    // On initial load, try to fetch the public file if not authenticated
    if (!isAuthenticated && !excelProcessor) {
      loadPublicFile();
    }
  }, [isAuthenticated, excelProcessor, loadPublicFile]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  if (isLoading) {
      return (
          <main className="min-h-screen flex flex-col items-center justify-center p-4">
              <div className="flex flex-col items-center gap-4 text-primary">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <p className="text-lg font-headline">Loading Portfolio...</p>
              </div>
          </main>
      );
  }

  if (excelProcessor) {
      return <MainLayout />;
  }
  
  if (isAuthenticated) {
      return (
          <main className="min-h-screen flex flex-col items-center justify-center p-4">
              <FileUpload />
          </main>
      );
  }

  return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <LoginPage onLoginSuccess={handleLoginSuccess} />
      </main>
  );
}
