
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export const StockDataView = () => {
  return (
    <div className="animate-in fade-in-50">
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><BarChart className="text-accent" /> Stock Data</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This is the placeholder for the Stock Data view.</p>
            </CardContent>
        </Card>
    </div>
  );
};
