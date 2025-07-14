
'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails } from '@/lib/data-processor';
import { ArrowDownCircle, ArrowUpCircle, BarChartHorizontal, DollarSign, User, TrendingUp, Info } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

const InfoCard = ({ title, value, icon: Icon, valueClass }: { title: string; value: string; icon: React.ElementType, valueClass?: string }) => (
    <Card className="glassmorphic">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body text-foreground/80">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold font-headline ${valueClass}`}>{value}</div>
        </CardContent>
    </Card>
);

const renderClientDetails = (details: ClientDetails) => {
    const gainLossColor = details.gainLoss > 0 ? 'text-green-500' : details.gainLoss < 0 ? 'text-red-500' : 'text-foreground';
    const gainLossIcon = details.gainLoss > 0 ? ArrowUpCircle : ArrowDownCircle;
    
    const sectorData = details.sectorAllocations
      .filter(s => s.value > 0)
      .map(s => ({ name: s.sector, value: s.value }));
      
    const portfolioDataForTable = details.portfolioData.filter(item => item.value !== undefined && item.value !== null && item.value !== '');

    return (
        <div className="space-y-6 animate-in fade-in-50">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InfoCard 
                    title="Total Value" 
                    value={formatCurrency(details.totalValue)}
                    icon={DollarSign}
                    valueClass="text-primary"
                />
                <InfoCard 
                    title="Gain / Loss" 
                    value={formatCurrency(details.gainLoss)}
                    icon={gainLossIcon}
                    valueClass={gainLossColor}
                />
                 <InfoCard 
                    title="Expiry Date" 
                    value={details.expiryDate ? details.expiryDate.toLocaleDateString() : 'N/A'}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontal className="text-accent"/> Sector Allocations</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={{}} className="h-96 w-full">
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={sectorData}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={120}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
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

                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Info className="text-accent"/> Full Client Details</CardTitle>
                        <CardDescription>All data from the 'Portfolio' sheet for this client.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                             <Table>
                                <TableBody>
                                    {portfolioDataForTable.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-semibold text-foreground/80">{item.header}</TableCell>
                                            <TableCell className="text-right">
                                                {typeof item.value === 'number'
                                                    ? item.header.toLowerCase().includes('value') || item.header.toLowerCase().includes('gain')
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
    return { clientNames: names, clientDetails: details };
  }, [excelProcessor, selectedClient]);

  const handleClientChange = (clientName: string) => {
    setSelectedClient(clientName);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
      <Card className="glassmorphic flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
                <User className="text-primary" />
                <Select onValueChange={handleClientChange} value={selectedClient || ""}>
                    <SelectTrigger className="w-full max-w-sm">
                        <SelectValue placeholder="Select a client to view details" />
                    </SelectTrigger>
                    <SelectContent>
                        {clientNames.map((name) => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
      </Card>
      
      <ScrollArea className="flex-1">
        <div className="pr-4 pb-4">
            {selectedClient && clientDetails ? (
                renderClientDetails(clientDetails)
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed">
                        <h3 className="font-headline text-lg text-foreground">Select a Client</h3>
                        <p className="mt-2 text-sm">Choose a client from the dropdown above to see their detailed portfolio information.</p>
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
};
