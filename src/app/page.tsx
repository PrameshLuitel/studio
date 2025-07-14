'use client';

import React, { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { FileUpload } from '@/components/FileUpload';
import { MainLayout } from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { sheets, isLoading } = useContext(AppContext);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-lg font-headline">Processing your portfolio...</p>
        </div>
      ) : sheets ? (
        <MainLayout />
      ) : (
        <FileUpload />
      )}
    </main>
  );
}
