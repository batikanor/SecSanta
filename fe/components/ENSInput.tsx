'use client';

import { useState, useEffect, useRef } from 'react';
import { useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';
import { isValidAddress, isValidEnsName } from '@/lib/utils';
import { mockResolveEnsAddress } from '@/lib/debug-data';
import { getNetworkMode, getChainId } from '@/lib/network-config';

interface ENSInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

/**
 * Input field that accepts both ENS names and Ethereum addresses
 * Resolves ENS names to addresses automatically
 */
export function ENSInput({
  value,
  onChange,
  placeholder = '0x... or name.eth',
  label,
  error,
  required = false,
}: ENSInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isEnsName, setIsEnsName] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const onChangeRef = useRef(onChange);

  // Check network mode from localStorage
  useEffect(() => {
    const mode = getNetworkMode();
    setIsMock(mode === 'mock');
  }, []);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Check if input is ENS name
  useEffect(() => {
    setIsEnsName(isValidEnsName(inputValue));
  }, [inputValue]);

  // Resolve ENS name to address (not in mock mode)
  const chainId = getChainId();
  const { data: resolvedAddress } = useEnsAddress({
    name: isEnsName ? normalize(inputValue) : undefined,
    chainId: chainId || 1,
    query: {
      enabled: !isMock && isEnsName && chainId !== null,
    },
  });

  // Update parent component when address is resolved
  useEffect(() => {
    if (isMock && isEnsName) {
      const mockAddress = mockResolveEnsAddress(inputValue);
      if (mockAddress) {
        onChangeRef.current(mockAddress);
      }
    } else if (resolvedAddress) {
      onChangeRef.current(resolvedAddress);
    } else if (isValidAddress(inputValue)) {
      onChangeRef.current(inputValue);
    }
  }, [resolvedAddress, inputValue, isEnsName, isMock]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If it's a valid address, update immediately
    const trimmedValue = newValue.trim();
    if (isValidAddress(trimmedValue)) {
      onChangeRef.current(trimmedValue);
    }
  };

  const showResolvedAddress = isEnsName && (resolvedAddress || (isMock && mockResolveEnsAddress(inputValue)));
  const resolvedAddr = isMock ? mockResolveEnsAddress(inputValue) : resolvedAddress;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          } focus:outline-none focus:ring-2 transition-colors`}
          required={required}
        />
        {showResolvedAddress && (
          <div className="mt-2 text-sm text-gray-600">
            ✓ Resolved to: <span className="font-mono">{resolvedAddr}</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
