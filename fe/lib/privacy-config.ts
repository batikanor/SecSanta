/**
 * Privacy Mode Configuration
 *
 * Manages privacy settings for SecSanta pools:
 * - none: Public contribution amounts (no encryption)
 * - iexec: Encrypted with iExec TEE (Trusted Execution Environments)
 * - zama: Encrypted with Zama fhEVM (Fully Homomorphic Encryption)
 */

export type PrivacyMode = 'none' | 'iexec' | 'zama';

const PRIVACY_MODE_KEY = 'secsanta-privacy-mode';

export interface PrivacyConfig {
  label: string;
  shortLabel: string;
  color: string;
  description: string;
  enabled: boolean;
  networks: string[]; // Which networks support this privacy mode
}

export const PRIVACY_CONFIG: Record<PrivacyMode, PrivacyConfig> = {
  none: {
    label: 'No Privacy',
    shortLabel: 'PUBLIC',
    color: 'gray',
    description: 'Contribution amounts are public and visible to everyone',
    enabled: true,
    networks: ['sepolia', 'mainnet'],
  },
  iexec: {
    label: 'iExec (TEE)',
    shortLabel: 'IEXEC',
    color: 'purple',
    description: 'Encrypted with Trusted Execution Environments (Intel SGX) - Requires Arbitrum Sepolia',
    enabled: true, // Enabled for implementation
    networks: ['arbitrum-sepolia'], // iExec DataProtector works on Arbitrum Sepolia (chain ID 421614)
  },
  zama: {
    label: 'Zama (FHE)',
    shortLabel: 'ZAMA',
    color: 'indigo',
    description: 'Fully Homomorphic Encryption - compute on encrypted data (Sepolia)',
    enabled: true, // ✅ ENABLED - Integration complete!
    networks: ['sepolia'], // fhEVM deployed on Sepolia testnet
  },
} as const;

/**
 * Get the current privacy mode from localStorage
 * Defaults to 'none' (public amounts)
 */
export function getPrivacyMode(): PrivacyMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PRIVACY_MODE_KEY) as PrivacyMode;
    if (stored && ['none', 'iexec', 'zama'].includes(stored)) {
      return stored;
    }
    // Default to 'none'
    return 'none';
  }
  return 'none';
}

/**
 * Set the privacy mode in localStorage
 */
export function setPrivacyMode(mode: PrivacyMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRIVACY_MODE_KEY, mode);
  }
}

/**
 * Check if a privacy mode is available for the current network
 */
export function isPrivacyModeAvailable(
  privacyMode: PrivacyMode,
  networkMode: string
): boolean {
  const config = PRIVACY_CONFIG[privacyMode];
  return config.enabled && config.networks.includes(networkMode);
}

/**
 * Get available privacy modes for a given network
 */
export function getAvailablePrivacyModes(networkMode: string): PrivacyMode[] {
  return (['none', 'iexec', 'zama'] as const).filter((mode) =>
    isPrivacyModeAvailable(mode, networkMode)
  );
}
