
'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, PieChart as PieChartIcon, BarChart } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="glassmorphic"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
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


export const DashboardView = () => {
  const { excelProcessor, isLoading } = useContext(AppContext);

  const metrics = useMemo(() => {
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
  
  if (!metrics) {
    return <ErrorDisplay />;
  }
  
  const { totalAUM, clientGainLoss, totalPMSClients } = metrics;
  const summaryStats = {
    totalAUM: totalAUM || 0,
    clientGainLoss: clientGainLoss || { gain: 0, loss: 0, neutral: 0 },
    totalClients: totalPMSClients || 0
  };
  const sectorChartData = Array.isArray(metrics.sectorAllocation) ? metrics.sectorAllocation.map(s => ({ name: s.sector, value: s.allocation })) : [];
  const yearsToExpiryChartData = metrics.yearsToExpiryBuckets ? Object.entries(metrics.yearsToExpiryBuckets).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="grid gap-6 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DataCard title="Total AUM" value={`${summaryStats.totalAUM.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`} icon={DollarSign} description="Total Assets Under Management" />
        <DataCard title="Client Gain/Loss" value={`${summaryStats.clientGainLoss.gain} Gained / ${summaryStats.clientGainLoss.loss} Lost`} icon={TrendingUp} description={`${summaryStats.clientGainLoss.neutral} Neutral`} />
        <DataCard title="Active Clients" value={summaryStats.totalClients.toString()} icon={Users} description="Total number of clients" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon className="text-accent"/> Sector-wise Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64 w-full">
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={sectorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text> : null;
                    }}>
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glassmorphic">
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
