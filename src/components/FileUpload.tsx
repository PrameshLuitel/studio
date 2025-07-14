
'use client';

import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { ExcelDataProcessor, ExcelProcessingError } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export const FileUpload = () => {
  const { setExcelProcessor, setFileName, setIsLoading } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a .xlsx file.',
      });
      return;
    }
    
    setUploadedFile(file);
    
  }, [toast]);
  
  const handleProcessFile = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);
    try {
      const processor = new ExcelDataProcessor();
      await processor.loadExcelFile(uploadedFile);
      setExcelProcessor(processor);
      setFileName(uploadedFile.name);
    } catch (error) {
      console.error(error);
      const description = error instanceof ExcelProcessingError 
        ? error.message 
        : 'Failed to process the Excel file. Please check the format and try again.';
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h1 className="text-5xl font-headline font-bold text-primary mb-2">Portfolio Pulse</h1>
      <p className="text-lg text-foreground/80 mb-8">
        Upload your .xlsx portfolio file to begin analysis.
      </p>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={cn(
          'relative w-full h-80 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center transition-all duration-300 ease-in-out glassmorphic',
          isDragging ? 'border-accent scale-105 bg-accent/10' : ''
        )}
      >
        <input
          id="file-upload"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {uploadedFile ? (
           <div className="flex flex-col items-center gap-4">
            <FileText className="h-16 w-16 text-accent" />
            <p className="text-lg font-medium text-foreground">{uploadedFile.name}</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={handleProcessFile} size="lg">Analyze Portfolio</Button>
              <Button variant="outline" onClick={() => setUploadedFile(null)}>Choose another file</Button>
            </div>
           </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer text-center p-4">
            <UploadCloud className="mx-auto h-16 w-16 text-primary/70 mb-4" />
            <h2 className="text-2xl font-headline font-medium text-foreground">
              <span className="text-accent">Click to upload</span> or drag and drop
            </h2>
            <p className="text-muted-foreground mt-2">.XLSX files only</p>
          </label>
        )}
      </div>
    </div>
  );
};
