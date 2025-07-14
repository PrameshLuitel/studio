
'use client';

import * as XLSX from 'xlsx';

export class ExcelProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExcelProcessingError';
  }
}

export class ExcelDataProcessor {
  private workbook: XLSX.WorkBook | null = null;
  private allSheets: { [key: string]: any[] } = {};
  private processedData: any | null = null;

  async loadExcelFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      this.validateWorkbook();
      
      this.workbook.SheetNames.forEach(sheetName => {
        const worksheet = this.workbook!.Sheets[sheetName];
        this.allSheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: 1 });
      });

      this.processWorkbook();
    } catch (error) {
      if (error instanceof ExcelProcessingError) {
        throw error;
      }
      throw new ExcelProcessingError(
        `Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LOAD_ERROR'
      );
    }
  }

  private validateWorkbook(): void {
    if (!this.workbook) {
      throw new ExcelProcessingError('No workbook loaded', 'NO_WORKBOOK');
    }
  }
  
  private processWorkbook(): void {
    if (!this.allSheets['Portfolio']) {
      // In a real app, you might want to check for all required sheets
      this.processedData = null; // Set to null if required data is missing
      return;
    }

    const portfolioData = this.allSheets['Portfolio'].slice(1); // Skip header row
    const epsData = this.allSheets['EPS'] ? this.allSheets['EPS'].slice(1) : [];

    this.processedData = {
      totalAUM: this.calculateTotalAUM(portfolioData),
      clientGainLoss: this.calculateClientGainLoss(portfolioData),
      totalPMSClients: portfolioData.length,
      sectorAllocation: this.calculateSectorChartData(portfolioData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryChartData(portfolioData),
      clientData: this.getClientData(),
      epsData: this.getEpsData(epsData),
      allSheetsRawData: this.getAllSheetsRawData()
    };
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  private calculateTotalAUM(data: any[][]): number {
    return data.reduce((sum, row) => sum + this.parseNumber(row[16]), 0); // Column Q is index 16 for AUM
  }

  private calculateClientGainLoss(data: any[][]): any {
    return data.reduce((acc, row) => {
        const gainLoss = this.parseNumber(row[17]); // Column R is index 17
        if (gainLoss > 0) acc.gain++;
        else if (gainLoss < 0) acc.loss++;
        else acc.neutral++;
        return acc;
    }, { gain: 0, loss: 0, neutral: 0 });
  }

  private calculateSectorChartData(data: any[][]): Array<{ sector: string, allocation: number }> {
    const allocation: { [key: string]: number } = {};
    const totalAUM = this.calculateTotalAUM(data);

    if (totalAUM === 0) return [];

    data.forEach(row => {
      const sector = row[8]; // Column I is index 8 for Sector
      const aum = this.parseNumber(row[16]); // Column Q for AUM
      if (sector && typeof sector === 'string') {
        allocation[sector] = (allocation[sector] || 0) + aum;
      }
    });
    
    return Object.entries(allocation).map(([sector, aum]) => ({
      sector: sector,
      allocation: (aum / totalAUM) * 100,
    })).sort((a,b) => b.allocation - a.allocation);
  }

  private calculateYearsToExpiryChartData(data: any[][]): { [key: string]: number } {
    const buckets = { '0-1': 0, '1-3': 0, '3-5': 0, '5+': 0 };
      data.forEach(row => {
          const years = this.parseNumber(row[12]); // Assuming Column M is 'Years to Expiry' (index 12)
          if (years <= 1) buckets['0-1']++;
          else if (years <= 3) buckets['1-3']++;
          else if (years <= 5) buckets['3-5']++;
          else buckets['5+']++;
      });
      return buckets;
  }

  private getClientData(): { headers: string[], data: any[][] } {
    const portfolioSheet = this.allSheets['Portfolio'];
    if (!portfolioSheet || portfolioSheet.length === 0) {
      return { headers: [], data: [] };
    }
    const headers = portfolioSheet[0];
    const data = portfolioSheet.slice(1);
    return { headers, data };
  }
  
  private getEpsData(epsSheetData: any[][]): any[] {
     if (!epsSheetData || epsSheetData.length === 0) return [];
     return epsSheetData.map(row => ({
        Date: row[0],
        EPS: this.parseNumber(row[1])
     })).filter(r => r.Date);
  }

  getProcessedData() {
    return this.processedData;
  }
  
  getAllSheetsRawData() {
    const rawData: { [key: string]: any[] } = {};
    for (const sheetName in this.allSheets) {
        const sheetData = this.allSheets[sheetName];
        if (sheetData.length > 0) {
            const headers = sheetData[0];
            const jsonData = sheetData.slice(1).map(row => {
                const obj: {[key: string]: any} = {};
                headers.forEach((header: string, index: number) => {
                    obj[header] = row[index];
                });
                return obj;
            });
            rawData[sheetName] = jsonData;
        }
    }
    return rawData;
  }


  isDataLoaded(): boolean {
    return this.processedData !== null;
  }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
