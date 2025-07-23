
'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Sector } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, ClientDetails, SummaryData, StockAllocation } from '@/lib/data-processor';
import { User, Info, DollarSign, TrendingUp, CalendarClock, Briefcase, Search, Library, FileDigit, Filter, PieChart as PieChartIcon, CheckCircle, XCircle, FileText, Building, Hash, Percent, Calendar as CalendarIcon, Wallet, ChevronsUpDown, ArrowDown, ArrowUp, BarChart, ListTree, AreaChart } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';


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

type StockSortKey = 'stock' | 'sector' | 'quantity' | 'marketRate' | 'marketValue' | 'gain' | 'equityWeight';
type StockSortDirection = 'asc' | 'desc';

const ClientDetailsComponent: React.FC<ClientDetailsViewProps> = ({ details }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [stockSortKey, setStockSortKey] = useState<StockSortKey>('marketValue');
    const [stockSortDirection, setStockSortDirection] = useState<StockSortDirection>('desc');

    const sectorData = useMemo(() => {
        const validSectors = details.sectorAllocations.filter(s => s.value > 0);
        const totalAllocation = validSectors.reduce((acc, curr) => acc + curr.value, 0);
        
        if (totalAllocation === 0) return [];
        
        return validSectors.map(s => ({ 
            name: s.sector, 
            value: s.value,
            percentage: s.value / totalAllocation
        }));
    }, [details.sectorAllocations]);
      
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

    const onPieLeave = useCallback(() => {
        setActiveIndex(null);
    }, []);
    
    const topSectors = useMemo(() => {
        return [...sectorData].sort((a, b) => b.value - a.value).slice(0, 4);
    }, [sectorData]);

    const sortedStockAllocations = useMemo(() => {
        const sorted = [...details.stockAllocations].sort((a, b) => {
            const aVal = a[stockSortKey];
            const bVal = b[stockSortKey];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
            }
            return 0;
        });

        if (stockSortDirection === 'desc') {
            return sorted.reverse();
        }
        return sorted;
    }, [details.stockAllocations, stockSortKey, stockSortDirection]);

    const handleStockSort = (key: StockSortKey) => {
        if (stockSortKey === key) {
            setStockSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setStockSortKey(key);
            setStockSortDirection('desc');
        }
    };

    const StockSortableHeader = ({ tkey, label, className }: { tkey: StockSortKey; label: string; className?: string }) => (
        <TableHead
            className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)}
            onClick={() => handleStockSort(tkey)}
        >
            <div className="flex items-center gap-2">
                {label}
                {stockSortKey === tkey ? (
                    stockSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in-50 p-4">
            <Card className="glassmorphic lg:col-span-2">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon className="text-accent"/> Sector Allocations for {details.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChartContainer config={{}} className="h-64 w-full">
                         <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={sectorData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={90} 
                                    labelLine={false} 
                                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                                    activeShape={<ActiveShape />}
                                    onMouseEnter={handlePieEnter}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        if (index === activeIndex || percent < 0.05) return null;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">{`${(percent * 100).toFixed(0)}%`}</text>;
                                    }}
                                >
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--primary) / 0.5)' }}
                                    content={<ChartTooltipContent formatter={(value, name, props) => {
                                        const { percentage } = props.payload || {};
                                        return (
                                            <div>
                                                <div className="font-semibold">{formatCurrency(Number(value))}</div>
                                                {percentage && <div className="text-sm text-muted-foreground">({(percentage * 100).toFixed(2)}%)</div>}
                                            </div>
                                        );
                                    }} />}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                     <div className="w-full space-y-2">
                        <ScrollArea className="h-64">
                            <ul className="space-y-1 p-1">
                                {topSectors.map((item, index) => (
                                    <li 
                                        key={item.name} 
                                        className={cn("flex items-center p-1.5 rounded-md transition-all duration-200", activeIndex === sectorData.findIndex(d => d.name === item.name) ? 'bg-muted/80 text-primary font-bold' : '')}
                                        onMouseEnter={() => handlePieEnter(null, sectorData.findIndex(d => d.name === item.name))}
                                        onMouseLeave={onPieLeave}
                                    >
                                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[sectorData.findIndex(s => s.name === item.name) % COLORS.length] }} />
                                        <span className="font-medium text-foreground/90 flex-1 text-sm">{item.name}</span>
                                        <span className="font-mono text-muted-foreground text-sm">{(item.percentage * 100).toFixed(2)}%</span>
                                    </li>
                                ))}
                            </ul>
                             <div className="p-2 border-t mt-2">
                                <h4 className="font-semibold text-sm mb-1">Equity to Cash Ratio</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Equity:</span>
                                    <span className="font-mono font-medium">{details.equityPercentage.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Cash:</span>
                                    <span className="font-mono font-medium">{details.cashPercentage.toFixed(2)}%</span>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            <Card className="glassmorphic lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><AreaChart className="text-accent"/> Stock Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[27rem]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                                <TableRow>
                                    <StockSortableHeader tkey="stock" label="Stock" />
                                    <StockSortableHeader tkey="sector" label="Sector" />
                                    <StockSortableHeader tkey="quantity" label="Quantity" className="text-right" />
                                    <StockSortableHeader tkey="marketRate" label="Market Rate" className="text-right" />
                                    <StockSortableHeader tkey="marketValue" label="Market Value" className="text-right" />
                                    <StockSortableHeader tkey="gain" label="Gain" className="text-right" />
                                    <StockSortableHeader tkey="equityWeight" label="% Eq. Wt." className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStockAllocations.length > 0 ? sortedStockAllocations.map(stock => (
                                    <TableRow key={stock.stock}>
                                        <TableCell className="font-medium">{stock.stock}</TableCell>
                                        <TableCell>{stock.sector}</TableCell>
                                        <TableCell className="text-right font-mono">{stock.quantity.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(stock.marketRate)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(stock.marketValue)}</TableCell>
                                        <TableCell className={cn("text-right font-mono", stock.gain >= 0 ? 'text-green-500' : 'text-red-500')}>
                                            {stock.gain.toFixed(2)}%
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{(stock.equityWeight * 100).toFixed(2)}%</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">No stock data for this client.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                <Card className="glassmorphic lg:col-span-5">
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

type SortKey = 'clientId' | 'initialInvestment' | 'totalValue' | 'equityValue' | 'gainLossValue' | 'portfolioGainLoss' | 'gainLossPercentage' | 'expiryDate' | 'periodInvested';
type SortDirection = 'asc' | 'desc';

export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
        else if (sortKey === 'periodInvested') {
            const aMonths = (a.periodInvested?.years || 0) * 12 + (a.periodInvested?.months || 0);
            const bMonths = (b.periodInvested?.years || 0) * 12 + (b.periodInvested?.months || 0);
            compare = aMonths - bMonths;
        }
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
                                <SelectItem value="equityValue-desc">Equity (High-Low)</SelectItem>
                                <SelectItem value="equityValue-asc">Equity (Low-High)</SelectItem>
                                <SelectItem value="portfolioGainLoss-desc">Portfolio Gain (High-Low)</SelectItem>
                                <SelectItem value="portfolioGainLoss-asc">Portfolio Gain (Low-High)</SelectItem>
                                <SelectItem value="expiryDate-desc">Expiry Date (Newest)</SelectItem>
                                <SelectItem value="expiryDate-asc">Expiry Date (Oldest)</SelectItem>
                                <SelectItem value="periodInvested-desc">Period Invested (Longest)</SelectItem>
                                <SelectItem value="periodInvested-asc">Period Invested (Shortest)</SelectItem>
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
                                    <SortableHeader tkey="equityValue" label="Equity %" />
                                    <SortableHeader tkey="gainLossValue" label="Gain/Loss" />
                                    <SortableHeader tkey="portfolioGainLoss" label="Port +/- %" />
                                    <SortableHeader tkey="gainLossPercentage" label="Cum. Return" />
                                    <SortableHeader tkey="expiryDate" label="Expiry Date" />
                                    <SortableHeader tkey="periodInvested" label="Period Invested" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
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
                                                onClick={() => handleClientRowClick(client.clientId)}
                                            >
                                                <TableCell 
                                                    className="font-medium hover:text-primary hover:underline"
                                                >
                                                    {client.clientId}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{client.initialInvestment ? formatCurrency(client.initialInvestment) : 'N/A'}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(client.totalValue)}</TableCell>
                                                <TableCell className="text-right font-mono">{typeof client.equityValue === 'number' ? `${client.equityValue.toFixed(2)}%` : 'N/A'}</TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-mono",
                                                    client.gainLossValue > 0 ? "text-green-500" : client.gainLossValue < 0 ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                    {client.gainLossValue > 0 ? '+' : ''}{formatCurrency(client.gainLossValue)}
                                                </TableCell>
                                                <TableCell className={cn("text-right font-mono")}>
                                                    {typeof client.portfolioGainLoss === 'number' ? 
                                                    <span className={client.portfolioGainLoss > 0 ? "text-green-500" : client.portfolioGainLoss < 0 ? "text-red-500" : "text-muted-foreground"}>
                                                        {client.portfolioGainLoss > 0 ? '+' : ''}{(client.portfolioGainLoss * 100).toFixed(2)}%
                                                    </span>
                                                    : 'N/A'}
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
                                                <TableCell className="text-right font-mono">
                                                    {client.periodInvested ? `${client.periodInvested.years}y ${client.periodInvested.months}m` : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                            {selectedClient === client.clientId && clientDetails && (
                                                <TableRow className="bg-background/50 dark:bg-black/20">
                                                    <TableCell colSpan={9} className="p-0">
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

    