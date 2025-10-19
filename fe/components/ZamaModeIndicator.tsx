'use client';

import { useEffect, useState } from 'react';
import { isZamaMode, getNetworkLabel } from '@/lib/network-config';
import { getContractAddresses, checkNetwork, switchToSepolia } from '@/lib/zama-service';

/**
 * Zama Mode Indicator Component
 * Shows when Zama FHE mode is active and provides quick actions
 */
export function ZamaModeIndicator() {
  const [zamaActive, setZamaActive] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const isZama = isZamaMode();
      setZamaActive(isZama);

      if (isZama) {
        const correctNetwork = await checkNetwork();
        setOnCorrectNetwork(correctNetwork);
      }

      setChecking(false);
    };

    checkStatus();
  }, []);

  if (!zamaActive) {
    return null;
  }

  const addresses = getContractAddresses();

  const handleSwitchNetwork = async () => {
    try {
      await switchToSepolia();
      setOnCorrectNetwork(true);
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch to Sepolia network. Please switch manually.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔐</div>
          <div>
            <div className="font-bold text-lg">Zama FHE Mode Active</div>
            <div className="text-sm opacity-90">
              Fully encrypted contributions using confidential tokens
            </div>
          </div>
        </div>

        {!checking && !onCorrectNetwork && (
          <button
            onClick={handleSwitchNetwork}
            className="bg-white text-cyan-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition"
          >
            Switch to Sepolia
          </button>
        )}
      </div>

      <div className="mt-3 text-sm space-y-1 opacity-90">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Network:</span>
          <span>Sepolia Testnet</span>
          {onCorrectNetwork ? (
            <span className="text-green-300">✓ Connected</span>
          ) : (
            <span className="text-yellow-300">⚠ Wrong network</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Token:</span>
          <a
            href={`https://sepolia.etherscan.io/address/${addresses.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate max-w-xs"
          >
            {addresses.token.slice(0, 6)}...{addresses.token.slice(-4)}
          </a>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Pool:</span>
          <a
            href={`https://sepolia.etherscan.io/address/${addresses.pool}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate max-w-xs"
          >
            {addresses.pool.slice(0, 6)}...{addresses.pool.slice(-4)}
          </a>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold hover:underline">
          How it works
        </summary>
        <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
          <li>Contributions are encrypted client-side before sending</li>
          <li>Individual amounts remain private forever</li>
          <li>Only the final total is revealed when pool is finalized</li>
          <li>Uses Zama&apos;s fhEVM for homomorphic encryption</li>
        </ul>
      </details>
    </div>
  );
}

