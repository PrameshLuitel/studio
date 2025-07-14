
'use client';

import React, { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

export const ClientDataView = () => {
  const { excelProcessor } = useContext(AppContext);

  const { data, headers } = useMemo(() => {
    if (!excelProcessor || !excelProcessor.isDataLoaded()) {
      return { data: [], headers: [] };
    }
    const processedData = excelProcessor.getProcessedData();
    if (!processedData || !processedData.clientData) {
      return { data: [], headers: [] };
    }
    const { headers: tableHeaders, data: tableData } = processedData.clientData;
    return { data: tableData, headers: tableHeaders };
  }, [excelProcessor]);

  if (data.length === 0) {
    return <div className="text-center text-muted-foreground">Portfolio data not found or is empty. Please ensure your file has a sheet named 'Portfolio'.</div>;
  }

  return (
    <Card className="glassmorphic h-full w-full overflow-hidden animate-in fade-in-50">
      <ScrollArea className="h-full">
        <Table>
          <TableHeader className="sticky top-0 bg-primary/10 backdrop-blur-sm">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-bold text-primary">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {row[cellIndex] instanceof Date ? row[cellIndex].toLocaleDateString() : row[cellIndex]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};
