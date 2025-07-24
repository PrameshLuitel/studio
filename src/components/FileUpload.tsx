
'use client';

import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { ExcelDataProcessor, ExcelProcessingError } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface FileUploadDialogProps {
  onUploadSuccess: () => void;
}

export const FileUploadDialog = ({ onUploadSuccess }: FileUploadDialogProps) => {
  const { setExcelProcessor, setFileName, setIsLoading } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setIsProcessing(true);
    try {
        const processor = new ExcelDataProcessor();
        await processor.loadExcelFile(file);
        setExcelProcessor(processor);
        setFileName(file.name);
        toast({
            title: 'Processing Successful',
            description: `${file.name} has been loaded and analyzed.`,
        });
        onUploadSuccess();
    } catch (error) {
        console.error("Processing error:", error);
        const description = error instanceof ExcelProcessingError
            ? error.message
            : 'An error occurred during file processing.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description,
        });
    } finally {
        setIsLoading(false);
        setIsProcessing(false);
        setUploadedFile(null);
    }
  }, [setExcelProcessor, setFileName, setIsLoading, toast, onUploadSuccess]);

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
    processFile(uploadedFile);
  };

  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <label
      htmlFor="file-upload"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={cn(
        'relative w-full h-80 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center transition-all duration-300 ease-in-out bg-background/50 cursor-pointer',
        isDragging ? 'border-accent scale-105 bg-accent/10' : ''
      )}
    >
      <input
        id="file-upload"
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        disabled={isProcessing}
      />
      {isProcessing ? (
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="text-lg font-headline">Analyzing portfolio...</p>
          </div>
      ) : uploadedFile ? (
         <div className="flex flex-col items-center gap-4">
          <FileText className="h-16 w-16 text-accent" />
          <p className="text-lg font-medium text-foreground">{uploadedFile.name}</p>
          <div className="flex gap-4 mt-4">
            <Button onClick={handleProcessFile} size="lg">Analyze Portfolio</Button>
            <Button variant="outline" onClick={(e) => { e.preventDefault(); setUploadedFile(null); }}>Choose another file</Button>
          </div>
         </div>
      ) : (
        <div className="text-center p-4">
          <UploadCloud className="mx-auto h-16 w-16 text-primary/70 mb-4" />
          <h2 className="text-2xl font-headline font-medium text-foreground">
            <span className="text-accent">Click to upload</span> or drag and drop
          </h2>
          <p className="text-muted-foreground mt-2 mb-4">.XLSX files only</p>
        </div>
      )}
    </label>
  );
};
