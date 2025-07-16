
'use client';

import React, { useContext, useMemo, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, PieChart as PieChartIcon, BarChart, ArrowUpCircle, ArrowDownCircle, Banknote, TrendingDown, ChevronsUpDown } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend, Sector } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency, SectorAllocation, EquityToCashRatioInfo } from '@/lib/data-processor';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const DataCard = ({ title, value, icon: Icon, description }: { title: string; value: string; icon: React.ElementType; description: string; }) => (
    <Card className="glassmorphic">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body text-foreground/80">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold font-headline text-primary">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const LoadingSkeleton = () => (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="glassmorphic"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-7 w-3/5 mb-2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
            <Card className="glassmorphic"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-7 w-3/5 mb-2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
            <Card className="glassmorphic"><CardHeader><Skeleton className="h-5 w-2/5" /></CardHeader><CardContent><Skeleton className="h-7 w-3/5 mb-2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
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
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
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


const AllocationPieChart = ({ title, data, icon: Icon, showRatio, highestRatio, lowestRatio }: { 
    title: string; 
    data: SectorAllocation[]; 
    icon: React.ElementType; 
    showRatio?: boolean;
    highestRatio?: EquityToCashRatioInfo | null;
    lowestRatio?: EquityToCashRatioInfo | null;
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
        return data.map(s => ({ name: s.sector, value: s.allocation, percentage: totalAllocation > 0 ? (s.allocation / totalAllocation) * 100 : 0 }));
    }, [data]);

    const topItems = useMemo(() => {
        return [...chartData].sort((a, b) => b.value - a.value).slice(0, 5);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <ChartContainer config={{}} className="h-80 w-full">
                        <ResponsiveContainer>
                            <RechartsPieChart>
                                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel formatter={(value, name, props) => `${props.payload.name}: ${formatCurrency(Number(value))}`} />} />
                                <Pie 
                                    data={chartData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={100} 
                                    labelLine={false} 
                                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                                    activeShape={<ActiveShape />}
                                    onMouseEnter={handlePieEnter}
                                    onMouseLeave={onPieLeave}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        if (index === activeIndex) return null; // Hide label for active slice
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
                    <div>
                        <h4 className="font-headline text-lg mb-4 text-foreground">Top 5 Items</h4>
                        <ul className="space-y-3">
                            {topItems.map((item, index) => (
                                <li 
                                    key={item.name} 
                                    className={cn("flex items-center text-sm transition-all duration-200", activeIndex === chartData.findIndex(d => d.name === item.name) ? 'text-primary font-bold' : '')}
                                    onMouseEnter={() => handlePieEnter(null, chartData.findIndex(d => d.name === item.name))}
                                    onMouseLeave={onPieLeave}
                                >
                                    <span className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ backgroundColor: COLORS[chartData.findIndex(s => s.name === item.name) % COLORS.length] }} />
                                    <span className="font-medium text-foreground/90 flex-1">{item.name}</span>
                                    <span className="font-mono text-muted-foreground">{item.percentage.toFixed(2)}%</span>
                                </li>
                            ))}
                        </ul>
                         {showRatio && (highestRatio || lowestRatio) && (
                            <>
                                <Separator className="my-4" />
                                <h4 className="font-headline text-lg mb-4 text-foreground flex items-center gap-2"><ChevronsUpDown className="h-5 w-5 text-accent"/> Equity/Cash Ratio</h4>
                                <div className="space-y-3 text-sm">
                                    {highestRatio && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-foreground/90">Highest:</span>
                                            <div className="text-right">
                                                <div className="font-mono text-primary font-semibold">{highestRatio.ratio.toFixed(2)}</div>
                                                <div className="text-xs text-muted-foreground">{highestRatio.clientName}</div>
                                            </div>
                                        </div>
                                    )}
                                     {lowestRatio && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-foreground/90">Lowest:</span>
                                            <div className="text-right">
                                                <div className="font-mono text-primary font-semibold">{lowestRatio.ratio.toFixed(2)}</div>
                                                <div className="text-xs text-muted-foreground">{lowestRatio.clientName}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                         )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export const DashboardView = () => {
  const { excelProcessor, isLoading } = useContext(AppContext);

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
      yearsToExpiryChartData,
      highestEquityToCashRatio,
      lowestEquityToCashRatio
    } = useMemo(() => {
    const data = dashboardData;
    const yearsToExpiryChartData = data.yearsToExpiryBuckets 
        ? Object.entries(data.yearsToExpiryBuckets).map(([name, value]) => ({ name, value })) 
        : [];
    return {
        summaryStats: {
            totalAUM: data.totalAUM,
            clientGainLoss: data.clientGainLoss,
            totalClients: data.totalPMSClients
        },
        assetAllocation: data.assetAllocation || [],
        assetAllocationGain: data.assetAllocationGain || [],
        assetAllocationLoss: data.assetAllocationLoss || [],
        sectorAllocation: data.sectorAllocation || [],
        sectorAllocationGain: data.sectorAllocationGain || [],
        sectorAllocationLoss: data.sectorAllocationLoss || [],
        yearsToExpiryChartData,
        highestEquityToCashRatio: data.highestEquityToCashRatio,
        lowestEquityToCashRatio: data.lowestEquityToCashRatio,
    };
  }, [dashboardData]);

  const gainLoss = summaryStats.clientGainLoss || { gain: 0, loss: 0, neutral: 0 };

  return (
    <div className="grid gap-6 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DataCard title="Total AUM" value={formatCurrency(summaryStats.totalAUM || 0)} icon={DollarSign} description="Total Assets Under Management" />
        
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart 
            title="Asset Allocation" 
            data={assetAllocation} 
            icon={Banknote} 
            showRatio={true}
            highestRatio={highestEquityToCashRatio}
            lowestRatio={lowestEquityToCashRatio}
        />
        <AllocationPieChart title="Sector-wise Allocation" data={sectorAllocation} icon={PieChartIcon} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart title="Asset Allocation (Gain)" data={assetAllocationGain} icon={TrendingUp} />
        <AllocationPieChart title="Sector-wise Allocation For Gain" data={sectorAllocationGain} icon={ArrowUpCircle} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationPieChart title="Asset Allocation (Loss)" data={assetAllocationLoss} icon={TrendingDown} />
        <AllocationPieChart title="Sector-wise Allocation For Loss" data={sectorAllocationLoss} icon={ArrowDownCircle} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glassmorphic col-span-1">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChart className="text-accent"/> Years to Expiry</CardTitle>
          </CardHeader>
          <CardContent>
          <ChartContainer config={{}} className="h-64 w-full">
              <ResponsiveContainer>
                <RechartsBarChart data={yearsToExpiryChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
