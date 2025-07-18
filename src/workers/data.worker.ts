
import * as XLSX from 'xlsx';
import { ExcelDataProcessor, ExcelProcessingError, ProcessedData } from '../lib/data-processor';

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  const { file } = event.data;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    const processor = new ExcelDataProcessor(workbook);
    const processedData = processor.processWorkbook();
    
    self.postMessage({ processedData });

  } catch (error) {
    console.error('Worker Error:', error);
    const errorMessage = error instanceof ExcelProcessingError ? error.message : 'An unexpected error occurred in the worker.';
    self.postMessage({ processedData: null, error: errorMessage });
  }
};
