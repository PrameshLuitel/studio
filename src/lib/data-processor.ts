import * as XLSX from 'xlsx';
import type { SheetData } from '@/contexts/AppContext';

export const processFile = (file: File): Promise<SheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file data.');
        }
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheets: SheetData = {};
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
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
