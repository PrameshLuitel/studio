
'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, PieChart as PieChartIcon, ArrowUpCircle, ArrowDownCircle, Banknote, TrendingDown, ShieldAlert, CalendarClock, ListTree, Info, Trophy, X } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Sector } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency, SectorAllocation, EquityCashRatioStats, TopMover, LargestPortfolio } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const DataCard = ({ title, value, icon: Icon, description, descriptionClassName }: { title: string; value: string; icon: React.ElementType; description: string; descriptionClassName?: string }) => (
    <Card className="glassmorphic">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body text-foreground/80">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold font-headline text-primary">{value}</div>
            <p className={cn("text-xs text-muted-foreground", descriptionClassName)}>{description}</p>
        </CardContent>
    </Card>
);

const MoverList = ({ movers, isGainer, scrollHeight }: { movers: TopMover[], isGainer: boolean, scrollHeight?: string }) => (
    <ScrollArea className={cn("pr-3 -mr-3", scrollHeight || "h-[34rem]")}>
        <div className="space-y-1">
            {movers.map((mover, index) => (
                 <div key={index} className="flex justify-between items-center text-sm p-1.5 rounded-md hover:bg-muted/50 transition-colors duration-200">
                    <span className="font-medium text-foreground/90 flex-1 min-w-0 pr-2">{mover.clientId}</span>
                    <div className={cn(
                        "font-mono font-semibold flex items-baseline gap-1.5 whitespace-nowrap text-right shrink-0",
                        isGainer ? 'text-green-500' : 'text-red-500'
                    )}>
                       <div className="flex flex-col items-end -space-y-1">
                         <span className="font-mono font-semibold text-primary">{formatCurrency(mover.totalValue)}</span>
                         <div className="flex items-baseline gap-1 text-xs">
                            <span>{formatCurrency(mover.value)}</span>
                            <span className="text-muted-foreground/80">({(mover.percentage * 100).toFixed(2)}%)</span>
                         </div>
                       </div>
                    </div>
                </div>
            ))}
        </div>
    </ScrollArea>
);

