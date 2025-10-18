/**
 * Pool Service
 * Handles all pool-related operations
 * When DEBUG_MODE is true, uses mock data
 * When DEBUG_MODE is false, interacts with smart contracts
 */

import { Pool, CreatePoolFormData, JoinPoolFormData, Contributor } from '@/types/pool';
import {
  isBlockchainMockMode,
  generateMockPoolId,
  getMockPools,
  addMockPool,
  updateMockPool,
  getMockPool,
  simulateTransactionDelay,
} from './debug-data';

export class PoolService {
  /**
   * Fetch all pools
   */
  static async getPools(): Promise<Pool[]> {
    if (isBlockchainMockMode()) {
      // Return mock data in debug mode
      await simulateTransactionDelay();
      return await getMockPools();
    }

    // TODO: Implement smart contract interaction
    throw new Error('Smart contract integration not yet implemented');
  }

  /**
   * Get a specific pool by ID
   */
  static async getPool(poolId: string): Promise<Pool | null> {
    if (isBlockchainMockMode()) {
      await simulateTransactionDelay();
      const pool = await getMockPool(poolId);
      return pool || null;
    }

    // TODO: Implement smart contract interaction
    throw new Error('Smart contract integration not yet implemented');
  }

  /**
   * Create a new pool
   */
  static async createPool(
    data: CreatePoolFormData,
    creatorAddress: string
  ): Promise<{ success: boolean; poolId?: string; error?: string }> {
    if (isBlockchainMockMode()) {
      await simulateTransactionDelay();

      const poolId = await generateMockPoolId();
      const newPool: Pool = {
        id: poolId,
        name: data.name,
        creatorAddress: creatorAddress.toLowerCase(),
        recipientAddress: data.recipientAddress.toLowerCase(),
        giftSuggestions: [data.giftSuggestion], // Array of suggestions
        finalizationThreshold: data.finalizationThreshold,
        contributors: [
          {
            address: creatorAddress.toLowerCase(),
            amount: data.selfContribution,
            joinedAt: Date.now(),
            giftSuggestion: data.giftSuggestion,
          },
        ],
        status: data.finalizationThreshold === 1 ? 'finalized' : 'ongoing',
        createdAt: Date.now(),
      };

      // If threshold is 1, finalize immediately
      if (data.finalizationThreshold === 1) {
        newPool.totalAmount = data.selfContribution;
        newPool.finalizedAt = Date.now();
      }

      await addMockPool(newPool);

      return { success: true, poolId };
    }

    // TODO: Implement smart contract interaction
    throw new Error('Smart contract integration not yet implemented');
  }

  /**
   * Join an existing pool
   */
  static async joinPool(
    data: JoinPoolFormData,
    contributorAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    if (isBlockchainMockMode()) {
      await simulateTransactionDelay();

      const pool = await getMockPool(data.poolId);
      if (!pool) {
        return { success: false, error: 'Pool not found' };
      }

      if (pool.status !== 'ongoing') {
        return { success: false, error: 'Pool is not accepting contributions' };
      }

      // Check if user already contributed
      const alreadyContributed = pool.contributors.some(
        c => c.address.toLowerCase() === contributorAddress.toLowerCase()
      );
      if (alreadyContributed) {
        return { success: false, error: 'You have already contributed to this pool' };
      }

      const newContributor: Contributor = {
        address: contributorAddress.toLowerCase(),
        amount: data.contribution,
        joinedAt: Date.now(),
        giftSuggestion: data.giftSuggestion,
      };

      const updatedContributors = [...pool.contributors, newContributor];
      const updatedSuggestions = data.giftSuggestion
        ? [...(pool.giftSuggestions || []), data.giftSuggestion]
        : (pool.giftSuggestions || []);

      // Check if pool should be finalized
      if (updatedContributors.length >= pool.finalizationThreshold) {
        const totalAmount = updatedContributors.reduce((sum, c) => {
          return sum + parseFloat(c.amount);
        }, 0);

        await updateMockPool(data.poolId, {
          contributors: updatedContributors,
          giftSuggestions: updatedSuggestions,
          status: 'finalized',
          totalAmount: totalAmount.toString(),
          finalizedAt: Date.now(),
        });
      } else {
        await updateMockPool(data.poolId, {
          contributors: updatedContributors,
          giftSuggestions: updatedSuggestions,
        });
      }

      return { success: true };
    }

    // TODO: Implement smart contract interaction
    throw new Error('Smart contract integration not yet implemented');
  }

  /**
   * Get pools where user is a contributor
   */
  static async getUserPools(userAddress: string): Promise<Pool[]> {
    const allPools = await this.getPools();
    return allPools.filter(pool =>
      pool.contributors.some(c => c.address.toLowerCase() === userAddress.toLowerCase())
    );
  }
}
