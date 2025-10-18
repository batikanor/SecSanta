export interface Pool {
  id: string;
  name: string;
  creatorAddress: string;
  recipientAddress: string;
  recipientEnsName?: string;
  giftSuggestions: string[]; // Array of anonymous gift suggestions
  finalizationThreshold: number;
  contributors: Contributor[];
  status: 'ongoing' | 'finalized' | 'cancelled';
  totalAmount?: string; // Hidden until finalized
  createdAt: number;
  finalizedAt?: number;
}

export interface Contributor {
  address: string;
  ensName?: string;
  amount: string; // Hidden until pool finalized
  joinedAt: number;
  giftSuggestion?: string; // Each contributor's suggestion (not shown publicly)
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