const TopMoversList = ({ movers, title, icon: Icon, isGainer }: { movers: TopMover[], title: string, icon: React.ElementType, isGainer: boolean }) => (
    <Card className="glassmorphic h-full">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Icon className="text-accent"/> {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
           <MoverList movers={movers} isGainer={isGainer} scrollHeight="h-[31.5rem]" />
        </CardContent>
    </Card>
);

const LargestPortfoliosCard = ({ portfolios }: { portfolios: LargestPortfolio[] }) => (
    <Card className="glassmorphic h-full">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Trophy className="text-accent" /> Largest Portfolios
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[31.5rem] pr-3 -mr-3">
                <div className="space-y-1">
                    {portfolios.map((p, index) => (
                        <div key={index} className="flex justify-between items-center text-sm p-1.5 rounded-md hover:bg-muted/50 transition-colors duration-200">
                            <span className="font-medium text-foreground/90 flex-1 min-w-0 pr-2">{p.clientId}</span>
                            <div className="flex flex-col items-end -space-y-1 shrink-0">
                                <span className="font-mono font-semibold text-primary">{formatCurrency(p.totalValue)}</span>
                                <span className={cn(
                                    "text-xs font-mono",
                                    p.gainLossValue >= 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {p.gainLossValue >= 0 ? '+' : ''}{formatCurrency(p.gainLossValue)} ({(p.gainLossPercentage * 100).toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
);


const LoadingSkeleton = () => (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <Card className="glassmorphic"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-7 w-3/5 mb-2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
            <Card className="glassmorphic"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-7 w-3/5 mb-2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
            <Card className="glassmorphic lg:col-span-2"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        </div>
        <div className="grid gap-6">
            <Card className="glassmorphic"><CardContent className="p-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
            <Card className="glassmorphic"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
  </div>
);

const ErrorDisplay = () => (
    <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground p-8 rounded-xl bg-muted/50 border border-dashed">
            <h3 className="font-headline text-lg text-foreground">Could not process dashboard data.</h3>
            <p className="mt-2 text-sm">Please ensure your uploaded file contains the required sheets and columns.</p>
        </div>
    </div>
);

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
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
};


const AllocationPieChart = ({ title, data, icon: Icon, ratioStats, listHeight = 'h-48' }: { 
    title: string; 
    data: SectorAllocation[]; 
    icon: React.ElementType;
    ratioStats?: EquityCashRatioStats | null;
    listHeight?: string;
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handlePieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, [setActiveIndex]);

    const onPieLeave = useCallback(() => {
        setActiveIndex(null);
    }, [setActiveIndex]);

    const chartData = useMemo(() => {
        if (!data) return [];
        const totalAllocation = data.reduce((acc, curr) => acc + curr.allocation, 0);
        return data.map(s => ({ name: s.sector, value: s.allocation, percentage: totalAllocation > 0 ? (s.allocation / totalAllocation) : 0 }));
    }, [data]);

    const topItems = useMemo(() => {
        return [...chartData].sort((a, b) => b.value - a.value);
    }, [chartData]);
    
    if (chartData.length === 0) {
        return (
            <Card className="glassmorphic col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Icon className="text-accent"/> {title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">No data available for this category.</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glassmorphic col-span-1">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Icon className="text-accent"/> {title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4 items-center">
                    <ChartContainer config={{}} className="h-52 w-full">
                        <ResponsiveContainer>
                            <RechartsPieChart>
                                <Pie 
                                    data={chartData} 
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
                                    onMouseLeave={onPieLeave}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        if (index === activeIndex) return null;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">{`${(percent * 100).toFixed(0)}%`}</text> : null;
                                    }}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    <div className="w-full space-y-2">
                        <Collapsible defaultOpen>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start h-8 px-2 text-sm font-headline text-foreground/80 hover:bg-muted/80">
                                   <ListTree className="mr-2"/> Items
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <ScrollArea className={listHeight}>
                                    <ul className="space-y-1 p-1">
                                        {topItems.map((item, index) => (
                                            <li 
                                                key={item.name} 
                                                className={cn("flex items-center p-1.5 rounded-md transition-all duration-200 text-base", activeIndex === chartData.findIndex(d => d.name === item.name) ? 'bg-muted/80 text-primary font-bold' : '')}
                                                onMouseEnter={() => handlePieEnter(null, chartData.findIndex(d => d.name === item.name))}
                                                onMouseLeave={onPieLeave}
                                            >
                                                <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[chartData.findIndex(s => s.name === item.name) % COLORS.length] }} />
                                                <span className="font-medium text-foreground/90 flex-1 text-sm">{item.name}</span>
                                                <span className="font-mono text-muted-foreground text-sm">{(item.percentage * 100).toFixed(2)}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </CollapsibleContent>
                        </Collapsible>
                         {ratioStats && (
                            <Collapsible defaultOpen>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start h-8 px-2 text-sm font-headline text-foreground/80 hover:bg-muted/80">
                                       <Info className="mr-2"/> Equity/Cash Ratio Analysis
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                   <ScrollArea className="h-24">
                                        <div className="pt-2 p-1 text-sm">
                                            {ratioStats.highest && (
                                            <div className="flex justify-between items-start p-1 rounded-md">
                                                <span className="text-muted-foreground flex items-center gap-1.5 pt-0.5"><TrendingUp className="h-3.5 w-3.5 text-green-500" />Highest:</span>
                                                <div className="text-right">
                                                    <span className="font-medium text-foreground">{ratioStats.highest.clientName}</span>
                                                    <div className="font-mono text-primary leading-tight text-xs">
                                                        <span>E: {(ratioStats.highest.ratio * 100).toFixed(2)}%</span>
                                                        <span className="text-muted-foreground mx-1">|</span>
                                                        <span>C: {((1 - ratioStats.highest.ratio) * 100).toFixed(2)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                            {ratioStats.lowest && (
                                            <div className="flex justify-between items-start p-1 rounded-md">
                                                <span className="text-muted-foreground flex items-center gap-1.5 pt-0.5"><TrendingDown className="h-3.5 w-3.5 text-red-500"/>Lowest:</span>
                                                <div className="text-right">
                                                    <span className="font-medium text-foreground">{ratioStats.lowest.clientName}</span>
                                                    <div className="font-mono text-primary leading-tight text-xs">
                                                        <span>E: {(ratioStats.lowest.ratio * 100).toFixed(2)}%</span>
                                                        <span className="text-muted-foreground mx-1">|</span>
                                                        <span>C: {((1 - ratioStats.lowest.ratio) * 100).toFixed(2)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export const DashboardView = () => {
  const { excelProcessor, isLoading } = useContext(AppContext);
  const [selectedExpiryBucket, setSelectedExpiryBucket] = useState<string | null>(null);

  const dashboardData = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) return null;
    try {
        return excelProcessor.getProcessedData();
    } catch (error) {
        console.error("Error processing dashboard metrics:", error);
        return null;
    }
  }, [excelProcessor]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (!dashboardData) {
    return <ErrorDisplay />;
  }
  
  const { 
      summaryStats, 
      assetAllocation, 
      assetAllocationGain, 
      assetAllocationLoss, 
      sectorAllocation, 
      sectorAllocationGain, 
      sectorAllocationLoss, 
      yearsToExpiryBuckets,
      equityToCashRatioStats,
      equityToCashRatioStatsGain,
      equityToCashRatioStatsLoss,
      topGainers,
      topLosers,
      largestPortfolios,
      totalPortfolioGainPercentage,
    } = useMemo(() => {
    const data = dashboardData;
    const yearsToExpiryBuckets = data.yearsToExpiryBuckets 
        ? Object.entries(data.yearsToExpiryBuckets).map(([name, { value, count, clientNames }]) => ({ name, value, count, clientNames })) 
        : [];
    return {
        summaryStats: {
            totalAUM: data.totalAUM,
            clientGainLoss: data.clientGainLoss,
            totalClients: data.totalPMSClients,
        },
        assetAllocation: data.assetAllocation || [],
        assetAllocationGain: data.assetAllocationGain || [],
        assetAllocationLoss: data.assetAllocationLoss || [],
        sectorAllocation: data.sectorAllocation || [],
        sectorAllocationGain: data.sectorAllocationGain || [],
        sectorAllocationLoss: data.sectorAllocationLoss || [],
        yearsToExpiryBuckets,
        equityToCashRatioStats: data.equityToCashRatioStats,
        equityToCashRatioStatsGain: data.equityToCashRatioStatsGain,
        equityToCashRatioStatsLoss: data.equityToCashRatioStatsLoss,
        topGainers: data.topGainers || [],
        topLosers: data.topLosers || [],
        largestPortfolios: data.largestPortfolios || [],
        totalPortfolioGainPercentage: data.totalPortfolioGainPercentage || 0,
    };
  }, [dashboardData]);
  
  const handleBarClick = (data: any) => {
    if (data && data.name) {
      setSelectedExpiryBucket(prev => prev === data.name ? null : data.name);
    }
  };

  const selectedBucketClients = useMemo(() => {
    if (!selectedExpiryBucket) return [];
    const bucket = yearsToExpiryBuckets.find(b => b.name === selectedExpiryBucket);
    return bucket ? bucket.clientNames : [];
  }, [selectedExpiryBucket, yearsToExpiryBuckets]);

  const gainLoss = summaryStats.clientGainLoss || { gain: 0, loss: 0, neutral: 0 };

  return (
    <div className="grid gap-6 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DataCard
            title="Total AUM"
            value={formatCurrency(summaryStats.totalAUM || 0)}
            icon={DollarSign}
            description={`Total portfolio gain: ${(totalPortfolioGainPercentage * 100).toFixed(2)}%`}
            descriptionClassName={totalPortfolioGainPercentage >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <Card className="glassmorphic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body text-foreground/80">Client Gain/Loss</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-headline text-primary">
                    <span className="text-green-500">{gainLoss.gain} Gained</span> / <span className="text-red-500">{gainLoss.loss} Lost</span>
                </div>
                <p className="text-xs text-muted-foreground">{gainLoss.neutral} Neutral</p>
            </CardContent>
        </Card>
        <DataCard title="Active Clients" value={(summaryStats.totalClients || 0).toString()} icon={Users} description="Total number of clients" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AllocationPieChart 
            title="Asset Allocation" 
            data={assetAllocation} 
            icon={Banknote} 
            ratioStats={equityToCashRatioStats}
            listHeight="h-24"
        />
        <AllocationPieChart title="Sector-wise Allocation" data={sectorAllocation} icon={PieChartIcon} listHeight="h-48" />
        <LargestPortfoliosCard portfolios={largestPortfolios} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AllocationPieChart title="Asset Allocation (Gain)" data={assetAllocationGain} icon={TrendingUp} ratioStats={equityToCashRatioStatsGain} listHeight="h-24" />
        <TopMoversList movers={topGainers} title="Top Gainers (%)" icon={ArrowUpCircle} isGainer={true} />
        <AllocationPieChart title="Sector-wise Allocation (Gain)" data={sectorAllocationGain} icon={ArrowUpCircle} listHeight="h-48" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AllocationPieChart title="Asset Allocation (Loss)" data={assetAllocationLoss} icon={TrendingDown} ratioStats={equityToCashRatioStatsLoss} listHeight="h-24" />
        <TopMoversList movers={topLosers} title="Top Losers (%)" icon={ArrowDownCircle} isGainer={false} />
        <AllocationPieChart title="Sector-wise Allocation (Loss)" data={sectorAllocationLoss} icon={ArrowDownCircle} listHeight="h-48" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glassmorphic col-span-1">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><CalendarClock className="text-accent"/> Years to Expiry vs AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cn("h-80 w-full", selectedExpiryBucket ? "md:col-span-2" : "md:col-span-3")}>
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer>
                        <RechartsBarChart 
                            data={yearsToExpiryBuckets}
                            onClick={(e) => handleBarClick(e?.activePayload?.[0]?.payload)}
                        >
                            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name, props) => (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">{formatCurrency(Number(value))}</span>
                                            <span className="text-xs text-muted-foreground">{props.payload.count} clients</span>
                                        </div>
                                    )}
                                />}
                            />
                            <Bar dataKey="value" name="AUM" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="recharts-bar-rectangle cursor-pointer"/>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                {selectedExpiryBucket && (
                  <div className="md:col-span-1 animate-in fade-in-50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-foreground">Clients in '{selectedExpiryBucket}' bucket</h4>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedExpiryBucket(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <ScrollArea className="h-72 border rounded-md bg-muted/30">
                        <ul className="p-2 space-y-1">
                           {selectedBucketClients.map((client, index) => (
                               <li key={index} className="text-sm p-1.5 rounded-md hover:bg-background/50">
                                   {client}
                               </li>
                           ))}
                        </ul>
                    </ScrollArea>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
