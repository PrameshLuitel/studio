
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
  assetAllocation: {
    profit: Array<{
      sector: string;
      allocation: number;
    }>;
    loss: Array<{
      sector: string;
      allocation: number;
    }>;
  };
  rawData: {
    summary: SummaryData[];
    sectorHolding: SectorHoldingData[];
    holdingStatement: HoldingStatementData[];
    investmentReturn: InvestmentReturnData[];
    eps: EPSData[];
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

    const requiredSheets = [
      'Portfolio',
      'Sector Holding Summary',
      'Holding Statement',
      'Investment Return Report',
      'EPS'
    ];

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
    if (!this.workbook) {
      throw new ExcelProcessingError('No workbook loaded', 'NO_WORKBOOK');
    }

    const rawData = {
      summary: this.processSummarySheet(),
      sectorHolding: this.processSectorHoldingSheet(),
      holdingStatement: this.processHoldingStatementSheet(),
      investmentReturn: this.processInvestmentReturnSheet(),
      eps: this.processEPSSheet()
    };

    return {
      totalPMSClients: this.calculateTotalPMSClients(rawData.summary),
      totalAUM: this.calculateTotalAUM(rawData.summary),
      profitRate: this.calculateProfitRate(rawData.summary),
      clientGainLoss: this.calculateClientGainLoss(rawData.summary),
      yearsToExpiryBuckets: this.calculateYearsToExpiryBuckets(rawData.investmentReturn),
      sectorAllocation: this.calculateSectorAllocation(rawData.sectorHolding),
      assetAllocation: this.calculateAssetAllocation(rawData.summary, rawData.sectorHolding),
      rawData
    };
  }

  /**
   * Process Portfolio worksheet
   */
  private processSummarySheet(): SummaryData[] {
    const sheet = this.workbook!.Sheets['Portfolio'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return jsonData.slice(1).map((row: any, index) => {
      if (!row || row.length === 0) return null;
      
      return {
        clientId: row[0] || `Client_${index + 1}`,
        totalValue: this.parseNumber(row[16]) || 0, // Column Q (index 16)
        gainLoss: this.parseNumber(row[17]) || 0, // Column R (index 17)
        ...this.createRowObject(row, index)
      };
    }).filter(Boolean) as SummaryData[];
  }

  /**
   * Process Sector Holding Summary worksheet
   */
  private processSectorHoldingSheet(): SectorHoldingData[] {
    const sheet = this.workbook!.Sheets['Sector Holding Summary'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return jsonData.slice(1).map((row: any, index) => {
      if (!row || row.length === 0) return null;
      
      return {
        sector: row[0] || `Sector_${index + 1}`,
        allocation: this.parseNumber(row[2]) || 0, // Column C (index 2)
        ...this.createRowObject(row, index)
      };
    }).filter(Boolean) as SectorHoldingData[];
  }

  /**
   * Process Holding Statement worksheet
   */
  private processHoldingStatementSheet(): HoldingStatementData[] {
    const sheet = this.workbook!.Sheets['Holding Statement'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return jsonData.slice(1).map((row: any, index) => {
      if (!row || row.length === 0) return null;
      
      return {
        security: row[0] || `Security_${index + 1}`,
        quantity: this.parseNumber(row[1]) || 0,
        marketValue: this.parseNumber(row[2]) || 0,
        sector: row[3] || 'Unknown',
        ...this.createRowObject(row, index)
      };
    }).filter(Boolean) as HoldingStatementData[];
  }

  /**
   * Process Investment Return Report worksheet
   */
  private processInvestmentReturnSheet(): InvestmentReturnData[] {
    const sheet = this.workbook!.Sheets['Investment Return Report'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return jsonData.slice(1).map((row: any, index) => {
      if (!row || row.length === 0) return null;

      const dateD = row[3] instanceof Date ? row[3] : null;
      const dateE = row[4] instanceof Date ? row[4] : null;

      let yearsToExpiry = 0;
      if (dateD && dateE) {
        const diffTime = Math.abs(dateE.getTime() - dateD.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        yearsToExpiry = diffDays / 365.25;
      }
      
      return {
        security: row[0] || `Security_${index + 1}`,
        maturityDate: row[10] || '', // Column K (index 10)
        yearsToExpiry: yearsToExpiry,
        returnRate: this.parseNumber(row[12]) || 0,
        ...this.createRowObject(row, index)
      };
    }).filter(Boolean) as InvestmentReturnData[];
  }

  /**
   * Process EPS worksheet
   */
  private processEPSSheet(): EPSData[] {
    const sheet = this.workbook!.Sheets['EPS'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return jsonData.slice(1).map((row: any, index) => {
      if (!row || row.length === 0) return null;
      
      return {
        company: row[0] || `Company_${index + 1}`,
        eps: this.parseNumber(row[1]) || 0,
        sector: row[2] || 'Unknown',
        ...this.createRowObject(row, index)
      };
    }).filter(Boolean) as EPSData[];
  }

  /**
   * Calculate total PMS clients
   */
  private calculateTotalPMSClients(summaryData: SummaryData[]): number {
    return summaryData.filter(client => client.clientId && client.clientId.trim() !== '').length;
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
    const result = { gain: 0, loss: 0, neutral: 0 };
    
    summaryData.forEach(client => {
      const gainLoss = client.gainLoss || 0;
      if (gainLoss > 0) {
        result.gain += 1;
      } else if (gainLoss < 0) {
        result.loss += 1;
      } else {
        result.neutral += 1;
      }
    });
    
    return result;
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
      if (years <= 1) {
        buckets['0-1'] += 1;
      } else if (years <= 3) {
        buckets['1-3'] += 1;
      } else if (years <= 5) {
        buckets['3-5'] += 1;
      } else {
        buckets['5+'] += 1;
      }
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
   * Calculate asset allocation for profit/loss clients
   */
  private calculateAssetAllocation(
    summaryData: SummaryData[],
    sectorData: SectorHoldingData[]
  ): {
    profit: Array<{ sector: string; allocation: number; }>;
    loss: Array<{ sector: string; allocation: number; }>;
  } {
    const profitClients = summaryData.filter(client => (client.gainLoss || 0) > 0);
    const lossClients = summaryData.filter(client => (client.gainLoss || 0) < 0);
    
    // This is a simplified calculation - in a real scenario, you'd need to map
    // clients to their specific sector allocations
    const profitAllocation = sectorData.map(sector => ({
      sector: sector.sector,
      allocation: sector.allocation * (profitClients.length / summaryData.length)
    }));
    
    const lossAllocation = sectorData.map(sector => ({
      sector: sector.sector,
      allocation: sector.allocation * (lossClients.length / summaryData.length)
    }));
    
    return {
      profit: profitAllocation.filter(item => item.allocation > 0),
      loss: lossAllocation.filter(item => item.allocation > 0)
    };
  }

  /**
   * Calculate profit rate from last row (total) of column R
   */
  private calculateProfitRate(summaryData: SummaryData[]): number {
    const sheet = this.workbook!.Sheets['Portfolio'];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find the last row that contains data
    const lastRowIndex = jsonData.length - 1;
    const lastRow = jsonData[lastRowIndex] as any[];
    
    if (lastRow && lastRow.length > 17) {
      // Column R is index 17 (0-based)
      const profitRateValue = this.parseNumber(lastRow[17]) || 0;
      return profitRateValue;
    }
    
    return 0;
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

  /**
   * Create a generic row object with indexed properties
   */
  private createRowObject(row: any[], index: number): Record<string, any> {
    const obj: Record<string, any> = {};
    row.forEach((cell, cellIndex) => {
      obj[`col_${cellIndex}`] = cell;
    });
    obj.rowIndex = index;
    return obj;
  }

  /**
   * Get processed data
   */
  getProcessedData(): ProcessedData | null {
    return this.processedData;
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalClients: number;
    totalAUM: number;
    averageAUM: number;
    clientGainLoss: { gain: number; loss: number; neutral: number; };
  } | null {
    if (!this.processedData) return null;
    
    return {
      totalClients: this.processedData.totalPMSClients,
      totalAUM: this.processedData.totalAUM,
      averageAUM: this.processedData.totalAUM / this.processedData.totalPMSClients,
      clientGainLoss: this.processedData.clientGainLoss
    };
  }

  /**
   * Get sector data for charts
   */
  getSectorChartData(): Array<{ name: string; value: number; }> | null {
    if (!this.processedData) return null;
    
    return this.processedData.sectorAllocation.map(sector => ({
      name: sector.sector,
      value: sector.allocation
    }));
  }

  /**
   * Get years to expiry chart data
   */
  getYearsToExpiryChartData(): Array<{ name: string; value: number; }> | null {
    if (!this.processedData) return null;
    
    const buckets = this.processedData.yearsToExpiryBuckets;
    return Object.entries(buckets).map(([range, count]) => ({
      name: `${range} years`,
      value: count
    }));
  }

  /**
   * Get client distribution data
   */
  getClientDistributionData(): Array<{ name: string; value: number; color: string; }> | null {
    if (!this.processedData) return null;
    
    const { gain, loss, neutral } = this.processedData.clientGainLoss;
    return [
      { name: 'Profit', value: gain, color: '#22c55e' },
      { name: 'Loss', value: loss, color: '#ef4444' },
      { name: 'Neutral', value: neutral, color: '#6b7280' }
    ];
  }

  /**
   * Get raw data for specific worksheet
   */
  getRawData(worksheet: 'summary' | 'sectorHolding' | 'holdingStatement' | 'investmentReturn' | 'eps'): any[] | null {
    if (!this.processedData) return null;
    return this.processedData.rawData[worksheet];
  }

    /**
   * Get raw data for all sheets as JSON string for AI context
   */
  getAllSheetsRawData(): string {
    if (!this.processedData) return "{}";
    
    const rawForAI: {[key: string]: any} = {};

    (Object.keys(this.processedData.rawData) as Array<keyof typeof this.processedData.rawData>).forEach(sheetName => {
        rawForAI[sheetName] = this.getRawData(sheetName);
    });

    return JSON.stringify(rawForAI, null, 2);
  }

  /**
   * Export processed data as JSON
   */
  exportToJSON(): string | null {
    if (!this.processedData) return null;
    return JSON.stringify(this.processedData, null, 2);
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.processedData !== null;
  }

  /**
   * Clear loaded data
   */
  clearData(): void {
    this.workbook = null;
    this.processedData = null;
  }
}

// Export a singleton instance
export const excelProcessor = new ExcelDataProcessor();

// Export utility functions
export const createExcelProcessor = () => new ExcelDataProcessor();

export const validateExcelFile = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(2)}%`;
};

    