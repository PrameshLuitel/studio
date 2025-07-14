
'use client';

import * as XLSX from 'xlsx';

// Type definitions for each worksheet
export interface SummaryData {
  clientId: string;
  totalValue: number;
  gainLoss: number;
  [key: string]: any;
}

export interface SectorHoldingData {
  sector: string;
  allocation: number;
  [key: string]: any;
}

export interface HoldingStatementData {
  security: string;
  quantity: number;
  marketValue: number;
  sector: string;
  [key: string]: any;
}

export interface InvestmentReturnData {
  security: string;
  maturityDate: string;
  yearsToExpiry: number;
  returnRate: number;
  [key: string]: any;
}

export interface EPSData {
  Date: Date;
  EPS: number;
  [key: string]: any;
}

// A version of EPSData as it's represented in the user-provided processor
export interface CompanyEPSData {
    company: string;
    eps: number;
    sector: string;
    [key: string]: any;
}


// Processed data interfaces
export interface ProcessedData {
  totalPMSClients: number;
  totalAUM: number;
  profitRate: number;
  clientGainLoss: {
    gain: number;
    loss: number;
    neutral: number;
  };
  yearsToExpiryBuckets: {
    '0-1': number;
    '1-3': number;
    '3-5': number;
    '5+': number;
  };
  sectorAllocation: Array<{
    sector: string;
    allocation: number;
  }>;
  rawData: {
    Portfolio: any[];
    EPS: EPSData[];
    [key: string]: any[];
  };
}

// Error types
export class ExcelProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExcelProcessingError';
  }
}

// Main Excel processor class
export class ExcelDataProcessor {
  private workbook: XLSX.WorkBook | null = null;
  private processedData: ProcessedData | null = null;
  private allSheets: { [key: string]: any[] } = {};

  constructor() {}

  /**
   * Load and parse Excel file
   */
  async loadExcelFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      this.validateWorkbook();
      
      this.workbook.SheetNames.forEach(sheetName => {
        const worksheet = this.workbook!.Sheets[sheetName];
        this.allSheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      });

      this.processedData = this.processWorkbook();
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

  /**
   * Validate that required worksheets exist
   */
  private validateWorkbook(): void {
    if (!this.workbook) {
      throw new ExcelProcessingError('No workbook loaded', 'NO_WORKBOOK');
    }

    const requiredSheets = ['Portfolio', 'EPS'];
    const availableSheets = this.workbook.SheetNames;
    const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));

    if (missingSheets.length > 0) {
      throw new ExcelProcessingError(
        `Missing required worksheets: ${missingSheets.join(', ')}`,
        'MISSING_SHEETS'
      );
    }
  }
  
  /**
   * Process all worksheets and calculate metrics
   */
  private processWorkbook(): ProcessedData {
    if (!this.allSheets['Portfolio']) {
      throw new ExcelProcessingError('Portfolio sheet data is missing', 'MISSING_DATA');
    }

    const portfolioData = this.allSheets['Portfolio'];

    return {
      totalPMSClients: this.calculateTotalClients(portfolioData),
      totalAUM: this.calculateTotalAUM(portfolioData),
      clientGainLoss: this.calculateClientGainLoss(portfolioData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(portfolioData),
      sectorAllocation: this.calculateSectorAllocation(portfolioData),
      profitRate: 0, // Placeholder as logic might be different from user example
      rawData: this.allSheets,
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
  
  private calculateTotalAUM(data: any[]): number {
    return data.reduce((sum, row) => sum + this.parseNumber(row['AUM']), 0);
  }

  private calculateClientGainLoss(data: any[]): { gain: number, loss: number, neutral: number } {
    return data.reduce((acc, row) => {
      const gainLoss = this.parseNumber(row['Gain/Loss']);
      if (gainLoss > 0) acc.gain++;
      else if (gainLoss < 0) acc.loss++;
      else acc.neutral++;
      return acc;
    }, { gain: 0, loss: 0, neutral: 0 });
  }

  private calculateTotalClients(data: any[]): number {
      return data.length;
  }
  
  private calculateSectorAllocation(data: any[]): Array<{ sector: string; allocation: number }> {
    const allocation: { [key: string]: number } = {};
    data.forEach(row => {
      const sector = row['Sector'];
      const aum = this.parseNumber(row['AUM']);
      if (sector) {
        allocation[sector] = (allocation[sector] || 0) + aum;
      }
    });
    const totalAUM = this.calculateTotalAUM(data);
    return Object.entries(allocation).map(([sector, aum]) => ({
      sector,
      allocation: (aum / totalAUM) * 100,
    })).sort((a,b) => b.allocation - a.allocation);
  }
  
  private calculateYearsToExpiryBuckets(data: any[]): { '0-1': number; '1-3': number; '3-5': number; '5+': number; } {
      const buckets = { '0-1': 0, '1-3': 0, '3-5': 0, '5+': 0 };
      data.forEach(row => {
          const years = this.parseNumber(row['Years to Expiry']);
          if (years <= 1) buckets['0-1']++;
          else if (years <= 3) buckets['1-3']++;
          else if (years <= 5) buckets['3-5']++;
          else buckets['5+']++;
      });
      return buckets;
  }

  getSummaryStats() {
    if (!this.processedData) return null;
    return {
      totalAUM: this.processedData.totalAUM,
      clientGainLoss: this.processedData.clientGainLoss,
      totalClients: this.processedData.totalPMSClients,
    }
  }

  getSectorChartData() {
      if (!this.processedData) return null;
      return this.processedData.sectorAllocation.map(item => ({ name: item.sector, value: item.allocation }));
  }

  getYearsToExpiryChartData() {
      if (!this.processedData) return null;
      return Object.entries(this.processedData.yearsToExpiryBuckets).map(([name, value]) => ({ name, value }));
  }

  getAllSheetsRawData() {
    return this.allSheets;
  }

  isDataLoaded(): boolean {
    return this.processedData !== null;
  }
}
