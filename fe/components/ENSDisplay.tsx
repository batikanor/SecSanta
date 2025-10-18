'use client';

import { useEnsName } from 'wagmi';
import { normalize } from 'viem/ens';
import { truncateAddress } from '@/lib/utils';

interface ENSDisplayProps {
  address: string;
  showFullAddress?: boolean;
  className?: string;
}

/**
 * Display ENS name if available, otherwise show truncated address
 * Integrates with ENS for bounty qualification
 *
 * ALWAYS uses real ENS resolution - even in DEBUG mode
 */
export function ENSDisplay({ address, showFullAddress = false, className = '' }: ENSDisplayProps) {
  // Use wagmi hook for REAL ENS resolution (always enabled)
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1, // ENS is on mainnet
    query: {
      enabled: !!address, // Always enabled - we want real ENS even in DEBUG mode
    },
  });

  const displayName = ensName;

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
