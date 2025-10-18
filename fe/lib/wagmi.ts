import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SecSanta - Secret Gift Pools',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [
    sepolia, // Ethereum testnet for regular contracts
    arbitrumSepolia, // Arbitrum Sepolia for iExec DataProtector (chain ID 421614)
    mainnet, // Mainnet for production (future)
  ],
  ssr: true,
});
