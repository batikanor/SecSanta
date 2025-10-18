import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { DebugPanel } from '@/components/DebugPanel';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecSanta - Secret Gift Pools',
  description: 'Create anonymous gift pools with friends, powered by blockchain and ENS',
  keywords: ['ethereum', 'ens', 'gift', 'secret santa', 'web3', 'blockchain'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <DebugPanel />
        </Providers>
      </body>
    </html>
  );
}
