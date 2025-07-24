

'use client';

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { BarChart, Search, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { StockSummaryData, ClientHolding } from '@/lib/data-processor';
import { formatCurrency } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type SortKey = 'stockName' | 'marketRate' | 'totalMarketValue' | 'totalPurchaseValue' | 'totalGainLoss' | 'holdingPercentage';
type SortDirection = 'asc' | 'desc';
type ClientHoldingSortKey = 'clientId' | 'purchaseValue' | 'marketValue' | 'gainLossPercentage' | 'weightedAvgCost' | 'stockWeightInPortfolio';

export const StockDataView = () => {
    const { excelProcessor, setTop5Weight, setTop10Weight, setTop15Weight, setTop20Weight } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalMarketValue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

    const [clientHoldingSortKey, setClientHoldingSortKey] = useState<ClientHoldingSortKey>('marketValue');
    const [clientHoldingSortDirection, setClientHoldingSortDirection] = useState<SortDirection>('desc');


    const stockData = useMemo(() => {
        if (!excelProcessor || !excelProcessor.isDataLoaded()) return [];
        const processed = excelProcessor.getProcessedData();
        return processed?.stockSummaryData || [];
    }, [excelProcessor]);

    useEffect(() => {
        if (stockData.length > 0) {
            const sortedByWeight = [...stockData].sort((a, b) => b.holdingPercentage - a.holdingPercentage);

            const top5 = sortedByWeight.slice(0, 5).reduce((sum, stock) => sum + stock.holdingPercentage, 0);
            const top10 = sortedByWeight.slice(0, 10).reduce((sum, stock) => sum + stock.holdingPercentage, 0);
            const top15 = sortedByWeight.slice(0, 15).reduce((sum, stock) => sum + stock.holdingPercentage, 0);
            const top20 = sortedByWeight.slice(0, 20).reduce((sum, stock) => sum + stock.holdingPercentage, 0);

            setTop5Weight(top5);
            setTop10Weight(top10);
            setTop15Weight(top15);
            setTop20Weight(top20);
        }
    }, [stockData, setTop5Weight, setTop10Weight, setTop15Weight, setTop20Weight]);

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
    
    const handleClientHoldingSort = (key: ClientHoldingSortKey) => {
        if (clientHoldingSortKey === key) {
            setClientHoldingSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setClientHoldingSortKey(key);
            setClientHoldingSortDirection('desc');
        }
    };

    const getSortedClientHoldings = (clientHoldings: ClientHolding[]): ClientHolding[] => {
        return [...clientHoldings].sort((a, b) => {
            const aVal = a[clientHoldingSortKey];
            const bVal = b[clientHoldingSortKey];
            let compare = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                compare = aVal.localeCompare(bVal);
            } else {
                compare = (aVal as number) - (bVal as number);
            }
            return clientHoldingSortDirection === 'asc' ? compare : -compare;
        });
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

    const ClientHoldingSortableHeader = ({ tkey, label, className }: { tkey: ClientHoldingSortKey, label: string, className?: string }) => (
        <TableHead className={cn("cursor-pointer hover:bg-muted/80 transition-colors", className)} onClick={() => handleClientHoldingSort(tkey)}>
            <div className="flex items-center gap-2">
                {label}
                {clientHoldingSortKey === tkey ? (
                    clientHoldingSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
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
                        <div className="grid grid-cols-2 gap-2">
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
                                <SelectItem value="holdingPercentage-desc">% Holding (High-Low)</SelectItem>
                                <SelectItem value="holdingPercentage-asc">% Holding (Low-High)</SelectItem>
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
                                    <TableHead>S.No.</TableHead>
                                    <SortableHeader tkey="stockName" label="Stock Name" />
                                    <SortableHeader tkey="marketRate" label="Market Rate" className="text-right" />
                                    <SortableHeader tkey="totalMarketValue" label="Total Market Value" className="text-right" />
                                    <SortableHeader tkey="totalPurchaseValue" label="Total Purchase Value" className="text-right" />
                                    <SortableHeader tkey="totalGainLoss" label="Total Gain/Loss" className="text-right" />
                                    <SortableHeader tkey="holdingPercentage" label="% Holding" className="text-right" />
                                    <TableHead className="text-center">Signal</TableHead>
                                </TableRow>
                            </TableHeader>
                            
                                {filteredAndSortedStocks.length > 0 ? (
                                    filteredAndSortedStocks.map((stock, index) => (
                                       <Collapsible asChild key={`${stock.stockName}-${index}`} open={openCollapsible === stock.stockName} onOpenChange={() => toggleCollapsible(stock.stockName)} >
                                         <tbody className="border-none">
                                            <CollapsibleTrigger asChild>
                                                <TableRow className="cursor-pointer hover:bg-muted/50 data-[state=open]:bg-primary/10">
                                                    <TableCell>{index + 1}</TableCell>
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
                                                    <TableCell className="text-right font-mono">{stock.holdingPercentage.toFixed(2)}%</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm"
                                                                className={cn(
                                                                    stock.buyPrice && stock.marketRate <= stock.buyPrice && 'bg-green-500/80 hover:bg-green-500 text-white animate-pulse-green'
                                                                )}
                                                            >
                                                                Buy
                                                            </Button>
                                                            <Button 
                                                                variant="secondary" 
                                                                size="sm"
                                                                className={cn(
                                                                    stock.sellPrice && stock.marketRate >= stock.sellPrice && 'bg-red-500/80 hover:bg-red-500 text-white animate-pulse-red'
                                                                )}
                                                            >
                                                                Sell
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent asChild>
                                               <tr className="bg-background/50 dark:bg-black/20">
                                                    <TableCell colSpan={8} className="p-2">
                                                        <div className="p-2 bg-muted/50 rounded-md">
                                                            <h4 className="font-semibold px-2 py-1">Client Holdings for {stock.stockName}</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <ClientHoldingSortableHeader tkey="clientId" label="Client Name" />
                                                                        <ClientHoldingSortableHeader tkey="purchaseValue" label="Purchase Value" className="text-right" />
                                                                        <ClientHoldingSortableHeader tkey="marketValue" label="Market Value" className="text-right" />
                                                                        <ClientHoldingSortableHeader tkey="gainLossPercentage" label="Gain/Loss (%)" className="text-right" />
                                                                        <ClientHoldingSortableHeader tkey="weightedAvgCost" label="Weighted Avg Cost" className="text-right" />
                                                                        <ClientHoldingSortableHeader tkey="stockWeightInPortfolio" label="% of Equity Weight" className="text-right" />
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {getSortedClientHoldings(stock.clientHoldings).map((holding) => (
                                                                        <TableRow key={holding.clientId}>
                                                                            <TableCell>{holding.clientName}</TableCell>
                                                                            <TableCell className="text-right font-mono">{formatCurrency(holding.purchaseValue)}</TableCell>
                                                                            <TableCell className="text-right font-mono">{formatCurrency(holding.marketValue)}</TableCell>
                                                                            <TableCell className={cn("text-right font-mono", holding.gainLossPercentage >= 0 ? 'text-green-500' : 'text-red-500')}>{holding.gainLossPercentage.toFixed(2)}%</TableCell>
                                                                            <TableCell className="text-right font-mono">{formatCurrency(holding.weightedAvgCost)}</TableCell>
                                                                            <TableCell className="text-right font-mono">{(holding.stockWeightInPortfolio).toFixed(2)}%</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                               </tr>
                                            </CollapsibleContent>
                                          </tbody>
                                       </Collapsible>
                                    ))
                                ) : (
                                    <tbody>
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No stocks found for your search query.
                                            </TableCell>
                                        </TableRow>
                                    </tbody>
                                )}
                        </Table>
                    </Card>
                </ScrollArea>
            </div>
        </div>
    );
};
