import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/contexts/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio Pulse',
  description: 'Analyze and interact with your portfolio data seamlessly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50 min-h-screen">
        <AppProvider>
          {children}
        </AppProvider>
        <div className="fixed bottom-4 right-4 text-xs text-muted-foreground/80 font-headline z-50 pointer-events-none">
          created by Pramesh Luitel
        </div>
        <Toaster />
      </body>
    </html>
  );
}
