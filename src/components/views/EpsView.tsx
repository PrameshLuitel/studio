'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

export const EpsView = () => {
  const { sheets } = useContext(AppContext);
  const epsSheetName = 'EPS';

  const chartData = useMemo(() => {
    if (!sheets || !sheets[epsSheetName]) return [];
    
    return sheets[epsSheetName]
      .map(row => {
        const date = new Date(row.Date);
        const eps = Number(row.EPS);
        if (isNaN(date.getTime()) || isNaN(eps)) return null;
        return { date, eps };
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime());
  }, [sheets]);

  if (chartData.length === 0) {
    return <div className="text-center text-muted-foreground">EPS data not found or is invalid. Please ensure your file has a sheet named 'EPS' with 'Date' and 'EPS' columns.</div>;
  }

  const chartConfig = {
    eps: {
      label: "EPS",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="animate-in fade-in-50">
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><TrendingUp className="text-accent" /> EPS Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-96 w-full">
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(tick) => format(tick, 'MMM yy')}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis 
                                tickFormatter={(tick) => `$${tick.toFixed(2)}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip 
                                content={<ChartTooltipContent
                                    formatter={(value, name, item) => (
                                        <div className="flex flex-col">
                                            <span>{format(item.payload.date, 'PPP')}</span>
                                            <span>EPS: ${Number(value).toFixed(2)}</span>
                                        </div>
                                    )}
                                />} 
                            />
                            <Line type="monotone" dataKey="eps" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
};
