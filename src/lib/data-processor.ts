
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


export const processFile = (file: File): Promise<{ [key: string]: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file data.');
        }
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheets: { [key: string]: any[] } = {};
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // This will format dates
          });
        });
        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};
