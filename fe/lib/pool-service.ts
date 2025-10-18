/**
 * Pool Service
 * Handles all pool-related operations
 * When DEBUG_MODE is true, uses mock data
 * When DEBUG_MODE is false, interacts with smart contracts
 */

import { Pool, CreatePoolFormData, JoinPoolFormData, Contributor } from '@/types/pool';
import {
  isMockMode,
  generateMockPoolId,
  getMockPools,
  addMockPool,
  updateMockPool,
  getMockPool,
  simulateTransactionDelay,
} from './debug-data';
import { getPrivacyMode, type PrivacyMode } from './privacy-config';
import { protectContribution, isDataProtectorAvailable } from './iexec-dataprotector';
import {
  createPoolOnChain,
  addCreatorProtectedData,
  contributeToPoolOnChain,
  finalizePoolOnChain,
  isContractDeployed,
} from './contract-service';

export class PoolService {
  /**
   * Fetch all pools
   */
  static async getPools(): Promise<Pool[]> {
    // Add delay in mock mode only
    if (isMockMode()) {
      await simulateTransactionDelay();
    }

    // For now, use the same storage (Upstash) regardless of network mode
    // When smart contracts are deployed, this will query the blockchain
    return await getMockPools();
  }

  /**
   * Get a specific pool by ID
   */
  static async getPool(poolId: string): Promise<Pool | null> {
    // Add delay in mock mode only
    if (isMockMode()) {
      await simulateTransactionDelay();
    }

    // For now, use the same storage (Upstash) regardless of network mode
    // When smart contracts are deployed, this will query the blockchain
    const pool = await getMockPool(poolId);
    return pool || null;
  }

