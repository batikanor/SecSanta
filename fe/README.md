# SecSanta - Secret Gift Pools

A decentralized application for creating anonymous gift pools with friends, powered by Ethereum and ENS.

## 🎯 Overview

SecSanta allows users to:
- Create gift pools for recipients with ENS name support
- Contribute anonymously (amounts hidden until finalization)
- Auto-finalize when contribution threshold is met
- View beautiful ENS names instead of cryptic addresses

## 🏆 Bounty Qualifications

This project is designed to qualify for multiple ETHRome 2025 bounties:

### ✅ ENS Bounty ($5,000)
- **Full ENS Integration**: Using `useEnsName` and `useEnsAddress` hooks from wagmi
- **ENS Display Component**: Shows ENS names for addresses when available
- **ENS Input Component**: Accepts both ENS names and addresses, with automatic resolution
- **Files**: `components/ENSDisplay.tsx`, `components/ENSInput.tsx`

### ✅ BuidlGuidl Bounty ($2,000)
- **Modern Web3 Stack**: Built with Next.js 14, TypeScript, Tailwind CSS
- **RainbowKit**: Wallet connection with excellent UX
- **Wagmi v2**: Latest React hooks for Ethereum
- **Clean Architecture**: Separation of concerns, reusable components

### ✅ Base Miniapp Potential ($5,000)
- **Miniapp-Ready**: Can be adapted as a Farcaster miniapp
- **Social Features**: Shareable pool links, group gifting mechanics
- **Mobile-Friendly**: Responsive design works on all devices

## 🚀 Features

### Debug Mode
The app includes a comprehensive DEBUG mode for development:
- Set `NEXT_PUBLIC_FE_DEBUG_MODE=true` in `.env.local`
- Uses mock data and simulated transactions
- Mock ENS resolution for testing
- Easy transition to production when smart contracts are ready

### ENS Integration
- Automatic ENS name resolution
- Display ENS names throughout the UI
- Accept ENS names in recipient address input
- Fallback to truncated addresses when ENS is unavailable

### User Flow
1. **Connect Wallet**: MetaMask/WalletConnect via RainbowKit
2. **Create Pool**: Set name, recipient, contribution, threshold, gift idea
3. **Share Pool**: Copy link and share with friends
4. **Join Pool**: Friends contribute anonymously
5. **Auto-Finalize**: Pool finalizes when threshold is met

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MetaMask or other Web3 wallet

### Setup

1. **Install dependencies**:
```bash
cd fe
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Debug mode - set to true for mock data
NEXT_PUBLIC_FE_DEBUG_MODE=true

# Get your project ID from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Chain configuration
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

3. **Run development server**:
```bash
npm run dev
```

4. **Open browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Project Structure
```
fe/
├── app/                    # Next.js 14 App Router
│   ├── dashboard/         # Dashboard page
│   ├── pool/
│   │   ├── create/        # Create pool page
│   │   └── [id]/          # Pool detail page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/login page
│   ├── providers.tsx      # Web3 providers
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ENSDisplay.tsx     # Display ENS names
│   ├── ENSInput.tsx       # Input with ENS resolution
│   └── Header.tsx         # App header
├── lib/                   # Libraries and utilities
│   ├── wagmi.ts           # Wagmi configuration
│   ├── debug-data.ts      # Mock data for debug mode
│   ├── pool-service.ts    # Pool service layer
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript types
    └── pool.ts            # Pool type definitions
```

### Key Technologies
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **RainbowKit**: Wallet connection UI
- **Wagmi v2**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library

## 🔧 Debug Mode

### How it Works
When `NEXT_PUBLIC_FE_DEBUG_MODE=true`:
- Mock data is used instead of blockchain calls
- Simulated transaction delays (2 seconds)
- Mock ENS resolution with predefined names
- No wallet signatures required for testing

### Mock Data
Edit `lib/debug-data.ts` to customize:
- Mock wallet addresses
- Mock ENS names
- Initial pool data

### Transitioning to Production
When your teammate has smart contracts ready:
1. Set `NEXT_PUBLIC_FE_DEBUG_MODE=false` in `.env.local`
2. Implement smart contract calls in `lib/pool-service.ts`
3. Replace `throw new Error(...)` with actual contract interactions

## 🎨 UI/UX

### Design System
- **Primary Color**: Red gradient (Christmas/gift theme)
- **Secondary Color**: Green (festive accent)
- **Typography**: Inter font family
- **Components**: Custom button styles, cards, badges

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interfaces

## 🔐 Security Considerations

### Current (Debug Mode)
- No actual blockchain transactions
- Mock data stored in memory
- For development/demo purposes only

### Production (When Smart Contracts Ready)
- Wallet signatures required
- On-chain transaction validation
- ENS resolution on mainnet
- Contribution amounts encrypted until finalization

## 🧪 Testing User Flow

### User 1 Flow (Create Pool)
1. Connect wallet
2. Navigate to "Create New Pool"
3. Fill in form:
   - Pool Name: "Alice's Birthday"
   - Recipient: "vitalik.eth" or "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
   - Contribution: "0.1" ETH
   - Minimum Contributors: "3"
   - Gift Suggestion: "New laptop for Alice"
4. Click "Create Pool"
5. Share pool link with friends

### User 2 Flow (Join Pool)
1. Click shared pool link
2. Connect wallet (if not connected)
3. View pool details
4. Enter contribution amount: "0.15" ETH
5. Click "Join Pool"
6. Wait for more contributors

### User 3 Flow (Finalize Pool)
1. Click shared pool link
2. Connect wallet
3. Enter contribution: "0.2" ETH
4. Click "Join Pool"
5. Pool auto-finalizes (threshold met)
6. View total amount and all contributions

## 📝 Smart Contract Integration Guide

When your teammate is ready with smart contracts, update `lib/pool-service.ts`:

```typescript
// Example integration point
static async createPool(data: CreatePoolFormData, creatorAddress: string) {
  if (DEBUG_MODE) {
    // ... existing mock code ...
  }

  // Replace this section with actual contract calls
  // Example:
  // const { hash } = await writeContract({
  //   address: POOL_CONTRACT_ADDRESS,
  //   abi: PoolABI,
  //   functionName: 'createPool',
  //   args: [data.recipientAddress, data.finalizationThreshold, ...],
  //   value: parseEther(data.selfContribution),
  // });
  // await waitForTransaction({ hash });
}
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_FE_DEBUG_MODE=false
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_id
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ENABLE_TESTNETS=false
```

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Add new features
- Improve UI/UX
- Optimize performance
- Add tests

## 📄 License

MIT License - feel free to use this code for your projects

## 🎁 Credits

Built with love for ETHRome 2025

### Key Dependencies
- [Next.js](https://nextjs.org/)
- [RainbowKit](https://rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [ENS](https://ens.domains/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is the frontend-only implementation with DEBUG mode enabled. Smart contract integration coming soon!
