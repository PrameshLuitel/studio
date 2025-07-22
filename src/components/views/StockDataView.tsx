

'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { BarChart, Search, ChevronsUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import type { StockSummaryData } from '@/lib/data-processor';
import { formatCurrency } from '@/lib/data-processor';
import { cn } from '@/lib/utils';

type SortKey = 'stockName' | 'marketRate' | 'totalMarketValue' | 'totalPurchaseValue' | 'totalGainLoss';
type SortDirection = 'asc' | 'desc';

export const StockDataView = () => {
    const { excelProcessor } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalMarketValue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const stockData = useMemo(() => {
        if (!excelProcessor || !excelProcessor.isDataLoaded()) return [];
        const processed = excelProcessor.getProcessedData();
        return processed?.stockSummaryData || [];
    }, [excelProcessor]);

    const filteredAndSortedStocks = useMemo(() => {
        let stocks: StockSummaryData[] = [...stockData];

        if (searchQuery) {
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
    }, [stockData, searchQuery, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full md:w-1/3"
                        />
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
                                        <TableRow key={stock.stockName}>
                                            <TableCell className="font-medium">{stock.stockName}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stock.marketRate)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stock.totalMarketValue)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(stock.totalPurchaseValue)}</TableCell>
                                            <TableCell className={cn("text-right font-mono", stock.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                {stock.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(stock.totalGainLoss)}
                                            </TableCell>
                                        </TableRow>
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
