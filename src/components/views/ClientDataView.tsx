
'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails } from '@/lib/data-processor';
import { BarChartHorizontal, User, Info, DollarSign, TrendingUp, CalendarClock, Briefcase } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Combobox } from '../ui/combobox';

const StatCard = ({ title, value, icon: Icon, className }: { title: string; value: string; icon: React.ElementType, className?: string }) => (
    <Card className={cn("glassmorphic", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body text-foreground/80">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold font-headline text-primary">{value}</div>
        </CardContent>
    </Card>
);

const renderClientDetails = (details: ClientDetails) => {
    const sectorData = details.sectorAllocations
      .filter(s => s.value > 0)
      .map(s => ({ name: s.sector, value: s.value }));
      
    // Exclude the most valuable data from the main table as they are now in cards
    const excludedHeaders = ['Client Name', 'Present value', 'Unrealised gain', 'Expiry'];
    const portfolioDataForTable = details.portfolioData.filter(item => 
        !excludedHeaders.includes(item.header) &&
        item.value !== undefined && item.value !== null && item.value !== ''
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50">
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Value" value={formatCurrency(details.totalValue)} icon={DollarSign} />
                    <StatCard title="Gain / Loss" value={formatCurrency(details.gainLoss)} icon={TrendingUp} />
                    <StatCard title="Expiry Date" value={details.expiryDate ? format(details.expiryDate, 'dd MMM yyyy') : 'N/A'} icon={CalendarClock} />
                </div>
                <Card className="glassmorphic flex-1">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Info className="text-accent"/> Other Details</CardTitle>
                        <CardDescription>Additional data from the 'Portfolio' sheet for this client.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[340px]">
                             <Table>
                                <TableBody>
                                    {portfolioDataForTable.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-semibold text-foreground/80">{item.header}</TableCell>
                                            <TableCell className="text-right">
                                                {typeof item.value === 'number'
                                                    ? item.header.toLowerCase().includes('value') || item.header.toLowerCase().includes('gain') || item.header.toLowerCase().includes('aum')
                                                        ? formatCurrency(item.value)
                                                        : item.value.toLocaleString()
                                                    : item.value instanceof Date
                                                        ? item.value.toLocaleDateString()
                                                        : String(item.value)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
             </div>
             <Card className="glassmorphic lg:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontal className="text-accent"/> Sector Allocations</CardTitle>
                </CardHeader>
                <CardContent>
                   <ScrollArea className="h-[460px]">
                        <ChartContainer config={{}} className="h-full min-h-[460px] w-full">
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={sectorData} margin={{ left: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={100}
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
                   </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
  };
  
export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const { clientNames, clientDetails } = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) {
      return { clientNames: [], clientDetails: null };
    }
    const names = excelProcessor.getClientNames();
    const details = selectedClient ? excelProcessor.getDataForClient(selectedClient) : null;
    if (selectedClient && !names.includes(selectedClient)) {
        setSelectedClient(null);
        return { clientNames: names, clientDetails: null };
    }
    return { clientNames: names, clientDetails: details };
  }, [excelProcessor, selectedClient]);

  const clientOptions = useMemo(() => {
    return clientNames.map(name => ({ label: name, value: name }));
  }, [clientNames]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
      <Card className="glassmorphic flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
                <Briefcase className="text-primary h-6 w-6" />
                <Combobox
                    options={clientOptions}
                    value={selectedClient || ''}
                    onChange={setSelectedClient}
                    placeholder="Select a client..."
                    searchPlaceholder="Search for a client..."
                    emptyPlaceholder="No clients found."
                    className="w-full max-w-sm"
                />
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
