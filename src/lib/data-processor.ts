

'use client';

import * as XLSX from 'xlsx';

// Type definitions for each worksheet
export interface SummaryData {
  clientId: string;
  initialInvestment?: number;
  totalValue: number;
  gainLossPercentage: number;
  gainLossValue: number;
  portfolioGainLoss?: number;
  expiryDate?: Date; // Added for expiry calculation
  periodInvested?: { years: number; months: number };
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

export interface StockAllocation {
    stock: string;
    quantity: number;
    marketRate: number;
    marketValue: number;
    gain: number;
    equityWeight: number;
}

export interface ClientHolding {
    clientName: string;
    purchaseValue: number;
    marketValue: number;
    gainLossPercentage: number;
    eps: number;
    peRatio: number;
    stockWeightInPortfolio: number;
}

export interface StockSummaryData {
    stockName: string;
    marketRate: number;
    totalMarketValue: number;
    totalPurchaseValue: number;
    totalGainLoss: number;
    clientHoldings: ClientHolding[];
}


export interface ClientDetails {
    name: string;
    totalValue: number;
    gainLoss: number;
    gainLossPercentage: number;
    expiryDate?: Date;
    sectorAllocations: { sector: string; value: number }[];
    stockAllocations: StockAllocation[];
    portfolioData: { header: string; value: any }[];
    equityPercentage: number;
    cashPercentage: number;
}

export interface EPSSheetData {
    headers: string[];
    data: any[][];
}

export interface EquityCashRatioInfo {
  clientName: string;
  ratio: number;
}

export interface EquityCashRatioStats {
  highest: EquityCashRatioInfo | null;
  lowest: EquityCashRatioInfo | null;
}

export interface TopMover {
    clientId: string;
    value: number;
    percentage: number;
    totalValue: number;
}

export interface LargestPortfolio {
    clientId: string;
    totalValue: number;
    gainLossValue: number;
    gainLossPercentage: number;
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
  yearsToExpiryBuckets: { [key: string]: { value: number; count: number } };
  assetAllocation: SectorAllocation[];
  assetAllocationGain: SectorAllocation[];
  assetAllocationLoss: SectorAllocation[];
  sectorAllocation: SectorAllocation[];
  sectorAllocationGain: SectorAllocation[];
  sectorAllocationLoss: SectorAllocation[];
  epsData: EPSData[];
  epsSheetData: EPSSheetData | null;
  clientData: ClientData | null;
  summaryData: SummaryData[] | null;
  stockSummaryData: StockSummaryData[] | null;
  equityToCashRatioStats: EquityCashRatioStats;
  equityToCashRatioStatsGain: EquityCashRatioStats;
  equityToCashRatioStatsLoss: EquityCashRatioStats;
  topGainers: TopMover[];
  topLosers: TopMover[];
  largestPortfolios: LargestPortfolio[];
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
      'Holding Statement',
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
    const stockSummaryData = this.processStockData();

    const { sectorAllocationGain, sectorAllocationLoss } = this.calculateSectorAllocationsByGainLoss();
    const { assetAllocationGain, assetAllocationLoss } = this.calculateAssetAllocationByGainLoss();
    const {
      equityToCashRatioStats,
      equityToCashRatioStatsGain,
      equityToCashRatioStatsLoss
    } = this.calculateEquityToCashRatioStats();
    
    const { topGainers, topLosers } = this.calculateTopMovers(summaryData);
    const largestPortfolios = this.calculateLargestPortfolios(summaryData);

    return {
      totalPMSClients: this.calculateTotalPMSClients(summaryData),
      totalAUM: this.calculateTotalAUM(summaryData),
      clientGainLoss: this.calculateClientGainLoss(summaryData),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(clientData),
      assetAllocation: this.calculateAssetAllocation(),
      assetAllocationGain,
      assetAllocationLoss,
      sectorAllocation: this.calculateSectorAllocation(sectorData),
      sectorAllocationGain,
      sectorAllocationLoss,
      epsData,
      epsSheetData,
      clientData,
      summaryData,
      stockSummaryData,
      equityToCashRatioStats,
      equityToCashRatioStatsGain,
      equityToCashRatioStatsLoss,
      topGainers,
      topLosers,
      largestPortfolios,
    };
  }
  