  /**
   * Create a new pool
   */
  static async createPool(
    data: CreatePoolFormData,
    creatorAddress: string
  ): Promise<{ success: boolean; poolId?: string; error?: string }> {
    // Add delay in mock mode only
    if (isMockMode()) {
      await simulateTransactionDelay();
    }

    const poolId = await generateMockPoolId();
    const privacyMode = getPrivacyMode();

    let protectedDataAddresses: string[] | undefined;
    let creationTxHash: string | undefined;
    let blockNumber: number | undefined;
    let useBlockchain = false;

    // Check if we should use blockchain (contract is deployed)
    try {
      const contractDeployed = await isContractDeployed();
      useBlockchain = contractDeployed;
      console.log('🔍 Contract deployment check:', { contractDeployed, useBlockchain });
    } catch (error) {
      console.log('ℹ️ Contract check failed, using database only');
    }

    // If using blockchain (Arbitrum Sepolia with deployed contract)
    if (useBlockchain) {
      console.log('⛓️ Blockchain mode enabled - creating pool on-chain...');

      // Step 1: Optional encryption (only if iExec mode)
      if (privacyMode === 'iexec') {
        try {
          console.log('🔐 Attempting to encrypt contribution with iExec DataProtector...');

          const protectedData = await protectContribution({
            poolId: poolId,
            contributorAddress: creatorAddress,
            amount: data.selfContribution,
            timestamp: Date.now(),
          });

          protectedDataAddresses = [protectedData.address];
          console.log('✅ Contribution encrypted successfully!', {
            protectedDataAddress: protectedData.address,
          });
        } catch (encryptError) {
          console.warn('⚠️ Encryption failed, continuing with unencrypted blockchain storage:', encryptError);
          // Continue anyway - encryption is optional
        }
      }

      // Step 2: Create pool on-chain (with or without encryption)
      try {
        console.log('📝 Creating pool on blockchain...');
        const contractResult = await createPoolOnChain(
          poolId,
          data.recipientAddress,
          data.selfContribution
        );

        creationTxHash = contractResult.txHash;
        blockNumber = contractResult.blockNumber;

        console.log('✅ Pool created on-chain!', {
          txHash: creationTxHash,
          blockNumber: blockNumber,
        });

        // Step 3: Link protected data if encryption succeeded
        if (protectedDataAddresses && protectedDataAddresses[0]) {
          try {
            console.log('🔗 Linking encrypted data to on-chain pool...');
            await addCreatorProtectedData(poolId, protectedDataAddresses[0]);
            console.log('✅ Encrypted data linked successfully!');
          } catch (linkError) {
            console.warn('⚠️ Failed to link encrypted data, but pool is created:', linkError);
            // Pool is still created, just without encrypted link
          }
        }

        console.log('✅ Complete! Pool created on blockchain.');
      } catch (blockchainError) {
        console.error('❌ Failed to create pool on blockchain:', blockchainError);
        return {
          success: false,
          error: `Failed to create pool on blockchain: ${blockchainError instanceof Error ? blockchainError.message : 'Unknown error'}`,
        };
      }
    }

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
          amount: (privacyMode === 'iexec' && protectedDataAddresses) ? '[ENCRYPTED]' : data.selfContribution,
          joinedAt: Date.now(),
          giftSuggestion: data.giftSuggestion,
          protectedDataAddress: protectedDataAddresses?.[0], // Link to encrypted data NFT
        },
      ],
      status: data.finalizationThreshold === 1 ? 'finalized' : 'ongoing',
      createdAt: Date.now(),
      privacyMode: privacyMode, // Store privacy mode with pool
      protectedDataAddresses: protectedDataAddresses, // Store encrypted data addresses

      // Blockchain data (set if we used blockchain)
      onChain: useBlockchain,
      creationTxHash: creationTxHash,
      blockNumber: blockNumber,
    };

    // If threshold is 1, finalize immediately (but can't compute total with iExec yet)
    if (data.finalizationThreshold === 1) {
      if (privacyMode !== 'iexec') {
        newPool.totalAmount = data.selfContribution;
      }
      newPool.finalizedAt = Date.now();
    }

    await addMockPool(newPool);

    return { success: true, poolId };
  }

  /**
   * Join an existing pool
   */
  static async joinPool(
    data: JoinPoolFormData,
    contributorAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    // Add delay in mock mode only
    if (isMockMode()) {
      await simulateTransactionDelay();
    }

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

    let contributionAmount = data.contribution;
    let updatedProtectedDataAddresses = pool.protectedDataAddresses || [];
    let contributionTxHash: string | undefined;
    let protectedDataAddress: string | undefined;

    // If pool uses iExec privacy, encrypt the contribution AND contribute on-chain
    if (pool.privacyMode === 'iexec') {
      try {
        console.log('🔐 Encrypting contribution with iExec...');

        const isAvailable = await isDataProtectorAvailable();
        if (!isAvailable) {
          return {
            success: false,
            error: 'Wallet not connected. Please connect your wallet to contribute.',
          };
        }

        // Step 1: Encrypt the contribution
        const protectedData = await protectContribution({
          poolId: data.poolId,
          contributorAddress,
          amount: data.contribution,
          timestamp: Date.now(),
        });

        protectedDataAddress = protectedData.address;
        updatedProtectedDataAddresses.push(protectedData.address);
        contributionAmount = '[ENCRYPTED]'; // Hide the actual amount

        console.log('✅ Contribution encrypted!', {
          protectedDataAddress: protectedData.address,
        });

        // Step 2: Contribute on-chain (send real ETH + link protected data)
        console.log('💰 Contributing on blockchain...');
        const contractResult = await contributeToPoolOnChain(
          data.poolId,
          protectedData.address,
          data.contribution
        );

        contributionTxHash = contractResult.txHash;

        console.log('✅ Contribution added on-chain!', {
          txHash: contributionTxHash,
        });
      } catch (error) {
        console.error('❌ Failed to contribute with iExec:', error);
        return {
          success: false,
          error: `Failed to contribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    const newContributor: Contributor = {
      address: contributorAddress.toLowerCase(),
      amount: contributionAmount,
      joinedAt: Date.now(),
      giftSuggestion: data.giftSuggestion,
      contributionTxHash: contributionTxHash, // Blockchain transaction hash
      protectedDataAddress: protectedDataAddress, // iExec DataProtector NFT
    };

    const updatedContributors = [...pool.contributors, newContributor];
    const updatedSuggestions = data.giftSuggestion
      ? [...(pool.giftSuggestions || []), data.giftSuggestion]
      : (pool.giftSuggestions || []);

    // Check if pool should be finalized
    if (updatedContributors.length >= pool.finalizationThreshold) {
      // For on-chain pools, DON'T auto-finalize - let creator manually finalize to trigger blockchain tx
      if (pool.onChain) {
        // Just update the pool, keep status as 'ongoing'
        // Creator will need to manually finalize to trigger on-chain fund transfer
        await updateMockPool(data.poolId, {
          contributors: updatedContributors,
          giftSuggestions: updatedSuggestions,
          protectedDataAddresses: updatedProtectedDataAddresses,
          status: 'ready_to_finalize', // New status to indicate threshold met
        });
      } else {
        // For non-blockchain pools, auto-finalize in database
        let totalAmount: string | undefined;
        if (pool.privacyMode !== 'iexec') {
          totalAmount = updatedContributors.reduce((sum, c) => {
            return sum + parseFloat(c.amount);
          }, 0).toString();
        }

        await updateMockPool(data.poolId, {
          contributors: updatedContributors,
          giftSuggestions: updatedSuggestions,
          status: 'finalized',
          totalAmount,
          finalizedAt: Date.now(),
          protectedDataAddresses: updatedProtectedDataAddresses,
        });
      }
    } else {
      await updateMockPool(data.poolId, {
        contributors: updatedContributors,
        giftSuggestions: updatedSuggestions,
        protectedDataAddresses: updatedProtectedDataAddresses,
      });
    }

    return { success: true };
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

  /**
   * Finalize a pool (for iExec mode, this triggers TEE computation and on-chain transfer)
   */
  static async finalizePool(
    poolId: string,
    finalizerAddress: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    const pool = await getMockPool(poolId);
    if (!pool) {
      return { success: false, error: 'Pool not found' };
    }

    if (pool.status === 'finalized') {
      return { success: false, error: 'Pool already finalized' };
    }

    if (pool.creatorAddress.toLowerCase() !== finalizerAddress.toLowerCase()) {
      return { success: false, error: 'Only pool creator can finalize' };
    }

    // For iExec privacy mode, finalize on-chain
    if (pool.privacyMode === 'iexec') {
      try {
        console.log('🎁 Finalizing pool on-chain...');

        // TODO: Before finalizing, trigger iApp to compute total in TEE
        // This would involve calling iExec to run the computation
        // For now, we'll just finalize which transfers funds

        const result = await finalizePoolOnChain(poolId);

        console.log('✅ Pool finalized on-chain! Funds transferred to recipient.', {
          txHash: result.txHash,
        });

        // Update pool status in database
        await updateMockPool(poolId, {
          status: 'finalized',
          finalizedAt: Date.now(),
          finalizationTxHash: result.txHash,
        });

        return {
          success: true,
          txHash: result.txHash,
        };
      } catch (error) {
        console.error('❌ Failed to finalize pool on-chain:', error);
        return {
          success: false,
          error: `Failed to finalize pool: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // For non-encrypted pools, calculate total and finalize
    const totalAmount = pool.contributors.reduce((sum, c) => {
      return sum + parseFloat(c.amount);
    }, 0).toString();

    await updateMockPool(poolId, {
      status: 'finalized',
      totalAmount,
      finalizedAt: Date.now(),
    });

    return { success: true };
  }
}
