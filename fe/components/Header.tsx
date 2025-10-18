'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Gift, Trash2 } from 'lucide-react';
import { clearMockData } from '@/lib/debug-data';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const BLOCKCHAIN_MODE_KEY = 'secsanta-blockchain-mode';

export function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read blockchain mode from localStorage
    const mode = localStorage.getItem(BLOCKCHAIN_MODE_KEY);
    setIsDebugMode(mode === 'mock' || mode === null); // default to mock
  }, []);

  const handleClearData = async () => {
    if (confirm('Clear all debug data? This will remove all pools and reset the app.')) {
      await clearMockData();
      router.refresh();
      window.location.reload();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SecSanta</h1>
              {mounted && isDebugMode && (
                <span className="text-xs text-yellow-600 font-medium">DEBUG MODE</span>
              )}
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {mounted && isDebugMode && (
              <button
                onClick={handleClearData}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-md transition-colors flex items-center gap-1"
                title="Clear all debug data"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Clear Data</span>
              </button>
            )}
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
