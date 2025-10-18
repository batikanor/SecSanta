export interface Pool {
  id: string;
  name: string;
  creatorAddress: string;
  recipientAddress: string;
  recipientEnsName?: string;
  giftSuggestions: string[]; // Array of anonymous gift suggestions
  finalizationThreshold: number;
  contributors: Contributor[];
  status: 'ongoing' | 'ready_to_finalize' | 'finalized' | 'cancelled';
  totalAmount?: string; // Revealed when finalized (computed via FHE or TEE)
  createdAt: number;
  finalizedAt?: number;
  privacyMode?: 'none' | 'iexec' | 'zama'; // Privacy mode for contributions
  protectedDataAddresses?: string[]; // Addresses of encrypted data (for iExec/Zama)

  // Blockchain transaction data (when using iExec privacy mode)
  onChain?: boolean; // True if pool is on blockchain
  creationTxHash?: string; // Transaction hash for pool creation
  finalizationTxHash?: string; // Transaction hash for pool finalization
  blockNumber?: number; // Block number where pool was created
}

export interface Contributor {
  address: string;
  ensName?: string;
  amount: string; // ALWAYS encrypted - never revealed publicly
  joinedAt: number;
  giftSuggestion?: string; // Each contributor's suggestion (not shown publicly)
  contributionTxHash?: string; // Transaction hash for this contribution (on-chain)
  protectedDataAddress?: string; // iExec DataProtector NFT address for this contribution
}

export interface CreatePoolFormData {
  name: string;
  recipientAddress: string;
  selfContribution: string;
  finalizationThreshold: number;
  giftSuggestion: string;
}

export interface JoinPoolFormData {
  poolId: string;
  contribution: string;
  giftSuggestion?: string;
}
