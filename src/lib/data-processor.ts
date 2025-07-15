
'use client';

import * as XLSX from 'xlsx';

// Type definitions for each worksheet
export interface SummaryData {
  clientId: string;
  totalValue: number;
  gainLoss: number;
  expiryDate?: Date; // Added for expiry calculation
  [key: string]: any;
}

export interface SectorHoldingData {
  sector: string;
  allocation: number;
  [key:string]: any;
}

export interface HoldingStatementData {
  clientId: string;
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

export interface SectorAllocation {
    sector: string;
    allocation: number;
}

export interface ClientDetails {
    name: string;
    totalValue: number;
    gainLoss: number;
    expiryDate?: Date;
    sectorAllocations: { sector: string; value: number }[];
    portfolioData: { header: string; value: any }[];
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
  sectorAllocation: SectorAllocation[];
  sectorAllocationGain: SectorAllocation[];
  sectorAllocationLoss: SectorAllocation[];
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
    const epsData = this.processEPSSheet();
    const clientData = this.processClientDataSheet();

    const { sectorAllocationGain, sectorAllocationLoss } = this.calculateSectorAllocationsByGainLoss();

    return {
      totalPMSClients: this.calculateTotalPMSClients(summaryData),
      totalAUM: this.calculateTotalAUM(summaryData),
      clientGainLoss: this.calculateClientGainLoss(summaryData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(summaryData),
      sectorAllocation: this.calculateSectorAllocation(sectorData),
      sectorAllocationGain,
      sectorAllocationLoss,
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
        clientId: row[2], // Client Name is in Column C
        totalValue: this.parseNumber(row[16]), // Column Q
        gainLoss: this.parseNumber(row[17]),   // Column R
        expiryDate: row[4] instanceof Date ? row[4] : undefined, // Column E
      };
    }).filter(Boolean) as SummaryData[];
  }

  /**
   * Process Sector Holding Summary worksheet
   */
  private processSectorHoldingSheet(): SectorHoldingData[] {
    const sheetData = this.getSheetData('Sector Holding Summary');
    if (sheetData.length < 2) return [];

    const headers = sheetData[1] as string[]; // Headers from Row 2
    const lastRow = sheetData[sheetData.length - 1];
    const sectorData: SectorHoldingData[] = [];

    // Columns C to P correspond to indices 2 to 15
    for (let i = 2; i <= 15; i++) {
      const sector = headers[i];
      const allocation = this.parseNumber(lastRow[i]);
      if (sector) {
        sectorData.push({ sector, allocation });
      }
    }
    
    return sectorData;
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
    const totalAUM = summaryData.reduce((total, client) => total + (client.totalValue || 0), 0);
    return totalAUM / 2;
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
   * Calculate years to expiry buckets from Portfolio sheet
   */
  private calculateYearsToExpiryBuckets(summaryData: SummaryData[]): {
    '0-1': number;
    '1-3': number;
    '3-5': number;
    '5+': number;
  } {
    const buckets = { '0-1': 0, '1-3': 0, '3-5': 0, '5+': 0 };

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 56);
    futureDate.setMonth(futureDate.getMonth() + 8);
    futureDate.setDate(futureDate.getDate() + 15);
    futureDate.setHours(0, 0, 0, 0);

    summaryData.forEach(item => {
      if (!item.expiryDate || !(item.expiryDate instanceof Date)) return;
      
      const sheetDate = item.expiryDate;
      sheetDate.setHours(0, 0, 0, 0);

      const diffTime = futureDate.getTime() - sheetDate.getTime();

      if (diffTime > 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = diffDays / 365.25;
        
        if (years <= 1) buckets['0-1']++;
        else if (years <= 3) buckets['1-3']++;
        else if (years <= 5) buckets['3-5']++;
        else if (years > 5) buckets['5+']++;
      }
    });
    return buckets;
  }

  /**
   * Calculate sector allocation
   */
  private calculateSectorAllocation(sectorData: SectorHoldingData[]): SectorAllocation[] {
    return sectorData
      .filter(sector => sector.allocation > 0)
      .sort((a, b) => b.allocation - a.allocation);
  }

  private calculateSectorAllocationsByGainLoss(): {
    sectorAllocationGain: SectorAllocation[],
    sectorAllocationLoss: SectorAllocation[]
  } {
      const sheetData = this.getSheetData('Sector Holding Summary');
      if (sheetData.length < 3) {
          return { sectorAllocationGain: [], sectorAllocationLoss: [] };
      }

      const headers = sheetData[1] as string[]; // Headers from Row 2
      const gainAllocation: { [sector: string]: number } = {};
      const lossAllocation: { [sector: string]: number } = {};

      // Initialize allocations from headers (C to P, indices 2 to 15)
      for (let i = 2; i <= 15; i++) {
        const sector = headers[i];
        if (sector) {
          gainAllocation[sector] = 0;
          lossAllocation[sector] = 0;
        }
      }
      
      // Iterate over each client row, starting from the 3rd row (index 2) up to the second to last row
      for (let rowIndex = 2; rowIndex < sheetData.length -1; rowIndex++) {
        const row = sheetData[rowIndex] as any[];
        if (!row || row.length === 0) continue;

        const gainLossValue = this.parseNumber(row[17]); // Column R

        let targetAllocation: { [sector: string]: number } | null = null;
        if (gainLossValue > 0) {
            targetAllocation = gainAllocation;
        } else if (gainLossValue < 0) {
            targetAllocation = lossAllocation;
        }

        if (targetAllocation) {
            for (let colIndex = 2; colIndex <= 15; colIndex++) { // Columns C to P
                const sector = headers[colIndex];
                if (sector) {
                    targetAllocation[sector] += this.parseNumber(row[colIndex]);
                }
            }
        }
      }
      
      const formatAndSort = (allocation: { [sector: string]: number }): SectorAllocation[] => {
          return Object.entries(allocation)
              .map(([sector, value]) => ({ sector, allocation: value }))
              .filter(item => item.allocation > 0)
              .sort((a, b) => b.allocation - a.allocation);
      };

      return {
          sectorAllocationGain: formatAndSort(gainAllocation),
          sectorAllocationLoss: formatAndSort(lossAllocation)
      };
  }

   /**
   * Get all client names from Portfolio sheet, column C.
   */
  public getClientNames(): string[] {
    const sheetData = this.getSheetData('Portfolio');
    if (sheetData.length < 2) return [];
    
    const clientNames = sheetData
      .slice(1) // Skip header row
      .map(row => row[2]) // Column C
      .filter(name => typeof name === 'string' && name.trim() !== '');
      
    return [...new Set(clientNames)].sort(); // Return unique, sorted names
  }

  /**
   * Get all data for a specific client.
   */
  public getDataForClient(clientName: string): ClientDetails | null {
    if (!this.workbook) return null;

    const portfolioSheet = this.getSheetData('Portfolio');
    const portfolioHeaders = portfolioSheet[0] as string[];
    const clientRowPortfolio = portfolioSheet.find(row => row[2] === clientName);

    if (!clientRowPortfolio) return null;

    const totalValue = this.parseNumber(clientRowPortfolio[16]); // Col Q
    const gainLoss = this.parseNumber(clientRowPortfolio[17]); // Col R
    const expiryDate = clientRowPortfolio[4] instanceof Date ? clientRowPortfolio[4] : undefined; // Col E

    const sectorSheet = this.getSheetData('Sector Holding Summary');
    const sectorHeaders = sectorSheet[1] as string[];
    const clientRowSector = sectorSheet.find(row => row[1] === clientName); // Match by client name in Column B
    
    let sectorAllocations: { sector: string; value: number }[] = [];
    if (clientRowSector) {
        for (let i = 2; i <= 15; i++) { // Columns C to P
            const sector = sectorHeaders[i];
            const value = this.parseNumber(clientRowSector[i]);
            if (sector && value > 0) {
                sectorAllocations.push({ sector, value });
            }
        }
    }
    
    const portfolioData = portfolioHeaders.map((header, index) => ({
        header,
        value: clientRowPortfolio[index],
    }));

    return {
        name: clientName,
        totalValue,
        gainLoss,
        expiryDate,
        sectorAllocations,
        portfolioData,
    };
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
