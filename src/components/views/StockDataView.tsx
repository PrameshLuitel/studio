

'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { BarChart, Search, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { StockSummaryData } from '@/lib/data-processor';
import { formatCurrency } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type SortKey = 'stockName' | 'marketRate' | 'totalMarketValue' | 'totalPurchaseValue' | 'totalGainLoss';
type SortDirection = 'asc' | 'desc';

export const StockDataView = () => {
    const { excelProcessor } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalMarketValue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

    const stockData = useMemo(() => {
        if (!excelProcessor || !excelProcessor.isDataLoaded()) return [];
        const processed = excelProcessor.getProcessedData();
        return processed?.stockSummaryData || [];
    }, [excelProcessor]);

    const stockOptions = useMemo(() => {
        return stockData.map(s => ({ label: s.stockName, value: s.stockName }));
    }, [stockData]);

    const filteredAndSortedStocks = useMemo(() => {
        let stocks: StockSummaryData[] = [...stockData];

        if (selectedStock) {
            stocks = stocks.filter(s => s.stockName === selectedStock);
        } else if (searchQuery) {
            stocks = stocks.filter(s => s.stockName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        stocks.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            let compare = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                compare = aVal.localeCompare(bVal);
            } else {
                compare = (aVal as number) - (bVal as number);
            }
            return sortDirection === 'asc' ? compare : -compare;
        });

        return stocks;
    }, [stockData, searchQuery, selectedStock, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const SortableHeader = ({ tkey, label, className }: { tkey: SortKey, label: string, className?: string }) => (
        <TableHead className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)} onClick={() => handleSort(tkey)}>
            <div className="flex items-center gap-2">
                {label}
                {sortKey === tkey ? (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                )}
            </div>
        </TableHead>
    );
    
    const toggleCollapsible = (stockName: string) => {
        setOpenCollapsible(prev => prev === stockName ? null : stockName);
    }

    if (!excelProcessor || !excelProcessor.isDataLoaded()) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed">
                    <h3 className="font-headline text-lg text-foreground">No Data Loaded</h3>
                    <p className="mt-2 text-sm">Please upload an Excel file to view stock data.</p>
                </div>
            </div>
        );
    }
    
    if (stockData.length === 0) {
        return <div className="text-center text-muted-foreground p-6">Stock data could not be processed. Please check the 'Holding Statement' sheet.</div>;
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in-50">
            <Card className="glassmorphic flex-shrink-0">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search stocks..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedStock(''); // Clear dropdown selection when searching
                                }}
                                className="pl-10 w-full"
                            />
                        </div>
                        <div className="md:col-span-1">
                             <Combobox
                                options={stockOptions}
                                value={selectedStock}
                                onChange={(value) => {
                                    setSelectedStock(value);
                                    setSearchQuery(''); // Clear search when using dropdown
                                }}
                                placeholder="Select a stock..."
                                searchPlaceholder='Search stocks...'
                                emptyPlaceholder='No stocks found.'
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Select onValueChange={(v) => {
                                const [key, dir] = v.split('-') as [SortKey, SortDirection];
                                setSortKey(key);
                                setSortDirection(dir);
                            }} value={`${sortKey}-${sortDirection}`}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stockName-asc">Name (A-Z)</SelectItem>
                                    <SelectItem value="stockName-desc">Name (Z-A)</SelectItem>
                                    <SelectItem value="totalMarketValue-desc">Market Value (High-Low)</SelectItem>
                                    <SelectItem value="totalMarketValue-asc">Market Value (Low-High)</SelectItem>
                                    <SelectItem value="totalPurchaseValue-desc">Purchase Value (High-Low)</SelectItem>
                                    <SelectItem value="totalPurchaseValue-asc">Purchase Value (Low-High)</SelectItem>
                                    <SelectItem value="totalGainLoss-desc">Gain/Loss (High-Low)</SelectItem>
                                    <SelectItem value="totalGainLoss-asc">Gain/Loss (Low-High)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4 pb-4">
                    <Card className="glassmorphic">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <SortableHeader tkey="stockName" label="Stock Name" />
                                    <SortableHeader tkey="marketRate" label="Market Rate" className="text-right" />
                                    <SortableHeader tkey="totalMarketValue" label="Total Market Value" className="text-right" />
                                    <SortableHeader tkey="totalPurchaseValue" label="Total Purchase Value" className="text-right" />
                                    <SortableHeader tkey="totalGainLoss" label="Total Gain/Loss" className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedStocks.length > 0 ? (
                                    filteredAndSortedStocks.map((stock) => (
                                       <Collapsible asChild key={stock.stockName} open={openCollapsible === stock.stockName} onOpenChange={() => toggleCollapsible(stock.stockName)}>
                                         <>
                                            <CollapsibleTrigger asChild>
                                                <TableRow className="cursor-pointer hover:bg-muted/50 data-[state=open]:bg-primary/10">
                                                    <TableCell className="font-medium">{stock.stockName}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(stock.marketRate)}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(stock.totalMarketValue)}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(stock.totalPurchaseValue)}</TableCell>
                                                    <TableCell className={cn("text-right font-mono", stock.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                        <div className="flex flex-col items-end">
                                                            <span>{stock.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(stock.totalGainLoss)}</span>
                                                            {stock.totalPurchaseValue !== 0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({((stock.totalGainLoss / stock.totalPurchaseValue) * 100).toFixed(2)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent asChild>
                                               <tr className="bg-background/50 dark:bg-black/20">
                                                    <TableCell colSpan={5} className="p-2">
                                                        <div className="p-2 bg-muted/50 rounded-md">
                                                            <h4 className="font-semibold px-2 py-1">Client Holdings for {stock.stockName}</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Client Name</TableHead>
                                                                        <TableHead className="text-right">Purchase Value</TableHead>
                                                                        <TableHead className="text-right">Market Value</TableHead>
                                                                        <TableHead className="text-right">Gain/Loss (%)</TableHead>
                                                                        <TableHead className="text-right">EPS</TableHead>
                                                                        <TableHead className="text-right">P/E Ratio</TableHead>
                                                                        <TableHead className="text-right">Stock's Weight in Portfolio</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {stock.clientHoldings.map((holding) => (
                                                                        <TableRow key={holding.clientName}>
                                                                            <TableCell>{holding.clientName}</TableCell>
                                                                            <TableCell className="text-right font-mono">{formatCurrency(holding.purchaseValue)}</TableCell>
                                                                            <TableCell className="text-right font-mono">{formatCurrency(holding.marketValue)}</TableCell>
                                                                            <TableCell className={cn("text-right font-mono", holding.gainLossPercentage >= 0 ? 'text-green-500' : 'text-red-500')}>{holding.gainLossPercentage.toFixed(2)}%</TableCell>
                                                                            <TableCell className="text-right font-mono">{holding.eps.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono">{holding.peRatio.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right font-mono">{holding.stockWeightInPortfolio.toFixed(2)}%</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                               </tr>
                                            </CollapsibleContent>
                                          </>
                                       </Collapsible>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No stocks found for your search query.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </ScrollArea>
            </div>
        </div>
    );
};
