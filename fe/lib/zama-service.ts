/**
 * Zama FHE Contract Service
 * Handles encrypted token operations and contribution pooling with Zama's fhEVM
 * 
 * NOTE: This service should only be used on the client side
 */

'use client';

import { ethers } from 'ethers';
import { initSDK, createInstance, FhevmInstance } from '@zama-fhe/relayer-sdk/web';

// Import ABIs
import ContributionPoolABI from '@/contracts/ContributionPool.abi.json';
import BirthdayConfidentialTokenABI from '@/contracts/BirthdayConfidentialToken.abi.json';
import zamaDeployment from '@/contracts/zama-deployment.json';

// Cached FHEVM instance and initialization status
let fhevmInstance: FhevmInstance | null = null;
let sdkInitialized = false;

// Contract addresses on Sepolia
const TOKEN_ADDRESS = zamaDeployment.token.address;
const POOL_ADDRESS = zamaDeployment.pool.address;
const CHAIN_ID = zamaDeployment.chainId;

/**
 * Get Ethereum provider for Sepolia
 */
function getProvider(): ethers.BrowserProvider {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found. Please connect your wallet.');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get FHEVM instance for encryption
 * Configuration from official Zama docs: https://docs.zama.ai/protocol/relayer-sdk-guides/fhevm-relayer/initialization
 */
async function getFhevmInstance(): Promise<FhevmInstance> {
  if (!fhevmInstance) {
    // CRITICAL: Initialize the SDK first to load WASM
    if (!sdkInitialized) {
      console.log('🔄 Initializing Zama SDK (loading WASM)...');
      await initSDK();
      sdkInitialized = true;
      console.log('✅ Zama SDK initialized');
    }
    
    // Official Sepolia configuration for Zama fhEVM
    const config = {
      // ACL_CONTRACT_ADDRESS (FHEVM Host chain)
      aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
      // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
      kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
      // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain)
      inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
      // DECRYPTION_ADDRESS (Gateway chain)
      verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
      // INPUT_VERIFICATION_ADDRESS (Gateway chain)
      verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
      // FHEVM Host chain id
      chainId: 11155111,
      // Gateway chain id
      gatewayChainId: 55815,
      // Optional RPC provider to host chain
      network: window.ethereum,
      // Relayer URL
      relayerUrl: 'https://relayer.testnet.zama.cloud',
    };
    
    console.log('🔧 Creating FHEVM instance...');
    fhevmInstance = await createInstance(config);
    console.log('✅ FHEVM instance created successfully');
  }
  return fhevmInstance;
}

/**
 * Get contract instances with signer
 */
async function getContracts(): Promise<{
  token: ethers.Contract;
  pool: ethers.Contract;
  signer: ethers.Signer;
}> {
  const provider = getProvider();
  const signer = await provider.getSigner();

  const token = new ethers.Contract(TOKEN_ADDRESS, BirthdayConfidentialTokenABI, signer);
  const pool = new ethers.Contract(POOL_ADDRESS, ContributionPoolABI, signer);

  return { token, pool, signer };
}

/**
 * Check if user is on Sepolia network
 */
export async function checkNetwork(): Promise<boolean> {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return Number(network.chainId) === CHAIN_ID;
  } catch (error) {
    console.error('Failed to check network:', error);
    return false;
  }
}

/**
 * Switch to Sepolia network
 */
