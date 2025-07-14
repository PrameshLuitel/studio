'use client';

import React, { createContext, useState, ReactNode } from 'react';

export interface SheetData {
  [key: string]: any[];
}

interface AppContextType {
  fileName: string | null;
  setFileName: (name: string | null) => void;
  sheets: SheetData | null;
  setSheets: (data: SheetData | null) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  resetApp: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  const resetApp = () => {
    setFileName(null);
    setSheets(null);
    setActiveView('dashboard');
    setIsLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        fileName,
        setFileName,
        sheets,
        setSheets,
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
