/**
 * iExec Pool Service
 *
 * Handles pool operations with iExec privacy (encrypted contributions).
 * For now, this stores encrypted data references in Upstash alongside regular pool data.
 * Future: Will integrate with smart contracts on Sepolia.
 */

import { protectContribution, grantAccess, type ProtectedDataResult } from './iexec-dataprotector';
import { getIExecAppAddress } from './iexec-config';
import type { Pool } from '@/types/pool';

/**
 * Extended pool interface for iExec-protected pools
 */
export interface IExecPool extends Pool {
  privacyMode: 'iexec';
  protectedContributions: Array<{
    contributor: string;
    protectedDataAddress: string; // Address of encrypted data on IPFS/blockchain
    timestamp: number;
  }>;
  totalAmount?: string; // Only set after TEE computation
  computedTimestamp?: number;
}

/**
 * Create a pool with iExec privacy
 *
 * This function:
 * 1. Encrypts the initial contribution with DataProtector
 * 2. Creates pool record with protected data reference
 * 3. Stores in Upstash (future: smart contract)
 *
 * @param provider - Wallet provider
 * @param name - Pool name
 * @param recipient - Recipient address
 * @param threshold - Funding threshold in ETH
 * @param initialContribution - Initial contribution amount in ETH
 * @param creatorAddress - Creator's address
 * @returns Pool ID
 */
export async function createPoolWithIExec(
  name: string,
  recipient: string,
  threshold: number,
  initialContribution: string,
  creatorAddress: string
): Promise<string> {
  try {
    // Generate pool ID (future: from smart contract)
    const poolId = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Encrypt initial contribution with DataProtector
    const protectedData = await protectContribution({
      poolId,
      contributorAddress: creatorAddress,
      amount: initialContribution,
      timestamp: Date.now(),
    });

    // Grant access to iApp for computation (if iApp is deployed)
    const iAppAddress = getIExecAppAddress();
    if (iAppAddress) {
      await grantAccess(protectedData.address, iAppAddress);
    }

    // Create pool record
    const pool: IExecPool = {
      id: poolId,
      name,
      creatorAddress,
      recipientAddress: recipient,
      giftSuggestions: [],
      finalizationThreshold: threshold,
      contributors: [],
      status: 'ongoing',
      createdAt: Date.now(),
      privacyMode: 'iexec',
      protectedContributions: [
        {
          contributor: creatorAddress,
          protectedDataAddress: protectedData.address,
          timestamp: Date.now(),
        },
      ],
    };

    // Store pool in Upstash
    const response = await fetch('/api/pools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pool),
    });

    if (!response.ok) {
      throw new Error('Failed to create pool');
    }

    return poolId;
  } catch (error) {
    console.error('Failed to create iExec pool:', error);
    throw error;
  }
}

/**
 * Contribute to an iExec-protected pool
 *
 * This function:
 * 1. Encrypts the contribution with DataProtector
 * 2. Grants access to iApp for computation
 * 3. Adds protected data reference to pool
 *
 * @param provider - Wallet provider
 * @param poolId - Pool ID
 * @param amount - Contribution amount in ETH
 * @param contributorAddress - Contributor's address
 */
export async function contributeToPoolWithIExec(
  poolId: string,
  amount: string,
  contributorAddress: string
): Promise<void> {
  try {
    // Encrypt contribution with DataProtector
    const protectedData = await protectContribution({
      poolId,
      contributorAddress,
      amount,
      timestamp: Date.now(),
    });

    // Grant access to iApp for computation
    const iAppAddress = getIExecAppAddress();
    if (iAppAddress) {
      await grantAccess(protectedData.address, iAppAddress);
    }

    // Add protected contribution to pool
    const contribution = {
      poolId,
      contributor: contributorAddress,
      protectedDataAddress: protectedData.address,
      timestamp: Date.now(),
    };

    const response = await fetch(`/api/pools/${poolId}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contribution),
    });

    if (!response.ok) {
      throw new Error('Failed to add contribution to pool');
    }
  } catch (error) {
    console.error('Failed to contribute to iExec pool:', error);
    throw error;
  }
}

/**
 * Trigger TEE computation to calculate pool total
 *
 * This would call the iApp to:
 * 1. Fetch all protected data
 * 2. Decrypt in TEE
 * 3. Compute total
 * 4. Return only the total (not individual amounts)
 *
 * For now, this is a placeholder. Full implementation requires:
 * - Deployed iApp
 * - iExec SDK for task execution
 * - Oracle to update smart contract with result
 *
 * @param poolId - Pool ID
 * @returns Computed total amount
 */
export async function computePoolTotal(poolId: string): Promise<string> {
  // TODO: Implement iApp task execution
  // const iexec = new IExec({ ethProvider: provider });
  // const app = getIExecAppAddress();
  // const result = await iexec.task.run({
  //   app,
  //   params: { poolId },
  // });
  // return result.total;

  throw new Error('TEE computation not yet implemented - iApp deployment required');
}

/**
 * Get iExec pool details
 *
 * Returns pool information WITHOUT decrypting individual contributions.
 * Only shows:
 * - List of contributors (addresses)
 * - Protected data addresses (encrypted)
 * - Computed total (if available)
 *
 * @param poolId - Pool ID
 * @returns Pool with encrypted contributions
 */
export async function getIExecPool(poolId: string): Promise<IExecPool | null> {
  try {
    const response = await fetch(`/api/pools/${poolId}`);
    if (!response.ok) return null;

    const pool = await response.json();

    // Ensure it's an iExec pool
    if (pool.privacyMode !== 'iexec') {
      return null;
    }

    return pool as IExecPool;
  } catch (error) {
    console.error('Failed to fetch iExec pool:', error);
    return null;
  }
}

/**
 * Check if a pool can be finalized
 *
 * For iExec pools, we check if the computed total meets the threshold.
 * Individual amounts are never revealed.
 *
 * @param pool - iExec pool
 * @returns True if pool can be finalized
 */
export function canFinalizeIExecPool(pool: IExecPool): boolean {
  if (!pool.totalAmount) {
    // Total not computed yet
    return false;
  }

  const total = parseFloat(pool.totalAmount);
  return total >= pool.finalizationThreshold;
}
