import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: 'Media Center',
  title: {
    default: 'Media Center',
    template: '%s - Media Center',
  },
  description: 'All your HLS streams in one place',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Media Center',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#fff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
