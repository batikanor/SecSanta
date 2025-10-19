/**
 * Network Configuration
 * Manages network modes: Mock, Sepolia, Mainnet
 */

export type NetworkMode = 'mock' | 'sepolia' | 'sepolia-zama' | 'arbitrum-sepolia' | 'mainnet';

export interface NetworkConfig {
  label: string;
  shortLabel: string;
  color: string;
  chainId: number | null;
  ensSupported: boolean;
  description: string;
  usesZama?: boolean; // Flag for Zama FHE networks
}

export const NETWORK_CONFIG: Record<NetworkMode, NetworkConfig> = {
  mock: {
    label: 'Mock Mode',
    shortLabel: 'MOCK',
    color: 'yellow',
    chainId: null,
    ensSupported: false, // Uses mock ENS resolver
    description: 'No blockchain - Mock data for UI development',
  },
  sepolia: {
    label: 'Sepolia Testnet',
    shortLabel: 'SEPOLIA',
    color: 'blue',
    chainId: 11155111,
    ensSupported: true,
    description: 'Ethereum testnet - Free testing with real blockchain',
  },
  'sepolia-zama': {
    label: 'Sepolia (Zama FHE)',
    shortLabel: 'ZAMA',
    color: 'cyan',
    chainId: 11155111,
    ensSupported: true,
    usesZama: true,
    description: 'Sepolia with Zama fhEVM - Fully encrypted contributions using confidential tokens',
  },
  'arbitrum-sepolia': {
    label: 'Arbitrum Sepolia',
    shortLabel: 'ARB-SEP',
    color: 'purple',
    chainId: 421614,
    ensSupported: false, // Arbitrum Sepolia doesn't support ENS
    description: 'Arbitrum Sepolia Testnet - Required for iExec DataProtector encryption',
  },
  mainnet: {
    label: 'Ethereum Mainnet',
    shortLabel: 'MAINNET',
    color: 'green',
    chainId: 1,
    ensSupported: true,
    description: 'Production - Real ETH and transactions',
  },
} as const;

const NETWORK_MODE_KEY = 'secsanta-network-mode';

/**
 * Get current network mode from localStorage
 * Priority: localStorage > env var > default ('sepolia')
 */
export function getNetworkMode(): NetworkMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(NETWORK_MODE_KEY) as NetworkMode;
    if (stored && (stored === 'mock' || stored === 'sepolia' || stored === 'sepolia-zama' || stored === 'arbitrum-sepolia' || stored === 'mainnet')) {
      return stored;
    }
    // Default to Sepolia (safe for testing)
    return 'sepolia';
  }
  // Server-side: default to Sepolia
  return 'sepolia';
}

/**
 * Set network mode in localStorage
 */
export function setNetworkMode(mode: NetworkMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NETWORK_MODE_KEY, mode);
  }
}

/**
 * Check if current mode uses blockchain
 */
export function usesBlockchain(): boolean {
  const mode = getNetworkMode();
  return mode !== 'mock';
}

/**
 * Check if current mode is mock
 */
export function isMockMode(): boolean {
  return getNetworkMode() === 'mock';
}

/**
 * Check if ENS is supported on current network
 */
export function isENSSupported(): boolean {
  const mode = getNetworkMode();
  return NETWORK_CONFIG[mode].ensSupported;
}

/**
 * Get chain ID for current network
 */
export function getChainId(): number | null {
  const mode = getNetworkMode();
  return NETWORK_CONFIG[mode].chainId;
}

/**
 * Get network color for UI
 */
export function getNetworkColor(): string {
  const mode = getNetworkMode();
  return NETWORK_CONFIG[mode].color;
}

/**
 * Get network label for display
 */
export function getNetworkLabel(): string {
  const mode = getNetworkMode();
  return NETWORK_CONFIG[mode].label;
}

/**
 * Check if current network uses Zama FHE
 */
export function isZamaMode(): boolean {
  const mode = getNetworkMode();
  return NETWORK_CONFIG[mode].usesZama || false;
}
