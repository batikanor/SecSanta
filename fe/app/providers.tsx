'use client';

import * as React from 'react';
import { RainbowKitProvider, darkTheme, AvatarComponent } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

// Custom avatar component that ensures ENS resolution
const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ensImage}
      width={size}
      height={size}
      style={{ borderRadius: 999 }}
      alt="ENS Avatar"
    />
  ) : (
    <div
      style={{
        backgroundColor: '#dc2626',
        borderRadius: 999,
        height: size,
        width: size,
      }}
    />
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={CustomAvatar}
          theme={darkTheme({
            accentColor: '#dc2626',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
