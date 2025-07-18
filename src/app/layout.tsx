
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/contexts/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio Pulse',
  description: 'Analyze and interact with your portfolio data seamlessly.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gradient-to-br from-background to-purple-100 dark:from-background dark:to-indigo-950/50 min-h-screen">
        <AppProvider>
          {children}
        </AppProvider>
        <div className="fixed bottom-2 right-3 text-[7px] text-muted-foreground/60 font-headline z-50 transition-all duration-300 ease-in-out hover:text-primary hover:scale-105 hover:drop-shadow-[0_0_4px_hsl(var(--primary)/0.8)]">
          created by Pramesh Luitel
        </div>
        <Toaster />
      </body>
    </html>
  );
}
