
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
  Date: Date | string;
  EPS: number;
  [key: string]: any;
}

export interface ClientData {
    headers: string[];
    data: (string | number | Date)[][];
}


// Processed data interfaces
export interface ProcessedData {
  totalPMSClients: number;
  totalAUM: number;
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
  epsData: EPSData[];
  clientData: ClientData | null;
}

// Error types
export class ExcelProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelProcessingError';
  }
}

// Main Excel processor class
export class ExcelDataProcessor {
  private workbook: XLSX.WorkBook | null = null;
  private processedData: ProcessedData | null = null;

  constructor() {}

  /**
   * Load and parse Excel file
   */
  async loadExcelFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      this.validateWorkbook();
      this.processedData = this.processWorkbook();
    } catch (error) {
      if (error instanceof ExcelProcessingError) {
        throw error;
      }
      throw new ExcelProcessingError(
        `Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate that required worksheets exist
   */
  private validateWorkbook(): void {
    if (!this.workbook) {
      throw new ExcelProcessingError('No workbook loaded');
    }

    const requiredSheets = [
      'Portfolio',
      'Sector Holding Summary',
      'EPS',
      'Investment Return Report'
    ];

    const availableSheets = this.workbook.SheetNames;
    const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));

    if (missingSheets.length > 0) {
      throw new ExcelProcessingError(
        `Missing required worksheets: ${missingSheets.join(', ')}`
      );
    }
  }

  /**
   * Process all worksheets and calculate metrics
   */
  private processWorkbook(): ProcessedData {
    if (!this.workbook) {
      throw new ExcelProcessingError('No workbook loaded');
    }

    const summaryData = this.processSummarySheet();
    const sectorData = this.processSectorHoldingSheet();
    const investmentReturnData = this.processInvestmentReturnSheet();
    const epsData = this.processEPSSheet();
    const clientData = this.processClientDataSheet();

    return {
      totalPMSClients: this.calculateTotalPMSClients(summaryData),
      totalAUM: this.calculateTotalAUM(summaryData),
      clientGainLoss: this.calculateClientGainLoss(summaryData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(investmentReturnData),
      sectorAllocation: this.calculateSectorAllocation(sectorData),
      epsData,
      clientData
    };
  }
  
  private getSheetData(sheetName: string): any[][] {
      const sheet = this.workbook!.Sheets[sheetName];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  /**
   * Process Portfolio worksheet
   */
  private processSummarySheet(): SummaryData[] {
    const jsonData = this.getSheetData('Portfolio');
    return jsonData.slice(1).map((row: any) => {
      if (!row || row.length === 0) return null;
      return {
        clientId: row[0],
        totalValue: this.parseNumber(row[16]), // Column Q
        gainLoss: this.parseNumber(row[17]),   // Column R
      };
    }).filter(Boolean) as SummaryData[];
  }

  /**
   * Process Sector Holding Summary worksheet
   */
  private processSectorHoldingSheet(): SectorHoldingData[] {
    const jsonData = this.getSheetData('Sector Holding Summary');
    return jsonData.slice(1).map((row: any) => {
       if (!row || row.length === 0) return null;
       return {
         sector: row[0],
         allocation: this.parseNumber(row[2]), // Column C
       };
    }).filter(Boolean) as SectorHoldingData[];
  }

  /**
   * Process Investment Return Report worksheet
   */
  private processInvestmentReturnSheet(): InvestmentReturnData[] {
    const jsonData = this.getSheetData('Investment Return Report');
    const today = new Date();
    // Set time to 0 to compare dates only
    today.setHours(0, 0, 0, 0);

    return jsonData.slice(1).map((row: any) => {
      if (!row || row.length === 0) return null;
      
      const maturityDate = row[4] instanceof Date ? row[4] : null; // Column E
      
      let yearsToExpiry = 0;
      if (maturityDate) {
          const diffTime = maturityDate.getTime() - today.getTime();
          if (diffTime > 0) {
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            yearsToExpiry = diffDays / 365.25;
          }
      }

      return {
        security: row[0],
        maturityDate: maturityDate ? maturityDate.toISOString() : '',
        yearsToExpiry: yearsToExpiry,
        returnRate: this.parseNumber(row[12]),
      };
    }).filter(Boolean) as InvestmentReturnData[];
  }

  /**
   * Process EPS worksheet
   */
  private processEPSSheet(): EPSData[] {
    const jsonData = this.getSheetData('EPS');
    return jsonData.slice(1).map((row: any) => {
      if (!row || row.length === 0) return null;
      return {
        Date: row[0],
        EPS: this.parseNumber(row[1]),
      };
    }).filter(d => d && d.Date && !isNaN(d.EPS)) as EPSData[];
  }
  
  private processClientDataSheet(): ClientData | null {
      const sheet = this.workbook!.Sheets['Portfolio'];
      if (!sheet) return null;
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (data.length < 2) return null;
      return {
          headers: data[0] as string[],
          data: data.slice(1) as (string | number | Date)[][],
      };
  }

  /**
   * Calculate total PMS clients
   */
  private calculateTotalPMSClients(summaryData: SummaryData[]): number {
    return summaryData.filter(client => client.clientId && String(client.clientId).trim() !== '').length;
  }

  /**
   * Calculate total AUM
   */
  private calculateTotalAUM(summaryData: SummaryData[]): number {
    return summaryData.reduce((total, client) => total + (client.totalValue || 0), 0);
  }

  /**
   * Calculate client gain vs loss
   */
  private calculateClientGainLoss(summaryData: SummaryData[]): {
    gain: number;
    loss: number;
    neutral: number;
  } {
    return summaryData.reduce((acc, client) => {
      const gainLoss = client.gainLoss || 0;
      if (gainLoss > 0) acc.gain++;
      else if (gainLoss < 0) acc.loss++;
      else acc.neutral++;
      return acc;
    }, { gain: 0, loss: 0, neutral: 0 });
  }

  /**
   * Calculate years to expiry buckets
   */
  private calculateYearsToExpiryBuckets(investmentData: InvestmentReturnData[]): {
    '0-1': number;
    '1-3': number;
    '3-5': number;
    '5+': number;
  } {
    const buckets = { '0-1': 0, '1-3': 0, '3-5': 0, '5+': 0 };
    investmentData.forEach(investment => {
      const years = investment.yearsToExpiry || 0;
      if (years > 0 && years <= 1) buckets['0-1']++;
      else if (years <= 3) buckets['1-3']++;
      else if (years <= 5) buckets['3-5']++;
      else if (years > 5) buckets['5+']++;
    });
    return buckets;
  }

  /**
   * Calculate sector allocation
   */
  private calculateSectorAllocation(sectorData: SectorHoldingData[]): Array<{
    sector: string;
    allocation: number;
  }> {
    return sectorData
      .filter(sector => sector.allocation > 0)
      .sort((a, b) => b.allocation - a.allocation);
  }
  
  /**
   * Utility function to parse numbers safely
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  getProcessedData(): ProcessedData | null {
    return this.processedData;
  }

  getAllSheetsRawData(): string {
    if (!this.workbook) return "{}";
    
    const rawForAI: {[key: string]: any} = {};

    this.workbook.SheetNames.forEach(sheetName => {
        rawForAI[sheetName] = this.getSheetData(sheetName);
    });

    return JSON.stringify(rawForAI, null, 2);
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
    maximumFractionDigits: 0
  }).format(amount);
};
