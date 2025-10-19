/**
 * Zama Pool Service
 * Handles pool operations when using Zama FHE mode
 */

'use client';

import { ethers } from 'ethers';
import { Pool, CreatePoolFormData, JoinPoolFormData } from '@/types/pool';
import { isZamaMode } from './network-config';
import {
  createZamaPool,
  contributeToZamaPool,
  finalizeZamaPool,
  getZamaPool,
  hasUserContributed,
  getContractAddresses,
} from './zama-service';
import {
  getMockPools,
  addMockPool,
  updateMockPool,
  getMockPool,
  generateMockPoolId,
} from './debug-data';

export class ZamaPoolService {
  /**
   * Check if user should be using Zama mode
   */
  static isZamaModeActive(): boolean {
    return isZamaMode();
  }

  /**
   * Create a new pool with Zama FHE encryption
   */
  static async createPool(
    data: CreatePoolFormData,
    creatorAddress: string
  ): Promise<{ success: boolean; poolId?: string; error?: string }> {
    try {
      // Create pool on-chain with encrypted contribution
      const result = await createZamaPool({
        name: data.name,
        recipientAddress: data.recipientAddress,
        minContributors: data.finalizationThreshold,
        giftSuggestion: data.giftSuggestion,
        initialContribution: parseFloat(data.selfContribution),
      });

      // Get current contract addresses
      const { pool: poolContractAddress } = getContractAddresses();

      // Store pool metadata in database (amounts are encrypted on-chain)
      const newPool: Pool = {
        id: result.poolId.toString(),
        name: data.name,
        creatorAddress: creatorAddress.toLowerCase(),
        recipientAddress: data.recipientAddress.toLowerCase(),
        giftSuggestions: [data.giftSuggestion],
        finalizationThreshold: data.finalizationThreshold,
        contributors: [
          {
            address: creatorAddress.toLowerCase(),
            amount: '[ENCRYPTED]', // Amount is encrypted on-chain
            joinedAt: Date.now(),
            giftSuggestion: data.giftSuggestion,
          },
        ],
        status: data.finalizationThreshold === 1 ? 'ready_to_finalize' : 'ongoing',
        createdAt: Date.now(),
        privacyMode: 'zama', // Mark as Zama mode
        onChain: true,
        creationTxHash: result.txHash,
        blockNumber: result.blockNumber,
        contractAddress: poolContractAddress, // Store contract address for validation
      };

      await addMockPool(newPool);

      return { success: true, poolId: result.poolId.toString() };
    } catch (error) {
      console.error('Failed to create Zama pool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Contribute to an existing Zama pool
   */
  static async contributeToPool(
    data: JoinPoolFormData,
    contributorAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pool = await getMockPool(data.poolId);
      if (!pool) {
        return { success: false, error: 'Pool not found' };
      }

      // Validate pool is from current contract deployment
      const { pool: currentPoolAddress } = getContractAddresses();
      if (pool.contractAddress && pool.contractAddress.toLowerCase() !== currentPoolAddress.toLowerCase()) {
        return { success: false, error: 'This pool is from an old contract deployment. Please create a new pool.' };
      }

      if (pool.status !== 'ongoing') {
        return { success: false, error: 'Pool is not accepting contributions' };
      }

      // Check if already contributed (on-chain)
      const poolIdNum = parseInt(data.poolId);
      const alreadyContributed = await hasUserContributed(poolIdNum, contributorAddress);
      if (alreadyContributed) {
        return { success: false, error: 'You have already contributed to this pool' };
      }

      // Contribute on-chain with encrypted amount
      const result = await contributeToZamaPool(
        poolIdNum,
        parseFloat(data.contribution),
        data.giftSuggestion || ''
      );

      // Update pool in database
      const updatedContributors = [
        ...pool.contributors,
        {
          address: contributorAddress.toLowerCase(),
          amount: '[ENCRYPTED]',
          joinedAt: Date.now(),
          giftSuggestion: data.giftSuggestion,
          contributionTxHash: result.txHash,
        },
      ];

      const updatedSuggestions = data.giftSuggestion
        ? [...(pool.giftSuggestions || []), data.giftSuggestion]
        : pool.giftSuggestions;

      // Check if ready to finalize
      const status =
        updatedContributors.length >= pool.finalizationThreshold
          ? 'ready_to_finalize'
          : 'ongoing';

      await updateMockPool(data.poolId, {
        contributors: updatedContributors,
        giftSuggestions: updatedSuggestions,
        status,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to contribute to Zama pool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Finalize a Zama pool (triggers decryption and fund transfer)
   */
  static async finalizePool(
    poolId: string,
    finalizerAddress: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      const pool = await getMockPool(poolId);
      if (!pool) {
        return { success: false, error: 'Pool not found' };
      }

      // Validate pool is from current contract deployment
      const { pool: currentPoolAddress } = getContractAddresses();
      if (pool.contractAddress && pool.contractAddress.toLowerCase() !== currentPoolAddress.toLowerCase()) {
        return { success: false, error: 'This pool is from an old contract deployment. Cannot finalize.' };
      }

      if (pool.status === 'finalized') {
        return { success: false, error: 'Pool already finalized' };
      }

      if (pool.creatorAddress.toLowerCase() !== finalizerAddress.toLowerCase()) {
        return { success: false, error: 'Only pool creator can finalize' };
      }

      // Finalize on-chain (triggers decryption and transfer)
      const poolIdNum = parseInt(poolId);
      const result = await finalizeZamaPool(poolIdNum, true); // Wait for decryption

      // Update pool status with decrypted total if available
      const updateData: Partial<Pool> = {
        status: 'finalized',
        finalizedAt: Date.now(),
        finalizationTxHash: result.txHash,
      };

      // Add decrypted total if available
      if (result.totalAmount && result.totalAmount !== '0') {
        try {
          // Convert from wei to BCT (18 decimals - standard ERC20) using ethers for precision
          const totalInBCT = ethers.formatUnits(result.totalAmount, 18);
          updateData.totalAmount = totalInBCT;
          console.log('💰 Decrypted total:', totalInBCT, 'BCT (raw wei:', result.totalAmount, ')');
        } catch (error) {
          console.error('Failed to convert total amount:', error);
        }
      } else {
        console.warn('⚠️ Decrypted total is 0 - this might indicate:');
        console.warn('   1. KMS callback not completed yet');
        console.warn('   2. No contributions were actually made on-chain');
        console.warn('   3. Contract state issue');
      }

      await updateMockPool(poolId, updateData);

      return {
        success: true,
        txHash: result.txHash,
      };
    } catch (error) {
      console.error('Failed to finalize Zama pool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get pool data (combines on-chain and database data)
   */
  static async getPool(poolId: string): Promise<Pool | null> {
    try {
      // Get metadata from database
      const pool = await getMockPool(poolId);
      if (!pool) {
        return null;
      }

      // Validate that this pool belongs to current contract deployment
      const { pool: currentPoolAddress } = getContractAddresses();
      if (pool.contractAddress && pool.contractAddress.toLowerCase() !== currentPoolAddress.toLowerCase()) {
        console.warn(`Pool ${poolId} is from old contract (${pool.contractAddress}), current is ${currentPoolAddress}`);
        return null; // Don't show pools from old deployments
      }

      // If finalized, fetch the decrypted total from on-chain
      if (pool.status === 'finalized') {
        try {
          const poolIdNum = parseInt(poolId);
          const onChainData = await getZamaPool(poolIdNum);
          
          console.log('🔍 Checking finalized pool on-chain:', {
            poolId,
            totalPlain: onChainData.totalPlain,
            contributorCount: onChainData.contributorCount,
          });
          
          // Update with decrypted total if available
          if (onChainData.totalPlain !== '0') {
            // Convert from wei to BCT using ethers for precision
            const totalInBCT = ethers.formatUnits(onChainData.totalPlain, 18);
            pool.totalAmount = totalInBCT;
            
            // Update database with the total if not already there
            if (!pool.totalAmount || pool.totalAmount === '0') {
              await updateMockPool(poolId, { totalAmount: totalInBCT });
            }
          } else {
            console.warn('⚠️ totalPlain is still 0 for finalized pool - KMS callback may not have completed');
          }
        } catch (error) {
          console.warn('Could not fetch on-chain data:', error);
          // Continue with database data
        }
      }

      return pool;
    } catch (error) {
      console.error('Failed to get Zama pool:', error);
      return null;
    }
  }

  /**
   * Get all pools (filtered to current contract)
   */
  static async getPools(): Promise<Pool[]> {
    const allPools = await getMockPools();
    const { pool: currentPoolAddress } = getContractAddresses();
    
    // Filter to only show Zama pools that match current contract deployment
    const validPools = allPools.filter(pool => {
      // If not a Zama pool, include it (for other modes)
      if (pool.privacyMode !== 'zama') {
        return true;
      }
      
      // For Zama pools: MUST have contractAddress AND it must match current deployment
      // This filters out old pools from previous contract deployments
      return pool.contractAddress && pool.contractAddress.toLowerCase() === currentPoolAddress.toLowerCase();
    });
    
    return validPools;
  }

  /**
   * Get contract addresses for display
   */
  static getContractInfo() {
    return getContractAddresses();
  }
}

