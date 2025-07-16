
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
    gainLossPercentage: number;
    expiryDate?: Date;
    sectorAllocations: { sector: string; value: number }[];
    portfolioData: { header: string; value: any }[];
}

export interface EPSSheetData {
    headers: string[];
    data: any[][];
}

export interface RatioInfo {
    clientName: string;
    ratio: number;
}
  
export interface EquityCashRatioStats {
    highest: RatioInfo | null;
    lowest: RatioInfo | null;
    stdDev: number;
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
  assetAllocation: SectorAllocation[];
  assetAllocationGain: SectorAllocation[];
  assetAllocationLoss: SectorAllocation[];
  sectorAllocation: SectorAllocation[];
  sectorAllocationGain: SectorAllocation[];
  sectorAllocationLoss: SectorAllocation[];
  epsData: EPSData[];
  epsSheetData: EPSSheetData | null;
  clientData: ClientData | null;
  equityToCashRatioStats: EquityCashRatioStats;
  equityToCashRatioStatsGain: EquityCashRatioStats;
  equityToCashRatioStatsLoss: EquityCashRatioStats;
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
    const epsSheetData = this.processEPSSheetRaw();
    const clientData = this.processClientDataSheet();

    const { sectorAllocationGain, sectorAllocationLoss } = this.calculateSectorAllocationsByGainLoss();
    const { assetAllocationGain, assetAllocationLoss } = this.calculateAssetAllocationByGainLoss();

    const sheetData = this.getSheetData('Portfolio');
    const headers = sheetData.length > 1 ? (sheetData[1] as string[]) : [];
    const clientRows = sheetData.length > 2 ? sheetData.slice(2) : [];
    
    const gainLossHeaderName = "Gain/(LOSS) IN pORTFOLIO".toLowerCase();
    const gainLossIndex = headers.findIndex(h => h && h.trim().toLowerCase() === gainLossHeaderName);

    const gainClients: any[][] = [];
    const lossClients: any[][] = [];

    if (gainLossIndex !== -1) {
        for (const row of clientRows) {
            if (!row || row.length === 0 || !row[2]) continue;
            const gainLossValue = this.parseNumber(row[gainLossIndex]);
            if (gainLossValue > 0) {
                gainClients.push(row);
            } else if (gainLossValue < 0) {
                lossClients.push(row);
            }
        }
    }
    
    return {
      totalPMSClients: this.calculateTotalPMSClients(summaryData),
      totalAUM: this.calculateTotalAUM(summaryData),
      clientGainLoss: this.calculateClientGainLoss(summaryData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(summaryData),
      assetAllocation: this.calculateAssetAllocation(),
      assetAllocationGain,
      assetAllocationLoss,
      sectorAllocation: this.calculateSectorAllocation(sectorData),
      sectorAllocationGain,
      sectorAllocationLoss,
      epsData,
      epsSheetData,
      clientData,
      equityToCashRatioStats: this.calculateEquityToCashRatiosForGroup(clientRows),
      equityToCashRatioStatsGain: this.calculateEquityToCashRatiosForGroup(gainClients, false),
      equityToCashRatioStatsLoss: this.calculateEquityToCashRatiosForGroup(lossClients, false),
    };
  }
  
  private getSheetData(sheetName: string): any[][] {
      const sheet = this.workbook!.Sheets[sheetName];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  }

   /**
   * Utility to parse dates that might be strings (e.g., "dd/mm/yyyy") or Date objects
   */
  private parseDate(value: any): Date | undefined {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        // Assuming dd/mm/yyyy
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    return undefined;
  }
  
