
'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, PieChart as PieChartIcon, BarChart } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const COLORS = ['#4B0082', '#8F00FF', '#9370DB', '#BA55D3', '#C71585'];

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

export const DashboardView = () => {
  const { sheets } = useContext(AppContext);
  const portfolioSheet = 'Portfolio';

  const metrics = useMemo(() => {
    if (!sheets || !sheets[portfolioSheet]) {
      return null;
    }

    const data = sheets[portfolioSheet].filter(row => row && typeof row['Client Name'] !== 'undefined' && row['Client Name'] !== null && String(row['Client Name']).trim() !== '');

    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const totalAUM = data.reduce((acc, row) => acc + (Number(row['AUM (USD)']) || 0), 0);
    const totalGainLoss = data.reduce((acc, row) => acc + (Number(row['Gain/Loss (USD)']) || 0), 0);
    const clientCount = data.length;

    const sectorAllocation = data.reduce((acc, row) => {
        const sector = row['Sector'] || 'Uncategorized';
        const aum = Number(row['AUM (USD)']) || 0;
        acc[sector] = (acc[sector] || 0) + aum;
        return acc;
    }, {} as { [key: string]: number });
    
    const sectorChartData = Object.entries(sectorAllocation).map(([name, value]) => ({ name, value }));

    const expiryBuckets = data.reduce((acc, row) => {
      const expiryCell = row['Expiry'];
      let expiryDate: Date | null = null;
      if (expiryCell instanceof Date) {
        expiryDate = expiryCell;
      } else if (typeof expiryCell === 'number') {
        expiryDate = new Date(Date.UTC(1899, 11, 30 + expiryCell));
      }
      
      if (expiryDate && !isNaN(expiryDate.getTime())) {
          const years = (expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24 * 365);
          let bucket = '5+ Years';
          if (years < 1) bucket = '< 1 Year';
          else if (years < 3) bucket = '1-3 Years';
          else if (years < 5) bucket = '3-5 Years';
          acc[bucket] = (acc[bucket] || 0) + 1;
      }
      return acc;
    }, { '< 1 Year': 0, '1-3 Years': 0, '3-5 Years': 0, '5+ Years': 0 } as { [key: string]: number });
    
    const expiryChartData = Object.entries(expiryBuckets).map(([name, count]) => ({ name, count }));

    return { totalAUM, totalGainLoss, clientCount, sectorChartData, expiryChartData };
  }, [sheets]);


  if (!sheets || !sheets[portfolioSheet]) {
    return <div className="text-center text-muted-foreground">Portfolio data not found or is empty. Please ensure your file has a sheet named 'Portfolio' with relevant data.</div>;
  }
  
  if (!metrics) {
    return <div className="text-center text-muted-foreground">Could not compute metrics. Check column names: 'Client Name', 'AUM (USD)', 'Gain/Loss (USD)', 'Sector', and 'Expiry'.</div>;
  }

  return (
    <div className="grid gap-6 animate-in fade-in-50">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DataCard title="Total AUM" value={`$${metrics.totalAUM.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} icon={DollarSign} description="Total Assets Under Management" />
        <DataCard title="Total Gain/Loss" value={`$${metrics.totalGainLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} icon={TrendingUp} description="Net profit from all assets" />
        <DataCard title="Active Clients" value={metrics.clientCount.toString()} icon={Users} description="Total number of clients" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon className="text-accent"/> Sector-wise Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={metrics.sectorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{(percent * 100).toFixed(0)}%</text> : null;
                    }}>
                    {metrics.sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChart className="text-accent"/> Years to Expiry</CardTitle>
          </Header>
          <CardContent>
          <ChartContainer config={{}} className="h-64 w-full">
              <ResponsiveContainer>
                <RechartsBarChart data={metrics.expiryChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
