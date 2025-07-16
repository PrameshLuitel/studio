
'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails } from '@/lib/data-processor';
import { BarChartHorizontal, User, Info, DollarSign, TrendingUp, CalendarClock, Briefcase, Search, ArrowDown, ArrowUp, Hash, Percent, Calendar as CalendarIcon, FileText, Building, CheckCircle, XCircle, Library, FileDigit } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
    <Card className={cn("glassmorphic", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body text-foreground/80 truncate" title={title}>{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold font-headline text-primary truncate" title={value}>{value}</div>
        </CardContent>
    </Card>
);

const getIconForHeader = (header: string) => {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('value') || lowerHeader.includes('aum') || lowerHeader.includes('amount') || lowerHeader.includes('price')) return DollarSign;
    if (lowerHeader.includes('gain') || lowerHeader.includes('loss')) return TrendingUp;
    if (lowerHeader.includes('%')) return Percent;
    if (lowerHeader.includes('date') || lowerHeader.includes('expiry')) return CalendarIcon;
    if (lowerHeader.includes('client name')) return User;
    if (lowerHeader.includes('pan')) return FileText;
    if (lowerHeader.includes('bank')) return Building;
    if (lowerHeader.includes('active')) return lowerHeader.includes('yes') ? CheckCircle : XCircle;
    if (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || lowerHeader.includes('number')) return Hash;
    if (lowerHeader.includes('a/c no')) return FileDigit;
    return Info;
};

const formatValue = (item: { header: string; value: any }) => {
    const lowerHeader = item.header.toLowerCase();
    if (typeof item.value === 'number') {
        if (lowerHeader.includes('%')) {
            return `${(item.value * 100).toFixed(2)}%`;
        }
        if (lowerHeader.includes('value') || lowerHeader.includes('gain') || lowerHeader.includes('aum') || lowerHeader.includes('price')) {
            return formatCurrency(item.value);
        }
        return item.value.toLocaleString();
    }
    if (item.value instanceof Date) {
        return format(item.value, 'dd MMM yyyy');
    }
    return String(item.value);
};

const renderClientDetails = (details: ClientDetails) => {
    const sectorData = details.sectorAllocations
      .filter(s => s.value > 0)
      .map(s => ({ name: s.sector, value: s.value }));
      
    const groupedHeaders = [
        'Portfolio A/C No.',
        'PMS Opening Date',
        '% of Cash Balance',
        'Payable',
        'Receivable',
        'IPO Apply',
        'FPO Apply',
        'Cash Dividend Value',
        'Stock Dividend Value',
        'Right Payable',
        'Net Cash'
    ];

    const excludedHeaders = ['Client Name', 'S.N.', ...groupedHeaders];

    const individualCardsData = details.portfolioData.filter(item => 
        !excludedHeaders.includes(item.header) &&
        item.value !== undefined && item.value !== null && item.value !== ''
    );
    
    const groupedCardData = details.portfolioData.filter(item => 
        groupedHeaders.includes(item.header) &&
        item.value !== undefined && item.value !== null && item.value !== ''
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50">
            <Card className="glassmorphic lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontal className="text-accent"/> Sector Allocations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-96 w-full">
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={sectorData} margin={{ left: 10, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={120}
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-xs truncate"
                                    />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                    />
                                <Bar dataKey="value" name="Allocation" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {individualCardsData.map((item, index) => (
                    <StatCard 
                        key={index}
                        title={item.header}
                        value={formatValue(item)}
                        icon={getIconForHeader(item.header)}
                    />
                 ))}
                 {groupedCardData.length > 0 && (
                    <Card className="glassmorphic md:col-span-2 lg:col-span-3 xl:col-span-5">
                         <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Library className="text-accent" /> Other Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                                {groupedCardData.map((item, index) => (
                                    <div key={index} className="flex flex-col">
                                        <p className="text-sm text-muted-foreground font-body">{item.header}</p>
                                        <p className="text-lg font-semibold text-foreground font-headline">{formatValue(item)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    );
};
  
export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { allClientNames, clientDetails } = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) {
      return { allClientNames: [], clientDetails: null };
    }
    const names = excelProcessor.getClientNames();
    const details = selectedClient ? excelProcessor.getDataForClient(selectedClient) : null;
    if (selectedClient && !names.includes(selectedClient)) {
        setSelectedClient(null);
        return { allClientNames: names, clientDetails: null };
    }
    return { allClientNames: names, clientDetails: details };
  }, [excelProcessor, selectedClient]);

  const filteredClientNames = useMemo(() => {
    if (!searchQuery) return allClientNames;
    return allClientNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allClientNames, searchQuery]);

  const handleClientChange = (clientName: string) => {
    setSelectedClient(clientName);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
      <Card className="glassmorphic flex-shrink-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search for a client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Briefcase className="text-primary h-5 w-5" />
                    <Select onValueChange={handleClientChange} value={selectedClient || ''}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClientNames.map(name => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
      </Card>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="pr-4 pb-4">
              {selectedClient && clientDetails ? (
                  renderClientDetails(clientDetails)
              ) : (
                  <div className="flex items-center justify-center h-full min-h-[60vh]">
                      <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed">
                          <User className="mx-auto h-12 w-12 mb-4 text-primary/50" />
                          <h3 className="font-headline text-lg text-foreground">Select a Client</h3>
                          <p className="mt-2 text-sm">Choose a client from the dropdown above to see their detailed portfolio information.</p>
                      </div>
                  </div>
              )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
