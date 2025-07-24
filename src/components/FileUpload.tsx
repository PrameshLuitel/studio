
'use client';

import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { ExcelDataProcessor, ExcelProcessingError } from '@/lib/data-processor';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

// Define the global gapi and google objects that will be available after the script loads.
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const FileUpload = () => {
  const { setExcelProcessor, setFileName, setIsLoading } = useContext(AppContext);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [oauthToken, setOauthToken] = useState<string | null>(null);

  const processFile = useCallback(async (file: File | Blob, name: string) => {
      setIsLoading(true);
      try {
          const processor = new ExcelDataProcessor();
          await processor.loadExcelFile(file as File);
          setExcelProcessor(processor);
          setFileName(name);
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
    processFile(uploadedFile, uploadedFile.name);
  };

  const handleDrivePicker = () => {
    const showPicker = () => {
        const developerKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .setAppId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
            .setOAuthToken(oauthToken)
            .addView(view)
            .setDeveloperKey(developerKey)
            .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    window.gapi.client.drive.files.get({
                        fileId: doc.id,
                        alt: 'media'
                    }).then((res: any) => {
                        const fileBlob = new Blob([res.body], { type: doc.mimeType });
                        processFile(fileBlob, doc.name);
                    }).catch((err: any) => {
                       console.error("Error downloading file:", err);
                       toast({ variant: "destructive", title: "Drive Error", description: "Could not download the selected file."});
                    });
                }
            })
            .build();
        picker.setVisible(true);
    };

    const initializePicker = () => {
        window.gapi.load('picker', showPicker);
        window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    };

    if (oauthToken) {
        initializePicker();
    } else {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (tokenResponse: any) => {
                setOauthToken(tokenResponse.access_token);
                initializePicker();
            },
        });
        client.requestAccessToken();
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
          <div className="text-center p-4">
            <UploadCloud className="mx-auto h-16 w-16 text-primary/70 mb-4" />
            <h2 className="text-2xl font-headline font-medium text-foreground">
              <label htmlFor="file-upload" className="text-accent cursor-pointer hover:underline">Click to upload</label> or drag and drop
            </h2>
            <p className="text-muted-foreground mt-2 mb-4">.XLSX files only</p>
            <div className="flex items-center justify-center gap-2">
                <hr className="flex-grow border-t border-border" />
                <span className="text-muted-foreground text-xs">OR</span>
                <hr className="flex-grow border-t border-border" />
            </div>
             <Button onClick={handleDrivePicker} variant="outline" className="mt-4">
                <svg className="mr-2 h-4 w-4" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.45 13.57L13.57 20.45C13.02 21 12.06 21 11.51 20.45L1.55 10.49C1 9.94 1 8.98 1.55 8.43L8.43 1.55C8.98 1 9.94 1 10.49 1.55L20.45 11.51C21 12.06 21 13.02 20.45 13.57Z"></path><path d="M6 18L18 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                Select from Google Drive
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
