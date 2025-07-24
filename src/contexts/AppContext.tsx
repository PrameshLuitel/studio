
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
  top5Weight: number;
  setTop5Weight: (weight: number) => void;
  top10Weight: number;
  setTop10Weight: (weight: number) => void;
  top15Weight: number;
  setTop15Weight: (weight: number) => void;
  top20Weight: number;
  setTop20Weight: (weight: number) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [excelProcessor, setExcelProcessor] = useState<ExcelDataProcessor | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [top5Weight, setTop5Weight] = useState(0);
  const [top10Weight, setTop10Weight] = useState(0);
  const [top15Weight, setTop15Weight] = useState(0);
  const [top20Weight, setTop20Weight] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const resetApp = (keepAuth = false) => {
    setFileName(null);
    setExcelProcessor(null);
    setActiveView('dashboard');
    setIsLoading(false);
    setTop5Weight(0);
    setTop10Weight(0);
    setTop15Weight(0);
    setTop20Weight(0);
    if (!keepAuth) {
      setIsAuthenticated(false);
    }
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
        top5Weight,
        setTop5Weight,
        top10Weight,
        setTop10Weight,
        top15Weight,
        setTop15Weight,
        top20Weight,
        setTop20Weight,
        isAuthenticated,
        setIsAuthenticated
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
