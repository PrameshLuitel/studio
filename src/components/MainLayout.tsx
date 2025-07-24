
'use client';

import React, { useContext, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { DashboardView } from './views/DashboardView';
import { ClientDataView } from './views/ClientDataView';
import { StockDataView } from './views/StockDataView';
import { EpsView } from './views/EpsView';
import { AskGiclView } from './views/AskGiclView';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Table,
  LineChart,
  BarChart,
  MessageCircle,
  UploadCloud,
  User,
  LogOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { FileUpload } from './FileUpload';
import { LoginPage } from './LoginPage';
import { FileUploadDialog } from './FileUploadDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'client-data', label: 'Client Data', icon: Table },
  { id: 'stock-data', label: 'Stock Data', icon: BarChart },
  { id: 'eps', label: 'EPS Viewer', icon: LineChart },
  { id: 'ask-gicl', label: 'Ask Gicl', icon: MessageCircle },
];

const WeightButton = ({ title, value }: { title: string, value: number }) => (
    <div className="flex flex-col items-center">
        <Button variant="outline" size="sm" className="h-8">
            {title}
        </Button>
        {value > 0 && (
            <p className="text-xs font-mono font-semibold text-primary mt-1">
                {value.toFixed(2)}%
            </p>
        )}
    </div>
);

export const MainLayout = () => {
  const { 
      activeView, 
      setActiveView, 
      fileName, 
      top5Weight, 
      top10Weight, 
      top15Weight, 
      top20Weight, 
      excelProcessor,
      resetApp,
      isAuthenticated,
      setIsAuthenticated
  } = useContext(AppContext);
  
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    setUploadOpen(true);
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    // The main page will reload the public file, so we just reset the app state
    resetApp(true);
    window.location.reload(); // Force reload to fetch the new central file
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderView = () => {
    if (!excelProcessor) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <h1 className="text-5xl font-headline font-bold text-primary mb-2">Portfolio Pulse</h1>
                <p className="max-w-xl">No central portfolio is available. Admins can log in to upload one. Otherwise, you can upload a local file for analysis.</p>
                <div className="max-w-2xl w-full mt-8">
                    <FileUpload />
                </div>
            </div>
        );
    }
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'client-data':
        return <ClientDataView />;
      case 'stock-data':
        return <StockDataView />;
      case 'eps':
        return <EpsView />;
      case 'ask-gicl':
        return <AskGiclView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="w-full h-[95vh] max-h-[1080px] max-w-screen-2xl flex gap-4 p-4 rounded-2xl glassmorphic shadow-2xl overflow-hidden">
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-col items-center justify-between py-4 px-2 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 mb-2 bg-primary text-primary-foreground rounded-lg">
              <LayoutDashboard />
            </div>
            <Separator className="bg-primary/10" />
            {navItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      'rounded-lg transition-all',
                      activeView === item.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-primary/70 hover:bg-primary/10 hover:text-primary'
                    )}
                    disabled={!excelProcessor}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
           {excelProcessor && (
             <div className="flex flex-col items-center gap-2">
               <Separator className="bg-primary/10" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resetApp(isAuthenticated)}
                      className="text-primary/70 hover:bg-primary/10 hover:text-primary"
                    >
                      <UploadCloud className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Upload Local File</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
        </nav>
      </TooltipProvider>
      <main className="flex-1 flex flex-col bg-background/50 dark:bg-black/20 rounded-xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-primary/10 font-headline">
          <div>
            <h1 className="text-xl font-bold capitalize text-primary">{activeView.replace('-', ' ')}</h1>
            {fileName && <p className="text-xs text-muted-foreground">Analyzing: {fileName}</p>}
          </div>
          <div className="flex items-center gap-4">
              {activeView === 'stock-data' && excelProcessor && (
                   <div className="flex items-center gap-4">
                      <Label className="font-semibold text-sm text-muted-foreground">Weight:</Label>
                      <div className="flex items-center gap-2">
                          <WeightButton title="Top 5" value={top5Weight} />
                          <WeightButton title="Top 10" value={top10Weight} />
                          <WeightButton title="Top 15" value={top15Weight} />
                          <WeightButton title="Top 20" value={top20Weight} />
                      </div>
                  </div>
              )}
               {isAuthenticated ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="mr-2"/> Logout</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}><User className="mr-2"/> Admin Login</Button>
               )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>
      </main>

      <Dialog open={isLoginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
          </DialogHeader>
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload New Central Portfolio</DialogTitle>
            </DialogHeader>
            <FileUploadDialog onUploadSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>

    </div>
  );
};
