import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SecSanta - Secret Gift Pools',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [
    sepolia, // Testnet for development (primary)
    mainnet, // Mainnet for production (future)
  ],
  ssr: true,
});
