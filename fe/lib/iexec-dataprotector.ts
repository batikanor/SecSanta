/**
 * iExec DataProtector Client
 *
 * Handles encryption and protection of contribution amounts using iExec's DataProtector.
 * Data is encrypted client-side with AES-256, stored on IPFS, and ownership is recorded on-chain.
 */

import { IExecDataProtectorCore } from '@iexec/dataprotector';

/**
 * Protected contribution data structure
 */
export interface ProtectedContribution {
  poolId: string;
  contributorAddress: string;
  amount: string; // In ETH (will be encrypted)
  timestamp: number;
}

/**
 * Result from protecting data
 */
export interface ProtectedDataResult {
  address: string; // Smart contract address of protected data (NFT)
  name: string;
  owner: string;
  schema?: any;
  creationTimestamp: number;
}

/**
 * Get EIP-1193 provider (window.ethereum or from wagmi connector)
 */
function getEIP1193Provider(): any {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  throw new Error('No Ethereum provider found. Please connect your wallet.');
}

/**
 * Check if wallet is connected to Arbitrum Sepolia network (required for iExec)
 */
async function checkArbitrumSepoliaNetwork(provider: any): Promise<void> {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    const chainIdNum = parseInt(chainId, 16);

    if (chainIdNum !== 421614) {
      throw new Error(
        `iExec DataProtector requires Arbitrum Sepolia network (chain ID 421614). ` +
        `You are currently on chain ID ${chainIdNum}. ` +
        `Please switch to Arbitrum Sepolia network in your wallet.`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('chain ID')) {
      throw error; // Re-throw our custom error
    }
    throw new Error('Failed to check network. Please ensure your wallet is connected.');
  }
}

/**
 * Initialize DataProtector instance
 */
async function getDataProtector(): Promise<IExecDataProtectorCore> {
  const provider = getEIP1193Provider();
  return new IExecDataProtectorCore(provider);
}

/**
 * Encrypt and protect a contribution amount
 *
 * This function:
 * 1. Encrypts the contribution data client-side (AES-256)
 * 2. Stores encrypted data on IPFS
 * 3. Records ownership on-chain as an NFT
 * 4. Returns the protected data address
 *
 * @param contribution - Contribution data to protect
 * @returns Protected data result with on-chain address
 */
export async function protectContribution(
  contribution: ProtectedContribution
): Promise<ProtectedDataResult> {
  try {
    // Check if on Arbitrum Sepolia network first
    const provider = getEIP1193Provider();
    await checkArbitrumSepoliaNetwork(provider);

    const dataProtector = await getDataProtector();

    console.log('🔐 Encrypting contribution with iExec DataProtector...', {
      poolId: contribution.poolId,
      contributor: contribution.contributorAddress,
      // Don't log the actual amount for privacy
    });

    // Encrypt and protect the contribution data
    const protectedData = await dataProtector.protectData({
      data: {
        poolId: contribution.poolId,
        contributorAddress: contribution.contributorAddress,
        amount: contribution.amount,
        timestamp: contribution.timestamp,
      },
      name: `SecSanta-Pool-${contribution.poolId}-${contribution.contributorAddress.slice(0, 8)}-${Date.now()}`,
    });

    console.log('✅ Contribution encrypted successfully!', {
      protectedDataAddress: protectedData.address,
      owner: protectedData.owner,
    });

    return {
      address: protectedData.address,
      name: protectedData.name,
      owner: protectedData.owner,
      schema: protectedData.schema,
      creationTimestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Failed to protect contribution:', error);
    throw new Error(
      `Failed to encrypt contribution: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Grant access to protected data for an authorized address
 *
 * This allows a specific address (like an iApp or another user) to access the encrypted data.
 *
 * @param protectedDataAddress - Address of the protected data NFT
 * @param authorizedApp - Address allowed to access the data
 * @param authorizedUser - User address allowed to access (optional, defaults to authorizedApp)
 */
export async function grantAccess(
  protectedDataAddress: string,
  authorizedApp: string,
  authorizedUser?: string
): Promise<void> {
  try {
    const dataProtector = await getDataProtector();

    console.log('🔑 Granting access to protected data...', {
      protectedDataAddress,
      authorizedApp,
    });

    await dataProtector.grantAccess({
      protectedData: protectedDataAddress,
      authorizedApp,
      authorizedUser: authorizedUser || authorizedApp,
    });

    console.log('✅ Access granted successfully!');
  } catch (error) {
    console.error('❌ Failed to grant access:', error);
    throw new Error(
      `Failed to grant access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revoke access to protected data
 * TODO: Implement when needed (requires GrantedAccess object)
 *
 * @param protectedDataAddress - Address of the protected data
 * @param authorizedApp - Address to revoke access from
 */
export async function revokeAccess(
  protectedDataAddress: string,
  authorizedApp: string
): Promise<void> {
  console.log('ℹ️ revokeAccess not yet implemented', protectedDataAddress, authorizedApp);
  // TODO: Implement with correct GrantedAccess API
}

/**
 * Check if DataProtector is available (wallet connected)
 *
 * @returns True if DataProtector can be used
 */
export async function isDataProtectorAvailable(): Promise<boolean> {
  try {
    const provider = getEIP1193Provider();

    // Request account access if needed
    const accounts = await provider.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0;
  } catch {
    return false;
  }
}

/**
 * Request wallet connection for DataProtector
 */
export async function connectWalletForDataProtector(): Promise<string[]> {
  try {
    const provider = getEIP1193Provider();
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    return accounts;
  } catch (error) {
    console.error('❌ Failed to connect wallet:', error);
    throw new Error('Failed to connect wallet. Please try again.');
  }
}
