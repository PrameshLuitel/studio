
'use client';

import React, { useContext } from 'react';
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
  FileUp,
  BarChartHorizontal,
  MessageCircle,
  BarChart,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Label } from './ui/label';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'client-data', label: 'Client Data', icon: Table },
  { id: 'stock-data', label: 'Stock Data', icon: BarChart },
  { id: 'eps', label: 'EPS Viewer', icon: LineChart },
  { id: 'ask-gicl', label: 'Ask Gicl', icon: MessageCircle },
];

export const MainLayout = () => {
  const { activeView, setActiveView, resetApp, fileName } = useContext(AppContext);

  const renderView = () => {
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
              <BarChartHorizontal />
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetApp}
                className="text-primary/70 hover:bg-primary/10 hover:text-primary"
              >
                <FileUp className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Upload new file</p>
            </TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
      <main className="flex-1 flex flex-col bg-background/50 dark:bg-black/20 rounded-xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-primary/10 font-headline">
          <div>
            <h1 className="text-xl font-bold capitalize text-primary">{activeView.replace('-', ' ')}</h1>
            {fileName && <p className="text-xs text-muted-foreground">Analyzing: {fileName}</p>}
          </div>
          {activeView === 'stock-data' && (
               <div className="flex items-center gap-4">
                  <Label className="font-semibold text-sm text-muted-foreground">Weight:</Label>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8">Top 5</Button>
                      <Button variant="outline" size="sm" className="h-8">Top 10</Button>
                      <Button variant="outline" size="sm" className="h-8">Top 20</Button>
                  </div>
              </div>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>
      </main>
    </div>
  );
};
