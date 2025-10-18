/**
 * Smart Contract Interaction Service
 *
 * Handles all interactions with the SecSantaPool smart contract on Arbitrum Sepolia
 */

import { ethers } from 'ethers';

// Contract ABI - Interface for interacting with SecSantaPool contract
const CONTRACT_ABI = [
  "function createPool(bytes32 poolId, address payable recipient) external payable",
  "function contribute(bytes32 poolId, string memory protectedDataAddress) external payable",
  "function addCreatorContribution(bytes32 poolId, string memory protectedDataAddress) external",
  "function finalizePool(bytes32 poolId) external",
  "function getPool(bytes32 poolId) external view returns (address creator, address recipient, uint256 totalContributions, uint256 contributorCount, bool finalized)",
  "function getContributions(bytes32 poolId) external view returns (tuple(address contributor, uint256 amount, string protectedDataAddress, uint256 timestamp)[])",
  "function getProtectedDataAddresses(bytes32 poolId) external view returns (string[] memory)",
  "event PoolCreated(bytes32 indexed poolId, address indexed creator, address indexed recipient, uint256 timestamp)",
  "event ContributionAdded(bytes32 indexed poolId, address indexed contributor, uint256 amount, string protectedDataAddress, uint256 timestamp)",
  "event PoolFinalized(bytes32 indexed poolId, address indexed recipient, uint256 totalAmount, uint256 timestamp)"
];

// Contract address on Arbitrum Sepolia (will be set after deployment)
// Trim whitespace to handle any formatting issues
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS || '').trim();

/**
 * Custom BrowserProvider that disables ENS resolution for Arbitrum Sepolia
 */
class NoENSBrowserProvider extends ethers.BrowserProvider {
  // Override resolveName to prevent ENS lookups
  async resolveName(name: string | ethers.Addressable): Promise<string | null> {
    // Handle Addressable objects
    if (typeof name !== 'string') {
      return null;
    }

    // Trim whitespace that might be in the address
    const trimmedName = name.trim();

    // If it's already an address, return it (don't throw)
    if (ethers.isAddress(trimmedName)) {
      return ethers.getAddress(trimmedName);
    }

    // For non-addresses, return null (no ENS support)
    return null;
  }
}

/**
 * Get EIP-1193 provider from browser (with ENS disabled for Arbitrum Sepolia)
 */
function getProvider(): NoENSBrowserProvider {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found. Please connect your wallet.');
  }

  // Use custom provider that explicitly disables ENS
  const provider = new NoENSBrowserProvider(window.ethereum, {
    chainId: 421614,
    name: 'arbitrum-sepolia'
    // Don't set ensAddress at all - undefined disables ENS
  });

  return provider;
}

/**
 * Get contract instance with signer (without ENS resolution)
 */
async function getContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please deploy the contract first.');
  }

  const provider = getProvider();

  // Get signer without ENS resolution by specifying the address index
  const signer = await provider.getSigner(0);

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Convert pool ID string to bytes32 format for contract
 */
export function poolIdToBytes32(poolId: string): string {
  return ethers.encodeBytes32String(poolId);
}

/**
 * Create a new pool on-chain
 *
 * @param poolId - Unique pool identifier
 * @param recipientAddress - Address that will receive the funds
 * @param initialContribution - Initial ETH contribution in wei
 * @returns Transaction hash
 */
