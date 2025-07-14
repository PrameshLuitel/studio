
'use client';

import React, { createContext, useState, ReactNode } from 'react';
import type { ExcelDataProcessor } from '@/lib/data-processor';

interface AppContextType {
  fileName: string | null;
  setFileName: (name: string | null) => void;
  excelProcessor: ExcelDataProcessor | null;
  setExcelProcessor: (processor: ExcelDataProcessor | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  resetApp: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [excelProcessor, setExcelProcessor] = useState<ExcelDataProcessor | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  const resetApp = () => {
    setFileName(null);
    setExcelProcessor(null);
    setActiveView('dashboard');
    setIsLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        fileName,
        setFileName,
        excelProcessor,
        setExcelProcessor,
        activeView,
        setActiveView,
        isLoading,
        setIsLoading,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