  /**
   * Process Portfolio worksheet
   */
  private processSummarySheet(): SummaryData[] {
    const jsonData = this.getSheetData('Portfolio');
    // Data starts from the 3rd row (index 2)
    return jsonData.slice(2).map((row: any) => {
      if (!row || row.length === 0 || !row[2]) return null;
      return {
        clientId: row[2], // Client Name is in Column C
        totalValue: this.parseNumber(row[16]), // Column Q
        gainLoss: this.parseNumber(row[17]),   // Column R is a percentage, used here for gain/loss status
        expiryDate: this.parseDate(row[4]), // Column E
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
          headers: data[1] as string[], // Headers are on the 2nd row
          data: data.slice(2) as (string | number | Date)[][],
      };
  }

  private processEPSSheetRaw(): EPSSheetData | null {
    const sheetData = this.getSheetData('EPS');
    if (sheetData.length === 0) return null;
    const headers = sheetData[0] as string[];
    const data = sheetData.slice(1);
    return { headers, data };
  }

  /**
   * Calculate total PMS clients
   */
  private calculateTotalPMSClients(summaryData: SummaryData[]): number {
    return summaryData.filter(client => client.clientId && String(client.clientId).trim() !== '').length;
  }

  /**
   * Calculate total AUM from column Q
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

      if (diffTime >= 0) {
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
  
  private calculateAssetAllocation(): SectorAllocation[] {
    const sheetData = this.getSheetData('Portfolio');
    if (sheetData.length < 3) return [];

    const clientRows = sheetData.slice(2, -1); // Exclude header and grand total row

    const sumG = clientRows.reduce((acc, row) => acc + this.parseNumber(row[6]), 0);
    const sumH = clientRows.reduce((acc, row) => acc + this.parseNumber(row[7]), 0);
    const sumJ = clientRows.reduce((acc, row) => acc + this.parseNumber(row[9]), 0);
    const sumK = clientRows.reduce((acc, row) => acc + this.parseNumber(row[10]), 0);

    const equity = sumG / 2;
    const cash = (sumH / 2) + (sumK / 2) - (sumJ / 2);
  
    const assetAllocation: SectorAllocation[] = [];
  
    if (cash > 0) {
      assetAllocation.push({ sector: 'Cash', allocation: cash });
    }
    if (equity > 0) {
      assetAllocation.push({ sector: 'Equity', allocation: equity });
    }
  
    return assetAllocation;
  }

  private calculateAssetAllocationByGainLoss(): {
    assetAllocationGain: SectorAllocation[];
    assetAllocationLoss: SectorAllocation[];
  } {
    const sheetData = this.getSheetData('Portfolio');
    if (sheetData.length < 3) return { assetAllocationGain: [], assetAllocationLoss: [] };
  
    const headers = sheetData[1] as string[]; // Headers are in the second row (index 1)
    const clientRows = sheetData.slice(2); // Data starts from the third row (index 2)
  
    const gainLossHeaderName = "Gain/(LOSS) IN pORTFOLIO".toLowerCase();
    const gainLossIndex = headers.findIndex(h => h && h.trim().toLowerCase() === gainLossHeaderName);
    
    // Hardcoded indices for G, H, J, K
    const colGIndex = 6;
    const colHIndex = 7;
    const colJIndex = 9;
    const colKIndex = 10;
  
    if (gainLossIndex === -1) {
        console.warn(`Column '${gainLossHeaderName}' not found for Asset Allocation by Gain/Loss.`);
        return { assetAllocationGain: [], assetAllocationLoss: [] };
    }

    const gainTotals = { sumG: 0, sumH: 0, sumJ: 0, sumK: 0 };
    const lossTotals = { sumG: 0, sumH: 0, sumJ: 0, sumK: 0 };
  
    for (const row of clientRows) {
      if (!row || row.length === 0 || !row[2]) continue; // Skip empty or total rows
  
      const gainLossValue = this.parseNumber(row[gainLossIndex]);
      let targetTotals;
  
      if (gainLossValue > 0) {
        targetTotals = gainTotals;
      } else if (gainLossValue < 0) {
        targetTotals = lossTotals;
      } else {
        continue; // Skip neutral clients
      }
  
      targetTotals.sumG += this.parseNumber(row[colGIndex]);
      targetTotals.sumH += this.parseNumber(row[colHIndex]);
      targetTotals.sumJ += this.parseNumber(row[colJIndex]);
      targetTotals.sumK += this.parseNumber(row[colKIndex]);
    }
  
    const createAllocation = (totals: typeof gainTotals): SectorAllocation[] => {
      const equity = totals.sumG / 2;
      const cash = (totals.sumH / 2) + (totals.sumK / 2) - (totals.sumJ / 2);
  
      const allocation: SectorAllocation[] = [];
      if (cash > 0) {
        allocation.push({ sector: 'Cash', allocation: cash });
      }
      if (equity > 0) {
        allocation.push({ sector: 'Equity', allocation: equity });
      }
      return allocation;
    };
  
    return {
      assetAllocationGain: createAllocation(gainTotals),
      assetAllocationLoss: createAllocation(lossTotals),
    };
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
    if (!this.processedData?.clientData) return [];

    const clientNameIndex = this.processedData.clientData.headers.findIndex(h => h === 'Client Name');
    if (clientNameIndex === -1) return [];

    const clientNames = this.processedData.clientData.data
      .map(row => row[clientNameIndex])
      .filter(name => typeof name === 'string' && name.trim() !== '');

    return [...new Set(clientNames)].sort() as string[];
  }

  /**
   * Get all data for a specific client.
   */
  public getDataForClient(clientName: string): ClientDetails | null {
    if (!this.workbook || !this.processedData?.clientData) return null;
    
    const clientData = this.processedData.clientData;
    const clientNameIndex = clientData.headers.findIndex(h => h === 'Client Name');
    if (clientNameIndex === -1) return null;

    const clientRowPortfolio = clientData.data.find(row => row[clientNameIndex] === clientName);
    if (!clientRowPortfolio) return null;

    const totalValueIndex = clientData.headers.findIndex(h => h === 'Present value'); // Column Q
    const gainLossPercentageIndex = clientData.headers.findIndex(h => h === 'Unrealised gain / (loss) %'); // Column R
    const expiryDateIndex = clientData.headers.findIndex(h => h === 'Expiry'); // Column E
    
    const totalValue = totalValueIndex !== -1 ? this.parseNumber(clientRowPortfolio[totalValueIndex]) : 0;
    const gainLossPercentage = gainLossPercentageIndex !== -1 ? this.parseNumber(clientRowPortfolio[gainLossPercentageIndex]) : 0;
    const gainLoss = totalValue * gainLossPercentage;
    const expiryDate = expiryDateIndex !== -1 ? this.parseDate(clientRowPortfolio[expiryDateIndex]) : undefined;


    const sectorSheet = this.getSheetData('Sector Holding Summary');
    const sectorHeaders = sectorSheet[1] as string[];
    // Find client row in sector sheet by name in column B (index 1)
    const clientRowSector = sectorSheet.find(row => row[1] === clientName);
    
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
    
    const portfolioData = clientData.headers.map((header, index) => ({
        header,
        value: clientRowPortfolio[index],
    })).filter(item => item.value !== undefined && item.value !== null && item.value !== '');

    return {
        name: clientName,
        totalValue,
        gainLoss,
        gainLossPercentage,
        expiryDate,
        sectorAllocations,
        portfolioData,
    };
  }
  
  private calculateEquityToCashRatiosForGroup(clientRows: any[][], includeStdDev = true): EquityCashRatioStats {
    if (clientRows.length === 0) return { highest: null, lowest: null, stdDev: 0 };
  
    const ratios: number[] = [];
    let highest: RatioInfo = { clientName: '', ratio: -Infinity };
    let lowest: RatioInfo = { clientName: '', ratio: Infinity };
  
    for (const row of clientRows) {
        const clientName = row[2];
        if (!clientName || typeof clientName !== 'string') continue;

        const g = this.parseNumber(row[6]);
        const h = this.parseNumber(row[7]);
        const j = this.parseNumber(row[9]);
        const k = this.parseNumber(row[10]);

        const equity = g / 2;
        const cash = (h / 2) + (k / 2) - (j / 2);
        const total = equity + cash;

        if (total > 0) {
            const ratio = equity / total;
            ratios.push(ratio);

            if (ratio > highest.ratio) {
                highest = { clientName, ratio };
            }
            if (ratio < lowest.ratio) {
                lowest = { clientName, ratio };
            }
        }
    }

    if (ratios.length === 0) {
        return { highest: null, lowest: null, stdDev: 0 };
    }

    let stdDev = 0;
    if (includeStdDev) {
        const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratios.length;
        stdDev = Math.sqrt(variance);
    }
    
    return {
        highest: highest.ratio > -Infinity ? highest : null,
        lowest: lowest.ratio < Infinity ? lowest : null,
        stdDev: stdDev,
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
