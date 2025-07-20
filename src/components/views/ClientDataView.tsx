
'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Sector } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails, SummaryData } from '@/lib/data-processor';
import { User, Info, DollarSign, TrendingUp, CalendarClock, Briefcase, Search, Library, FileDigit, Filter, PieChart as PieChartIcon, CheckCircle, XCircle, FileText, Building, Hash, Percent, Calendar as CalendarIcon, Wallet, ChevronsUpDown, ArrowDown, ArrowUp } from 'lucide-react';
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
        return format(item.value, 'dd/MM/yyyy');
    }
    return String(item.value);
};

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const ActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
  
    return (
      <g>
        <text x={cx} y={cy} dy={-15} textAnchor="middle" fill="hsl(var(--foreground))" className="text-lg font-headline">
            {payload.name}
        </text>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="font-mono">
            {formatCurrency(value)}
        </text>
         <text x={cx} y={cy} dy={30} textAnchor="middle" fill={fill} className="text-base font-bold font-mono">
          {`( ${(percent * 100).toFixed(2)}% )`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
             filter: `drop-shadow(0px 4px 12px ${fill})`,
             WebkitFilter: `drop-shadow(0px 4px 12px ${fill})`
          }}
        />
      </g>
    );
};

interface ClientDetailsViewProps {
    details: ClientDetails;
}

const ClientDetailsComponent: React.FC<ClientDetailsViewProps> = ({ details }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const sectorData = useMemo(() => details.sectorAllocations
      .filter(s => s.value > 0)
      .map(s => ({ name: s.sector, value: s.value })), [details.sectorAllocations]);
      
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

    const individualCardsData = useMemo(() => details.portfolioData.filter(item => 
        !excludedHeaders.includes(item.header) &&
        item.value !== undefined && item.value !== null && item.value !== ''
    ), [details.portfolioData]);
    
    const groupedCardData = useMemo(() => details.portfolioData.filter(item => 
        groupedHeaders.includes(item.header) &&
        item.value !== undefined && item.value !== null && item.value !== ''
    ), [details.portfolioData]);

    const handlePieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 p-4">
            <Card className="glassmorphic lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon className="text-accent"/> Sector Allocations for {details.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-96 w-full">
                         <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={sectorData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={90} 
                                    outerRadius={140} 
                                    labelLine={false} 
                                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                                    activeShape={<ActiveShape />}
                                    onMouseEnter={handlePieEnter}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        if (index === activeIndex) return null;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">{`${(percent * 100).toFixed(0)}%`}</text> : null;
                                    }}>
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--primary) / 0.5)' }}
                                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                                />
                            </PieChart>
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

type SortKey = 'clientId' | 'initialInvestment' | 'totalValue' | 'gainLossValue' | 'gainLossPercentage' | 'expiryDate';
type SortDirection = 'asc' | 'desc';

export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('clientId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
    let clients: SummaryData[] = [...allClients];

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

    clients.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        let compare = 0;
        if (aVal === undefined || aVal === null) compare = -1;
        else if (bVal === undefined || bVal === null) compare = 1;
        else if (typeof aVal === 'string' && typeof bVal === 'string') {
            compare = aVal.localeCompare(bVal);
        } else if (aVal instanceof Date && bVal instanceof Date) {
            compare = aVal.getTime() - bVal.getTime();
        } else {
            compare = (aVal as number) - (bVal as number);
        }
        
        return sortDirection === 'asc' ? compare : -compare;
    });

    return clients;
  }, [allClients, searchQuery, filterOption, sortKey, sortDirection]);

  const handleClientRowClick = (clientName: string) => {
    setSelectedClient(prev => prev === clientName ? null : clientName);
  };
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  };

  const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => (
      <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort(tkey)}>
          <div className="flex items-center gap-2">
            {label}
            {sortKey === tkey ? (
                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
      </TableHead>
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
        <Card className="glassmorphic flex-shrink-0">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <Select onValueChange={(v) => {
                            const [key, dir] = v.split('-') as [SortKey, SortDirection];
                            setSortKey(key);
                            setSortDirection(dir);
                        }} value={`${sortKey}-${sortDirection}`}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="clientId-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="clientId-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="initialInvestment-desc">Investment (High-Low)</SelectItem>
                                <SelectItem value="initialInvestment-asc">Investment (Low-High)</SelectItem>
                                <SelectItem value="totalValue-desc">Value (High-Low)</SelectItem>
                                <SelectItem value="totalValue-asc">Value (Low-High)</SelectItem>
                                <SelectItem value="gainLossPercentage-desc">Gain % (High-Low)</SelectItem>
                                <SelectItem value="gainLossPercentage-asc">Gain % (Low-High)</SelectItem>
                                <SelectItem value="expiryDate-desc">Expiry Date (Newest)</SelectItem>
                                <SelectItem value="expiryDate-asc">Expiry Date (Oldest)</SelectItem>
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
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <SortableHeader tkey="clientId" label="Client Name" />
                                    <SortableHeader tkey="initialInvestment" label="Initial Investment" />
                                    <SortableHeader tkey="totalValue" label="Portfolio Value" />
                                    <SortableHeader tkey="gainLossValue" label="Gain/Loss" />
                                    <SortableHeader tkey="gainLossPercentage" label="Gain/Loss %" />
                                    <SortableHeader tkey="expiryDate" label="Expiry Date" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No clients found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedClients.map((client, index) => (
                                        <React.Fragment key={`${client.clientId}-${index}`}>
                                            <TableRow 
                                                className={cn(
                                                    "cursor-pointer",
                                                    selectedClient === client.clientId && "bg-primary/10"
                                                )}
                                            >
                                                <TableCell 
                                                    className="font-medium hover:text-primary hover:underline"
                                                    onClick={() => handleClientRowClick(client.clientId)}
                                                >
                                                    {client.clientId}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{client.initialInvestment ? formatCurrency(client.initialInvestment) : 'N/A'}</TableCell>
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
                                                    {(client.gainLossPercentage * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {client.expiryDate ? format(client.expiryDate, 'dd/MM/yyyy') : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                            {selectedClient === client.clientId && clientDetails && (
                                                <TableRow className="bg-background/50 dark:bg-black/20">
                                                    <TableCell colSpan={6} className="p-0">
                                                       <ClientDetailsComponent details={clientDetails} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    </div>
  );
};