export async function switchToSepolia(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + CHAIN_ID.toString(16) }],
    });
  } catch (error: any) {
    // Chain not added to MetaMask
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x' + CHAIN_ID.toString(16),
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

/**
 * Mint confidential tokens to a user (only owner can call)
 * Used to distribute initial tokens for testing
 */
export async function mintTokens(
  recipientAddress: string,
  amount: number
): Promise<{ txHash: string }> {
  try {
    console.log('💎 Minting confidential tokens...', { recipientAddress, amount });

    const { token, signer } = await getContracts();
    const signerAddress = await signer.getAddress();

    // Get FHEVM instance for encryption
    const fhevm = await getFhevmInstance();

    // Encrypt the amount
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    const input = fhevm.createEncryptedInput(TOKEN_ADDRESS, signerAddress);
    input.add64(amountInWei);
    const encryptedInput = await input.encrypt();

    // Call mint function with encrypted amount
    const tx = await token.mint(
      recipientAddress,
      encryptedInput.handles[0],
      encryptedInput.inputProof,
      {
        gasLimit: 500000,
      }
    );

    console.log('⏳ Waiting for mint transaction...', tx.hash);
    const receipt = await tx.wait();

    console.log('✅ Tokens minted successfully!', { txHash: receipt.hash });

    return { txHash: receipt.hash };
  } catch (error) {
    console.error('❌ Failed to mint tokens:', error);
    throw new Error(
      `Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Approve ContributionPool contract as operator for confidential transfers
 * Sets approval valid for 30 days (plenty of time for testing)
 */
export async function approvePoolAsOperator(): Promise<{ txHash: string }> {
  try {
    console.log('✅ Approving pool as operator...');

    const { token } = await getContracts();

    // setOperator takes (address, uint48 validUntil)
    // Valid for 30 days from now (plenty of time)
    const validUntil = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);

    console.log('📅 Approval valid until:', new Date(validUntil * 1000).toLocaleString());

    const tx = await token.setOperator(POOL_ADDRESS, validUntil, {
      gasLimit: 200000,
    });

    console.log('⏳ Waiting for approval transaction...', tx.hash);
    const receipt = await tx.wait();

    console.log('✅ Pool approved as operator!', { 
      txHash: receipt.hash,
      validUntil: new Date(validUntil * 1000).toLocaleString()
    });

    return { txHash: receipt.hash };
  } catch (error) {
    console.error('❌ Failed to approve pool:', error);
    throw new Error(
      `Failed to approve pool: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if pool is approved as operator
 */
export async function isPoolApproved(userAddress: string): Promise<boolean> {
  try {
    const { token } = await getContracts();
    return await token.isOperator(userAddress, POOL_ADDRESS);
  } catch (error) {
    console.error('Failed to check approval:', error);
    return false;
  }
}

/**
 * Create a new contribution pool with encrypted initial contribution
 */
export async function createZamaPool(data: {
  name: string;
  recipientAddress: string;
  minContributors: number;
  giftSuggestion: string;
  initialContribution: number; // Amount in tokens (will be encrypted)
}): Promise<{ poolId: number; txHash: string; blockNumber: number }> {
  try {
    console.log('🎁 Creating Zama pool...', data);

    // Check network
    const onSepolia = await checkNetwork();
    if (!onSepolia) {
      await switchToSepolia();
    }

    const { pool, signer } = await getContracts();
    const signerAddress = await signer.getAddress();

    // ALWAYS approve pool as operator before creating pool
    // (Operator approvals can expire, so we do this every time to be safe)
    console.log('🔑 Approving pool as operator (required for confidential transfers)...');
    await approvePoolAsOperator();

    // Get FHEVM instance and encrypt contribution amount
    const fhevm = await getFhevmInstance();
    const amountInWei = ethers.parseUnits(data.initialContribution.toString(), 18);
    
    console.log('🔐 Encrypting amount:', {
      original: data.initialContribution,
      wei: amountInWei.toString(),
    });
    
    const input = fhevm.createEncryptedInput(TOKEN_ADDRESS, signerAddress);
    input.add64(amountInWei);
    const encryptedInput = await input.encrypt();
    
    console.log('✅ Encrypted input created:', {
      handles: encryptedInput.handles,
      hasProof: !!encryptedInput.inputProof,
      proofLength: encryptedInput.inputProof?.length,
    });

    // Create pool on-chain
    console.log('📝 Creating pool on-chain with params:', {
      name: data.name,
      recipient: data.recipientAddress,
      minContributors: data.minContributors,
      suggestion: data.giftSuggestion,
      encryptedHandle: encryptedInput.handles[0],
      hasProof: !!encryptedInput.inputProof,
    });
    
    const tx = await pool.createPool(
      data.name,
      data.recipientAddress,
      data.minContributors,
      data.giftSuggestion,
      encryptedInput.handles[0],
      encryptedInput.inputProof,
      { gasLimit: 1000000 }
    );

    console.log('⏳ Waiting for pool creation transaction...', tx.hash);
    const receipt = await tx.wait();

    // Extract poolId from event
    const poolCreatedEvent = receipt.logs
      .map((log: any) => {
        try {
          return pool.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event: any) => event?.name === 'PoolCreated');

    const poolId = poolCreatedEvent?.args?.poolId
      ? Number(poolCreatedEvent.args.poolId)
      : 1; // Fallback if event parsing fails

    console.log('✅ Zama pool created successfully!', {
      poolId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    return {
      poolId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('❌ Failed to create Zama pool:', error);
    throw new Error(
      `Failed to create pool: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Contribute to an existing pool with encrypted amount
 */
export async function contributeToZamaPool(
  poolId: number,
  amount: number,
  giftSuggestion: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    console.log('💰 Contributing to Zama pool...', { poolId, amount, giftSuggestion });

    // Check network
    const onSepolia = await checkNetwork();
    if (!onSepolia) {
      await switchToSepolia();
    }

    const { pool, signer } = await getContracts();
    const signerAddress = await signer.getAddress();

    // ALWAYS approve pool as operator before contributing
    // (Operator approvals can expire, so we do this every time to be safe)
    console.log('🔑 Approving pool as operator (required for confidential transfers)...');
    await approvePoolAsOperator();

    // Get FHEVM instance and encrypt contribution amount
    const fhevm = await getFhevmInstance();
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    const input = fhevm.createEncryptedInput(TOKEN_ADDRESS, signerAddress);
    input.add64(amountInWei);
    const encryptedInput = await input.encrypt();

    // Contribute to pool
    const tx = await pool.contribute(
      poolId,
      encryptedInput.handles[0],
      encryptedInput.inputProof,
      giftSuggestion,
      {
        gasLimit: 800000,
      }
    );

    console.log('⏳ Waiting for contribution transaction...', tx.hash);
    const receipt = await tx.wait();

    console.log('✅ Contribution successful!', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('❌ Failed to contribute to Zama pool:', error);
    throw new Error(
      `Failed to contribute: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Finalize a pool and transfer funds to recipient
 * This will trigger decryption of the total amount via KMS oracle
 */
export async function finalizeZamaPool(
  poolId: number,
  decryptOffChain: boolean = true
): Promise<{ txHash: string; totalAmount?: string }> {
  try {
    console.log('🎁 Finalizing Zama pool...', { poolId });

    const { pool } = await getContracts();

    const tx = await pool.finalize(poolId, {
      gasLimit: 800000, // Increased for FHE operations + decryption request
    });

    console.log('⏳ Waiting for finalization transaction...', tx.hash);
    const receipt = await tx.wait();

    console.log('✅ Pool finalized! Decryption request sent to KMS.', {
      txHash: receipt.hash,
    });

    // Optionally wait for decryption to complete
    let totalAmount: string | undefined;
    if (decryptOffChain) {
      try {
        totalAmount = await decryptPoolTotalOffChain(pool, poolId);
      } catch (error) {
        console.warn('⚠️ Off-chain decryption failed:', error);
      }
    }

    return { txHash: receipt.hash, totalAmount };
  } catch (error) {
    console.error('❌ Failed to finalize Zama pool:', error);
    throw new Error(
      `Failed to finalize pool: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function decryptPoolTotalOffChain(pool: ethers.Contract, poolId: number): Promise<string> {
  const handleRaw: string = await pool.poolTotalHandle(poolId);
  if (handleRaw === ethers.ZeroHash) {
    throw new Error('Pool total handle not available');
  }
  const handleHex = ethers.hexlify(handleRaw);
  const fhevm = await getFhevmInstance();
  const result = await fhevm.publicDecrypt([handleHex]);
  const decrypted = result[handleHex];

  if (decrypted === undefined) {
    throw new Error('Relayer did not return a decrypted value');
  }

  const totalBigInt = BigInt(decrypted.toString());
  console.log('✅ Off-chain decryption complete:', totalBigInt.toString(), 'wei');
  console.log('   =', ethers.formatUnits(totalBigInt, 18), 'BCT');

  return totalBigInt.toString();
}

/**
 * Get pool information from contract
 */
export async function getZamaPool(poolId: number): Promise<{
  name: string;
  creator: string;
  recipient: string;
  totalPlain: string; // Raw wei value (not formatted) - Only visible after finalization and decryption
  minContributors: number;
  giftSuggestion: string;
  contributorCount: number;
  finalized: boolean;
}> {
  try {
    const { pool } = await getContracts();

    const [name, creator, recipient, totalPlain, minContributors, giftSuggestion, contributorCount, finalized] =
      await pool.getPool(poolId);

    console.log('📊 Raw pool data from contract:', {
      poolId,
      name,
      totalPlain: totalPlain.toString(),
      contributorCount: Number(contributorCount),
      finalized,
    });

    return {
      name,
      creator,
      recipient,
      totalPlain: totalPlain.toString(), // Keep as raw wei string for BigInt conversion later
      minContributors: Number(minContributors),
      giftSuggestion,
      contributorCount: Number(contributorCount),
      finalized,
    };
  } catch (error) {
    console.error('Failed to get pool:', error);
    throw error;
  }
}

/**
 * Check if user has contributed to a pool
 */
export async function hasUserContributed(
  poolId: number,
  userAddress: string
): Promise<boolean> {
  try {
    const { pool } = await getContracts();
    return await pool.hasContributed(poolId, userAddress);
  } catch (error) {
    console.error('Failed to check contribution status:', error);
    return false;
  }
}

/**
 * Get Sepolia Etherscan link for transaction
 */
export function getSepoliaTxLink(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Get Sepolia Etherscan link for address
 */
export function getSepoliaAddressLink(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}

/**
 * Get contract addresses
 */
export function getContractAddresses() {
  return {
    token: TOKEN_ADDRESS,
    pool: POOL_ADDRESS,
    chainId: CHAIN_ID,
  };
}
