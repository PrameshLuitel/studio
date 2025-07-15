
'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { LineChart } from 'lucide-react';

export const EpsView = () => {
  const { excelProcessor } = useContext(AppContext);

  const epsSheetData = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) return null;
    const processed = excelProcessor.getProcessedData();
    return processed ? processed.epsSheetData : null;
  }, [excelProcessor]);

  if (!epsSheetData || epsSheetData.data.length === 0) {
    return <div className="text-center text-muted-foreground">EPS data not found or is invalid. Please ensure your file has a sheet named 'EPS'.</div>;
  }

  const { headers, data } = epsSheetData;

  const formatCell = (cellData: any) => {
    if (cellData instanceof Date) {
      return format(cellData, 'dd-MMM-yyyy');
    }
    if (typeof cellData === 'number') {
      return cellData.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(cellData);
  }

  return (
    <div className="animate-in fade-in-50">
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><LineChart className="text-accent" /> EPS Data</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[75vh]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                            <TableRow>
                                {headers.map((header, index) => (
                                    <TableHead key={index}>{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            {cell === null ? '' : formatCell(cell)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
};
