
'use client';

import { ExcelDataProcessor, ExcelProcessingError, ProcessedData } from '../lib/data-processor';

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  const { file } = event.data;

  try {
    const processor = new ExcelDataProcessor();
    await processor.loadExcelFile(file);
    const processedData = processor.getProcessedData();
    
    self.postMessage({ processedData });

  } catch (error) {
    console.error('Worker Error:', error);
    const errorMessage = error instanceof ExcelProcessingError ? error.message : 'An unexpected error occurred in the worker.';
    self.postMessage({ processedData: null, error: errorMessage });
  }
};
