
'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails, SummaryData } from '@/lib/data-processor';
import { BarChartHorizontal, User, Info, DollarSign, TrendingUp, CalendarClock, Briefcase, Search, ArrowDown, ArrowUp, Hash, Percent, Calendar as CalendarIcon, FileText, Building, CheckCircle, XCircle, Library, FileDigit, Filter, ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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

const renderClientDetails = (details: ClientDetails, activeIndex: number | null, setActiveIndex: (index: number | null) => void) => {
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
    
    const CustomBarLabel = (props: any) => {
        const { x, y, width, value, index } = props;
        if (index !== activeIndex || width < 80) return null;

        return (
            <text x={x + width - 10} y={y + 18} fill="hsl(var(--primary-foreground))" textAnchor="end" className="text-sm font-bold transition-opacity duration-300">
                {formatCurrency(value)}
            </text>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 mt-6">
            <Card className="glassmorphic lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontal className="text-accent"/> Sector Allocations for {details.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-96 w-full">
                        <ResponsiveContainer>
                            <BarChart 
                                layout="vertical" 
                                data={sectorData} 
                                margin={{ left: 10, right: 20 }}
                                onMouseMove={(state) => {
                                    if (state.isTooltipActive) {
                                        setActiveIndex(state.activeTooltipIndex ?? null);
                                    } else {
                                        setActiveIndex(null);
                                    }
                                }}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
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
                                    cursor={{ fill: 'hsl(var(--primary) / 0.5)' }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                    />
                                <Bar dataKey="value" name="Allocation" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                  <LabelList dataKey="value" content={<CustomBarLabel />} />
                                </Bar>
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
            </div>
            {groupedCardData.length > 0 && (
                <Card className="glassmorphic lg:col-span-3">
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
    );
};

export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterOption, setFilterOption] = useState('all');

  const { allClients, clientDetails } = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) {
      return { allClients: [], clientDetails: null };
    }
    const allSummaryData = excelProcessor.getSummaryData() || [];
    const details = selectedClient ? excelProcessor.getDataForClient(selectedClient) : null;
    return { allClients: allSummaryData, clientDetails: details };
  }, [excelProcessor, selectedClient]);

  const filteredAndSortedClients = useMemo(() => {
    let clients = [...allClients];

    if (searchQuery) {
        clients = clients.filter(c => c.clientId.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterOption === 'gain') {
        clients = clients.filter(c => c.gainLossValue > 0);
    } else if (filterOption === 'loss') {
        clients = clients.filter(c => c.gainLossValue < 0);
    } else if (filterOption === 'neutral') {
        clients = clients.filter(c => c.gainLossValue === 0);
    }

    switch (sortOption) {
        case 'name-asc':
            clients.sort((a, b) => a.clientId.localeCompare(b.clientId));
            break;
        case 'name-desc':
            clients.sort((a, b) => b.clientId.localeCompare(a.clientId));
            break;
        case 'value-desc':
            clients.sort((a, b) => b.totalValue - a.totalValue);
            break;
        case 'value-asc':
            clients.sort((a, b) => a.totalValue - b.totalValue);
            break;
        case 'gain-desc':
            clients.sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
            break;
        case 'gain-asc':
            clients.sort((a, b) => a.gainLossPercentage - b.gainLossPercentage);
            break;
    }

    return clients;
  }, [allClients, searchQuery, filterOption, sortOption]);

  const handleClientRowClick = (clientName: string) => {
    setSelectedClient(clientName);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
        <Card className="glassmorphic flex-shrink-0">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:col-span-2">
                        <Select onValueChange={setFilterOption} value={filterOption}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                <SelectItem value="gain">Gain</SelectItem>
                                <SelectItem value="loss">Loss</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setSortOption} value={sortOption}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="value-desc">Value (High-Low)</SelectItem>
                                <SelectItem value="value-asc">Value (Low-High)</SelectItem>
                                <SelectItem value="gain-desc">Gain % (High-Low)</SelectItem>
                                <SelectItem value="gain-asc">Gain % (Low-High)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
      
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className="pr-4 pb-4">
                    <Card className="glassmorphic">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead className="text-right">Portfolio Value</TableHead>
                                    <TableHead className="text-right">Gain/Loss</TableHead>
                                    <TableHead className="text-right">Gain/Loss %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedClients.map((client) => (
                                    <TableRow 
                                        key={client.clientId} 
                                        onClick={() => handleClientRowClick(client.clientId)}
                                        className={cn(
                                            "cursor-pointer",
                                            selectedClient === client.clientId ? "bg-primary/10 hover:bg-primary/20" : ""
                                        )}
                                    >
                                        <TableCell className="font-medium">{client.clientId}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(client.totalValue)}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono",
                                            client.gainLossValue > 0 ? "text-green-500" : client.gainLossValue < 0 ? "text-red-500" : "text-muted-foreground"
                                        )}>
                                            {client.gainLossValue > 0 ? '+' : ''}{formatCurrency(client.gainLossValue)}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono",
                                             client.gainLossPercentage > 0 ? "text-green-500" : client.gainLossPercentage < 0 ? "text-red-500" : "text-muted-foreground"
                                        )}>
                                            {client.gainLossPercentage.toFixed(2)}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {selectedClient && clientDetails ? (
                        renderClientDetails(clientDetails, activeIndex, setActiveIndex)
                    ) : (
                         <div className="flex items-center justify-center mt-6">
                            <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed w-full">
                                <User className="mx-auto h-12 w-12 mb-4 text-primary/50" />
                                <h3 className="font-headline text-lg text-foreground">Select a Client</h3>
                                <p className="mt-2 text-sm">Click on a row in the table above to see their detailed portfolio information.</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    </div>
  );
};
