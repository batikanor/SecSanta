/**
 * iExec Configuration
 *
 * iExec DataProtector and TEE computation can work with any EVM chain.
 * We use Sepolia for testing and Mainnet for production.
 * The encrypted data lives on these chains, while TEE computation happens off-chain.
 */

/**
 * Get contract address for iExec-protected pools on current network
 */
export function getIExecContractAddress(networkMode: string): string {
  const addresses: Record<string, string> = {
    sepolia: process.env.NEXT_PUBLIC_POOL_CONTRACT_IEXEC_SEPOLIA || '',
    mainnet: process.env.NEXT_PUBLIC_POOL_CONTRACT_IEXEC_MAINNET || '',
  };
  return addresses[networkMode] || '';
}

/**
 * Get iApp address for confidential computation
 * iApp runs in iExec's TEE infrastructure, deployed once and works for all chains
 */
export function getIExecAppAddress(): string {
  return process.env.NEXT_PUBLIC_IEXEC_APP_ADDRESS || '';
}

/**
 * iExec DataProtector configuration
 * DataProtector SDK handles encryption/decryption and IPFS storage
 */
export const IEXEC_DATAPROTECTOR_CONFIG = {
  // DataProtector subgraph endpoints
  subgraphUrl: {
    sepolia: 'https://thegraph-product.iex.ec/subgraphs/name/bellecour/dataprotector',
    mainnet: 'https://thegraph-product.iex.ec/subgraphs/name/bellecour/dataprotector',
  },
  // IPFS gateway for encrypted data
  ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
  // Default encryption options
  encryptionOptions: {
    algorithm: 'aes-256-cbc',
  },
} as const;