export async function createPoolOnChain(
  poolId: string,
  recipientAddress: string,
  initialContribution: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    console.log('📝 Creating pool on-chain (START)...', {
      poolId,
      recipientAddress,
      initialContribution,
      addressType: typeof recipientAddress,
      addressLength: recipientAddress?.length
    });

    // Strict validation: Address must be a hex string starting with 0x
    if (typeof recipientAddress !== 'string' ||
        !recipientAddress.startsWith('0x') ||
        recipientAddress.length !== 42) {
      throw new Error(
        `Invalid recipient address format. Expected 42-character hex string starting with 0x, got: ${recipientAddress}`
      );
    }

    // Validate it's a proper Ethereum address (checksum validation)
    if (!ethers.isAddress(recipientAddress)) {
      throw new Error('Invalid recipient address. Please use a valid Ethereum address.');
    }

    console.log('✓ Address validation passed');

    // Get contract instance
    console.log('🔌 Getting contract instance...');
    const contract = await getContract();
    console.log('✓ Contract instance obtained');

    const poolIdBytes = poolIdToBytes32(poolId);
    console.log('✓ Pool ID converted to bytes32:', poolIdBytes);

    // Convert to checksum address (no ENS resolution)
    const checksumAddress = ethers.getAddress(recipientAddress);
    console.log('✓ Address checksummed:', checksumAddress);

    // Prepare transaction parameters
    const txParams = {
      value: ethers.parseEther(initialContribution),
      gasLimit: 500000
    };
    console.log('✓ Transaction params prepared:', txParams);

    // Call createPool with ETH value
    console.log('📤 Sending transaction to contract...');
    const tx = await contract.createPool(
      poolIdBytes,
      checksumAddress,
      txParams
    );

    console.log('⏳ Waiting for transaction confirmation...', tx.hash);

    const receipt = await tx.wait();

    console.log('✅ Pool created on-chain!', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Failed to create pool on-chain (FULL ERROR):', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      info: (error as any)?.info
    });
    throw new Error(
      `Failed to create pool on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Add creator's protected data address after pool creation
 * (Used when creator contributes with encryption)
 */
export async function addCreatorProtectedData(
  poolId: string,
  protectedDataAddress: string
): Promise<{ txHash: string }> {
  try {
    console.log('🔐 Adding creator protected data...', { poolId, protectedDataAddress });

    const contract = await getContract();
    const poolIdBytes = poolIdToBytes32(poolId);

    const tx = await contract.addCreatorContribution(
      poolIdBytes,
      protectedDataAddress,
      { gasLimit: 200000 }
    );

    const receipt = await tx.wait();

    console.log('✅ Creator protected data added!', { txHash: receipt.hash });

    return { txHash: receipt.hash };
  } catch (error) {
    console.error('❌ Failed to add creator protected data:', error);
    throw new Error(
      `Failed to add protected data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Contribute to an existing pool
 *
 * @param poolId - Pool to contribute to
 * @param protectedDataAddress - Address of encrypted contribution (iExec NFT)
 * @param contributionAmount - Amount in ETH
 * @returns Transaction hash
 */
export async function contributeToPoolOnChain(
  poolId: string,
  protectedDataAddress: string,
  contributionAmount: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    console.log('💰 Contributing to pool on-chain...', {
      poolId,
      protectedDataAddress,
      contributionAmount
    });

    const contract = await getContract();
    const poolIdBytes = poolIdToBytes32(poolId);

    const tx = await contract.contribute(
      poolIdBytes,
      protectedDataAddress,
      {
        value: ethers.parseEther(contributionAmount),
        gasLimit: 300000
      }
    );

    console.log('⏳ Waiting for transaction confirmation...', tx.hash);

    const receipt = await tx.wait();

    console.log('✅ Contribution added on-chain!', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Failed to contribute on-chain:', error);
    throw new Error(
      `Failed to contribute on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Finalize a pool and transfer funds to recipient
 *
 * @param poolId - Pool to finalize
 * @returns Transaction hash
 */
export async function finalizePoolOnChain(
  poolId: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    console.log('🎁 Finalizing pool on-chain...', { poolId });

    const contract = await getContract();
    const poolIdBytes = poolIdToBytes32(poolId);

    const tx = await contract.finalizePool(poolIdBytes, {
      gasLimit: 200000
    });

    console.log('⏳ Waiting for finalization transaction...', tx.hash);

    const receipt = await tx.wait();

    console.log('✅ Pool finalized on-chain! Funds transferred to recipient.', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('❌ Failed to finalize pool on-chain:', error);
    throw new Error(
      `Failed to finalize pool: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get pool data from contract
 */
export async function getPoolFromContract(poolId: string): Promise<{
  creator: string;
  recipient: string;
  totalContributions: string;
  contributorCount: number;
  finalized: boolean;
}> {
  try {
    const contract = await getContract();
    const poolIdBytes = poolIdToBytes32(poolId);

    const [creator, recipient, totalContributions, contributorCount, finalized] =
      await contract.getPool(poolIdBytes);

    return {
      creator,
      recipient,
      totalContributions: ethers.formatEther(totalContributions),
      contributorCount: Number(contributorCount),
      finalized
    };
  } catch (error) {
    console.error('❌ Failed to get pool from contract:', error);
    throw error;
  }
}

/**
 * Get protected data addresses for TEE computation
 */
export async function getProtectedDataAddressesFromContract(
  poolId: string
): Promise<string[]> {
  try {
    const contract = await getContract();
    const poolIdBytes = poolIdToBytes32(poolId);

    const addresses = await contract.getProtectedDataAddresses(poolIdBytes);
    return addresses;
  } catch (error) {
    console.error('❌ Failed to get protected data addresses:', error);
    throw error;
  }
}

/**
 * Check if contract is deployed and accessible
 */
export async function isContractDeployed(): Promise<boolean> {
  try {
    if (!CONTRACT_ADDRESS) {
      return false;
    }

    const provider = getProvider();
    const code = await provider.getCode(CONTRACT_ADDRESS);

    // If code is '0x', contract is not deployed
    return code !== '0x';
  } catch (error) {
    console.error('❌ Failed to check contract deployment:', error);
    return false;
  }
}

/**
 * Get Arbiscan link for transaction
 */
export function getArbiscanTxLink(txHash: string): string {
  return `https://sepolia.arbiscan.io/tx/${txHash}`;
}

/**
 * Get Arbiscan link for address
 */
export function getArbiscanAddressLink(address: string): string {
  return `https://sepolia.arbiscan.io/address/${address}`;
}
