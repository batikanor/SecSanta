'use client';

import { useEnsName } from 'wagmi';
import { normalize } from 'viem/ens';
import { truncateAddress } from '@/lib/utils';
import { DEBUG_MODE, mockResolveEnsName } from '@/lib/debug-data';

interface ENSDisplayProps {
  address: string;
  showFullAddress?: boolean;
  className?: string;
}

/**
 * Display ENS name if available, otherwise show truncated address
 * Integrates with ENS for bounty qualification
 */
export function ENSDisplay({ address, showFullAddress = false, className = '' }: ENSDisplayProps) {
  // Use wagmi hook for ENS resolution (only in production mode)
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1, // ENS is on mainnet
    query: {
      enabled: !DEBUG_MODE && !!address,
    },
  });

  // In debug mode, use mock ENS names
  const displayName = DEBUG_MODE ? mockResolveEnsName(address) : ensName;

  if (displayName) {
    return (
      <span className={`font-medium text-primary-600 ${className}`}>
        {displayName}
      </span>
    );
  }

  return (
    <span className={`font-mono text-gray-600 text-sm ${className}`}>
      {showFullAddress ? address : truncateAddress(address)}
    </span>
  );
}
