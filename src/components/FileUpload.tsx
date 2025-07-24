
'use client';

import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { ExcelDataProcessor, ExcelProcessingError } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

const PORTFOLIO_FILE_PATH = 'portfolio/portfolio.xlsx';

export const FileUpload = () => {
  const { setExcelProcessor, setFileName, setIsLoading, resetApp } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setIsUploading(true);
    try {
        // Upload to Firebase Storage
        const fileRef = ref(storage, PORTFOLIO_FILE_PATH);
        await uploadBytes(fileRef, file);

        toast({
            title: 'Upload Successful',
            description: `${file.name} has been uploaded and is now public.`,
        });

        // Process the file for the current user
        const processor = new ExcelDataProcessor();
        await processor.loadExcelFile(file);
        setExcelProcessor(processor);
        setFileName(file.name);
    } catch (error) {
        console.error("Upload or processing error:", error);
        const description = error instanceof ExcelProcessingError
            ? error.message
            : 'An error occurred during upload or processing.';
        toast({
            variant: 'destructive',
            title: 'Error',
            description,
        });
    } finally {
        setIsLoading(false);
        setIsUploading(false);
        setUploadedFile(null);
    }
  }, [setExcelProcessor, setFileName, setIsLoading, toast]);

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

  const handleLogout = () => {
    resetApp();
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
    <div className="w-full max-w-2xl mx-auto text-center relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLogout} 
        className="absolute -top-12 right-0 text-muted-foreground"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
      <h1 className="text-5xl font-headline font-bold text-primary mb-2">Portfolio Pulse</h1>
      <p className="text-lg text-foreground/80 mb-8">
        Upload a new .xlsx portfolio file to update the public data.
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
          disabled={isUploading}
        />
        {isUploading ? (
            <div className="flex flex-col items-center gap-4 text-primary">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p className="text-lg font-headline">Uploading and processing...</p>
            </div>
        ) : uploadedFile ? (
           <div className="flex flex-col items-center gap-4">
            <FileText className="h-16 w-16 text-accent" />
            <p className="text-lg font-medium text-foreground">{uploadedFile.name}</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={handleProcessFile} size="lg">Upload and Analyze</Button>
              <Button variant="outline" onClick={() => setUploadedFile(null)}>Choose another file</Button>
            </div>
           </div>
        ) : (
          <div className="text-center p-4">
            <UploadCloud className="mx-auto h-16 w-16 text-primary/70 mb-4" />
            <h2 className="text-2xl font-headline font-medium text-foreground">
              <label htmlFor="file-upload" className="text-accent cursor-pointer hover:underline">Click to upload</label> or drag and drop
            </h2>
            <p className="text-muted-foreground mt-2 mb-4">.XLSX files only</p>
          </div>
        )}
      </div>
    </div>
  );
};