  private getSheetData(sheetName: string): any[][] {
      const sheet = this.workbook!.Sheets[sheetName];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  }

   /**
   * Utility to parse dates that might be strings (e.g., "mm/dd/yyyy") or Date objects
   */
  private parseDate(value: any): Date | undefined {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        // Assuming mm/dd/yyyy format
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
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
    return jsonData.slice(2).map((row: any) => {
      if (!row || row.length === 0 || !row[2]) return null;
      const totalValue = this.parseNumber(row[23]); // Column X
      const initialInvestment = this.parseNumber(row[22]); // Column W
      const portfolioGainLoss = this.parseNumber(row[17]); // RAW value from Column R
      const gainLossPercentage = initialInvestment > 0 ? (totalValue - initialInvestment) / initialInvestment : 0;
      
      const pmsOpeningDate = this.parseDate(row[24]); // Column Y for "Period Invested"
      let periodInvested: { years: number; months: number } | undefined = undefined;
      if (pmsOpeningDate) {
        const now = new Date();
        const diffTime = now.getTime() - pmsOpeningDate.getTime();
        if (diffTime > 0) {
            const totalMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
            periodInvested = {
                years: Math.floor(totalMonths / 12),
                months: totalMonths % 12,
            };
        }
      }

      return {
        clientId: String(row[2]), // Client Name is in Column C
        initialInvestment: initialInvestment,
        totalValue: totalValue,
        gainLossPercentage: gainLossPercentage, 
        gainLossValue: totalValue - initialInvestment,
        portfolioGainLoss: portfolioGainLoss,
        expiryDate: this.parseDate(row[4]), // Column E
        periodInvested,
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

  private processStockData(): StockSummaryData[] {
    const holdingData = this.getSheetData('Holding Statement');
    if (holdingData.length < 4) return []; // Data starts from row 4

    const stockMap = new Map<string, {
        marketRate: number;
        totalMarketValue: number;
        totalPurchaseValue: number;
        clientHoldings: ClientHolding[];
    }>();

    // Data starts from the fourth row (index 3)
    for (const row of holdingData.slice(3)) {
        if (!row || !row[1]) continue; // Skip if no stock name in Column B
        const stockName = String(row[1]);

        if (stockName.toLowerCase().includes('stock name') || stockName.toLowerCase().includes('total')) continue;
        
        const marketRate = this.parseNumber(row[10]); // Column K
        const marketValue = this.parseNumber(row[12]); // Column M
        const purchaseValue = this.parseNumber(row[11]); // Column L

        if (!stockMap.has(stockName)) {
            stockMap.set(stockName, {
                marketRate: marketRate,
                totalMarketValue: 0,
                totalPurchaseValue: 0,
                clientHoldings: [],
            });
        }

        const stockEntry = stockMap.get(stockName)!;
        stockEntry.totalMarketValue += marketValue;
        stockEntry.totalPurchaseValue += purchaseValue;

        // Add client holding details
        const clientName = String(row[4]); // Column E
        const gainLossPercentage = this.parseNumber(row[13]); // Column N
        const eps = this.parseNumber(row[19]); // Column T
        const peRatio = this.parseNumber(row[20]); // Column U
        const portfolioValueForWeight = this.parseNumber(row[24]); // Column Y
        const stockWeightInPortfolio = portfolioValueForWeight > 0 ? (marketValue / portfolioValueForWeight) * 100 : 0;
        
        if (clientName) {
            stockEntry.clientHoldings.push({
                clientName,
                purchaseValue,
                marketValue,
                gainLossPercentage,
                eps,
                peRatio,
                stockWeightInPortfolio
            });
        }
    }
    
    return Array.from(stockMap.entries()).map(([stockName, data]) => ({
        stockName,
        marketRate: data.marketRate,
        totalMarketValue: data.totalMarketValue,
        totalPurchaseValue: data.totalPurchaseValue,
        totalGainLoss: data.totalMarketValue - data.totalPurchaseValue,
        clientHoldings: data.clientHoldings,
    }));
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
    return summaryData.filter(client => client.clientId && String(client.clientId).trim() !== '' && !String(client.clientId).includes('Grand Total')).length;
  }

  /**
   * Calculate total AUM from column X
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
      if (String(client.clientId).includes('Grand Total')) return acc;
      const gainLoss = client.gainLossValue || 0;
      if (gainLoss > 0) acc.gain++;
      else if (gainLoss < 0) acc.loss++;
      else acc.neutral++;
      return acc;
    }, { gain: 0, loss: 0, neutral: 0 });
  }

  /**
   * Calculate years to expiry buckets from Portfolio sheet
   */
  private calculateYearsToExpiryBuckets(clientData: ClientData | null): { [key: string]: { value: number, count: number } } {
    const buckets: { [key: string]: { value: number, count: number } } = {
      '< 6m': { value: 0, count: 0 },
      '6m - 1y': { value: 0, count: 0 },
      '1y - 2y': { value: 0, count: 0 },
      '2y - 3y': { value: 0, count: 0 },
      '3y - 5y': { value: 0, count: 0 },
    };
  
    if (!clientData) return buckets;
  
    const { headers, data } = clientData;
    const expiryDateIndex = 20; // Column U
    const aumIndex = 23; // Column X (Present value is AUM)
  
    if (headers.length <= Math.max(expiryDateIndex, aumIndex)) {
        console.error('Cannot calculate expiry buckets, headers length is too short for required columns U and X.');
        return buckets;
    }
  
    const now = new Date();
  
    data.forEach(row => {
      const expiryDateValue = row[expiryDateIndex];
      const aum = this.parseNumber(row[aumIndex]);
  
      if (!expiryDateValue || aum <= 0) return;
  
      const expiryDate = this.parseDate(expiryDateValue);
      if (!expiryDate || expiryDate < now) return; // Ignore past dates
  
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average months
  
      if (diffMonths < 6) {
        buckets['< 6m'].value += aum;
        buckets['< 6m'].count++;
      } else if (diffMonths < 12) {
        buckets['6m - 1y'].value += aum;
        buckets['6m - 1y'].count++;
      } else if (diffMonths < 24) {
        buckets['1y - 2y'].value += aum;
        buckets['1y - 2y'].count++;
      } else if (diffMonths < 36) {
        buckets['2y - 3y'].value += aum;
        buckets['2y - 3y'].count++;
      } else if (diffMonths < 60) {
        buckets['3y - 5y'].value += aum;
        buckets['3y - 5y'].value += aum;
        buckets['3y - 5y'].count++;
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
  
    const gainLossHeaderName = "gain/(loss) in portfolio"; // This is how it appears in the sheet
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
      if (!row || row.length === 0 || !row[2] || String(row[2]).includes('Grand Total')) continue; // Skip empty or total rows
  
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
      
      const portfolioSheet = this.getSheetData('Portfolio');
      const portfolioHeaders = portfolioSheet[1] as string[];
      const gainLossIndex = portfolioHeaders.findIndex(h => h?.trim().toLowerCase() === "gain/(loss) in portfolio");


      // Iterate over each client row, starting from the 3rd row (index 2) up to the second to last row
      for (let rowIndex = 2; rowIndex < sheetData.length -1; rowIndex++) {
        const row = sheetData[rowIndex] as any[];
        if (!row || row.length === 0 || !row[1] || String(row[1]).includes('Grand Total')) continue;

        const clientName = row[1];
        const portfolioRow = portfolioSheet.find(pRow => pRow[2] === clientName);
        if (!portfolioRow || gainLossIndex === -1) continue;

        const gainLossValue = this.parseNumber(portfolioRow[gainLossIndex]);

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

   private calculateEquityToCashRatioStats() {
    const sheetData = this.getSheetData('Portfolio');
    if (sheetData.length < 3) {
      return { 
        equityToCashRatioStats: { highest: null, lowest: null },
        equityToCashRatioStatsGain: { highest: null, lowest: null },
        equityToCashRatioStatsLoss: { highest: null, lowest: null }
      };
    }

    const headers = sheetData[1] as string[];
    const clientRows = sheetData.slice(2, -1); // Exclude header and grand total

    const clientNameIndex = 2;
    const colGIndex = 6;
    const colHIndex = 7;
    const colJIndex = 9;
    const colKIndex = 10;
    const gainLossIndex = headers.findIndex(h => h && h.trim().toLowerCase() === "gain/(loss) in portfolio");

    const calculateRatio = (row: any[]): number => {
      const equity = this.parseNumber(row[colGIndex]) / 2;
      const cash = (this.parseNumber(row[colHIndex]) / 2) + (this.parseNumber(row[colKIndex]) / 2) - (this.parseNumber(row[colJIndex]) / 2);
      const total = equity + cash;
      return total > 0 ? equity / total : 0;
    };

    const clientRatios: EquityCashRatioInfo[] = clientRows.map(row => ({
      clientName: String(row[clientNameIndex]),
      ratio: calculateRatio(row),
    })).filter(item => item.clientName && item.clientName !== 'Grand Total');

    const clientRatiosGain: EquityCashRatioInfo[] = [];
    const clientRatiosLoss: EquityCashRatioInfo[] = [];

    if (gainLossIndex !== -1) {
        clientRows.forEach(row => {
            const clientName = String(row[clientNameIndex]);
            if (!clientName || clientName === 'Grand Total') return;
            const gainLossValue = this.parseNumber(row[gainLossIndex]);
            const ratio = calculateRatio(row);
            if (gainLossValue > 0) {
                clientRatiosGain.push({ clientName, ratio });
            } else if (gainLossValue < 0) {
                clientRatiosLoss.push({ clientName, ratio });
            }
        });
    }

    const findMinMax = (ratios: EquityCashRatioInfo[], isMainCard: boolean = false): EquityCashRatioStats => {
        if (ratios.length === 0) return { highest: null, lowest: null };
        const sortedRatios = [...ratios].sort((a, b) => a.ratio - b.ratio);
        
        let lowest = sortedRatios[0];
        if (isMainCard && sortedRatios.length > 1) {
            lowest = sortedRatios[1]; // Get the 2nd lowest for the main card
        }
        
        return {
            lowest: lowest,
            highest: sortedRatios[sortedRatios.length - 1],
        };
    };

    return {
      equityToCashRatioStats: findMinMax(clientRatios, true), // Pass true for the main card
      equityToCashRatioStatsGain: findMinMax(clientRatiosGain),
      equityToCashRatioStatsLoss: findMinMax(clientRatiosLoss)
    };
  }

  private calculateTopMovers(summaryData: SummaryData[]): { topGainers: TopMover[], topLosers: TopMover[] } {
    const clients = summaryData.filter(c => c.clientId && !c.clientId.includes('Grand Total'));

    const sortedByPercentage = [...clients].sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);

    const topGainers: TopMover[] = sortedByPercentage
        .filter(c => c.gainLossPercentage > 0)
        .slice(0, 10)
        .map(c => ({ 
            clientId: c.clientId, 
            value: c.gainLossValue, 
            percentage: c.gainLossPercentage,
            totalValue: c.totalValue
        }));

    const topLosers: TopMover[] = sortedByPercentage
        .filter(c => c.gainLossPercentage < 0)
        .slice(-10)
        .reverse()
        .map(c => ({ 
            clientId: c.clientId, 
            value: c.gainLossValue, 
            percentage: c.gainLossPercentage,
            totalValue: c.totalValue
        }));

    return { topGainers, topLosers };
  }
  
  private calculateLargestPortfolios(summaryData: SummaryData[]): LargestPortfolio[] {
    const clients = summaryData.filter(c => c.clientId && !c.clientId.includes('Grand Total'));

    const sortedByValue = [...clients].sort((a, b) => b.totalValue - a.totalValue);

    return sortedByValue.slice(0, 10).map(c => ({
        clientId: c.clientId,
        totalValue: c.totalValue,
        gainLossValue: c.gainLossValue,
        gainLossPercentage: c.gainLossPercentage,
    }));
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
    const clientNameIndex = clientData.headers.findIndex(h => h === 'Client Name'); // Column C in Portfolio
    if (clientNameIndex === -1) return null;

    const clientRowPortfolio = clientData.data.find(row => row[clientNameIndex] === clientName);
    if (!clientRowPortfolio) return null;

    const totalValueIndex = clientData.headers.findIndex(h => h === 'Present value'); // Column X
    const gainLossPercentageIndex = clientData.headers.findIndex(h => h.trim().toLowerCase() === 'unrealised gain / (loss) %'); // Column R
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
    
    const holdingSheet = this.getSheetData('Holding Statement');
    const portfolioSummary = this.getSummaryData()?.find(s => s.clientId === clientName);

    const stockAllocations: StockAllocation[] = holdingSheet
        .filter(row => row[4] === clientName) // Client Name is in Column E (index 4)
        .map(row => {
            const stockName = String(row[1]); // Stock Name is in Column B (index 1)
            const quantity = this.parseNumber(row[8]); // Quantity is in Column I (index 8)
            const marketRate = this.parseNumber(row[10]); // Market Rate is in Column K (index 10)
            const marketValue = this.parseNumber(row[12]); // Market Value is in Column M (index 12)
            const gain = this.parseNumber(row[13]); // Gain is in Column N (index 13)
            
            const clientPortfolioValue = portfolioSummary ? portfolioSummary.totalValue : 0;
            const equityWeight = clientPortfolioValue > 0 ? (marketValue / clientPortfolioValue) : 0;
            
            if (stockName && quantity > 0) {
                return { 
                    stock: stockName, 
                    quantity, 
                    marketRate, 
                    marketValue,
                    gain,
                    equityWeight,
                };
            }
            return null;
        })
        .filter(Boolean) as StockAllocation[];

    const portfolioData = clientData.headers.map((header, index) => ({
        header,
        value: clientRowPortfolio[index],
    })).filter(item => item.value !== undefined && item.value !== null && item.value !== '');

    const colG = this.parseNumber(clientRowPortfolio[6]); // 'Market Value'
    const colH = this.parseNumber(clientRowPortfolio[7]); // 'Cash Balance'
    const colJ = this.parseNumber(clientRowPortfolio[9]); // 'Payable'
    const colK = this.parseNumber(clientRowPortfolio[10]); // 'Receivable'

    const equityValue = colG;
    const cashValue = colH + colK - colJ;
    const denominator = equityValue + cashValue;

    const equityPercentage = denominator > 0 ? (equityValue / denominator) * 100 : 0;
    const cashPercentage = denominator > 0 ? (cashValue / denominator) * 100 : 0;

    return {
        name: clientName,
        totalValue,
        gainLoss,
        gainLossPercentage,
        expiryDate,
        sectorAllocations,
        stockAllocations,
        portfolioData,
        equityPercentage,
        cashPercentage,
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

  getSummaryData(): SummaryData[] | null {
      return this.processedData?.summaryData || null;
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

    
