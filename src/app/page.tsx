
'use client';

import React from 'react';
import { MainLayout } from '@/components/MainLayout';

export default function Home() {
  return (
    <main className="h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50">
        <MainLayout />
    </main>
  );
}
