# 🎁 SecSanta - Secret Gift Pools

> Anonymous group gifting powered by Ethereum and ENS

**ETHRome 2025 Hackathon Project**

---

## 🚀 Quick Start

```bash
cd fe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default mode**: DEBUG (mock data, no blockchain required)

---

## 📖 What is SecSanta?

SecSanta is a decentralized application that enables groups of friends to create anonymous gift pools:

- **Create a pool** for a recipient (using ENS names like `vitalik.eth`)
- **Contribute anonymously** - amounts stay hidden until threshold is met
- **Auto-finalize** when enough people join
- **Full transparency** after finalization - all contributions revealed

### The Problem
Group gifting is common (birthdays, weddings, farewells), but current solutions either:
- Lack privacy (everyone sees contributions)
- Lack transparency (organizer has too much control)
- Poor UX (cryptic wallet addresses)

### Our Solution
Blockchain ensures:
- ✅ **Privacy until finalization** - no social pressure
- ✅ **Guaranteed transparency** - all contributions revealed when pool completes
- ✅ **ENS integration** - use `alice.eth` instead of `0x1234...`
- ✅ **Trustless execution** - smart contract handles everything

---

## 🏆 Bounty Targets

This project qualifies for multiple ETHRome 2025 bounties:

### Primary Targets

1. **ENS - $5,000**
   - Deep integration with `useEnsName` and `useEnsAddress` hooks
   - ENS display throughout the UI
   - ENS input with auto-resolution
   - See: `fe/components/ENSDisplay.tsx`, `fe/components/ENSInput.tsx`

2. **BuidlGuidl - $2,000**
   - Modern Web3 stack (Next.js 14, Wagmi v2, RainbowKit)
   - Clean, production-ready code
   - Comprehensive documentation
   - TypeScript for type safety

### Secondary Targets

3. **Base Miniapp - $5,000**
   - Social-first design with viral mechanics
   - Shareable pool links
   - Mobile-responsive, miniapp-ready
   - Can be adapted for Farcaster Frames

4. **Privacy Bounties ($2k-6k)**
   - Hidden contributions until finalization
   - Can integrate iExec, Zama, or Enclave for enhanced privacy

**Read more**: [BOUNTIES.md](./BOUNTIES.md)

---

## 📁 Project Structure

```
SecSanta/
├── fe/                        # Frontend (Next.js app)
│   ├── app/                   # Next.js 14 App Router
│   ├── components/            # React components
│   ├── lib/                   # Services and utilities
│   ├── types/                 # TypeScript types
│   └── README.md              # Frontend docs
├── BOUNTIES.md                # Bounty strategy guide
├── DEMO_GUIDE.md              # Complete demo script
├── INTEGRATION_GUIDE.md       # For smart contract team
└── README.md                  # This file
```

---

## 🎬 Demo

### User Flow

**User 1** (Alice):
1. Connects wallet → Shows `alice.eth`
2. Creates pool → Recipient: `vitalik.eth`
3. Sets contribution: 0.1 ETH, threshold: 3 people
4. Shares pool link

**User 2** (Bob):
1. Opens pool link
2. Sees pool (1/3 contributors)
3. Joins with 0.15 ETH
4. Contribution hidden

**User 3** (Charlie):
1. Opens pool link
2. Joins with 0.2 ETH
3. **Pool finalizes!**
4. All amounts revealed: Total = 0.45 ETH → `vitalik.eth`

**Read full script**: [DEMO_GUIDE.md](./DEMO_GUIDE.md)

---

## 🔧 Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **RainbowKit** - Wallet connection
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - Ethereum library
- **Lucide Icons** - Icon library

### Smart Contracts (To Be Integrated)
- Solidity contracts for pool management
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or Web3 wallet

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd SecSanta/fe
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# For development/demo
NEXT_PUBLIC_FE_DEBUG_MODE=true

# Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here

NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

4. **Run development server**
```bash
npm run dev
```

5. **Open app**
```
http://localhost:3000
```

---

## 🎯 Features

### ENS Integration ⭐
- Display ENS names instead of addresses
- Input fields accept ENS names
- Automatic resolution to addresses
- Works on Ethereum mainnet

### Privacy
- Contribution amounts hidden until pool finalizes
- No social pressure or bias
- Full transparency after completion

### UX Excellence
- Clean, modern interface
- Mobile-responsive design
- Smooth wallet connection
- Real-time updates

### Developer Experience
- DEBUG mode for easy testing
- Mock data system
- Clean architecture
- Comprehensive documentation

---

## 🔍 DEBUG Mode

The app includes a DEBUG mode for development without blockchain:

**Enabled** (default):
- Mock data and transactions
- No wallet signatures needed
- 2-second simulated delays
- Perfect for demos and testing

**Disabled** (production):
- Real blockchain transactions
- Smart contract integration required
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

Toggle in `.env.local`:
```env
NEXT_PUBLIC_FE_DEBUG_MODE=true  # or false
```

---

## 📚 Documentation

- **[fe/README.md](./fe/README.md)** - Frontend setup and architecture
- **[BOUNTIES.md](./BOUNTIES.md)** - Bounty strategy and talking points
- **[DEMO_GUIDE.md](./DEMO_GUIDE.md)** - Complete demo script for judges
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Smart contract integration

---

## 🎨 Screenshots

### Home Page
Clean landing with wallet connection

### Dashboard
View all pools with ENS names

### Create Pool
Form with ENS input and auto-resolution

### Pool Detail
Real-time progress, contributor list, finalization

---

## 🏗️ Development

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 🤝 Team Workflow

### Frontend Team (✅ Complete)
- All UI components implemented
- ENS integration complete
- DEBUG mode working
- Documentation written

### Backend/Contract Team (📝 In Progress)
- Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Implement smart contracts
- Integrate with frontend via `pool-service.ts`

### Demo Team
- Follow [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- Practice 3-minute pitch
- Prepare for judge questions

---

## 🔐 Security

### Current (DEBUG Mode)
- No real funds at risk
- Mock data only
- For demo purposes

### Production Recommendations
- Audit smart contracts
- Test on testnets first
- Implement timeout mechanism
- Add emergency pause function
- Consider privacy solutions (TEE/FHE)

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Environment Variables
```env
NEXT_PUBLIC_FE_DEBUG_MODE=false
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=prod_id
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=1
```

---

## 📊 Bounty Checklist

### ENS Bounty
- [x] useEnsName hook integrated
- [x] useEnsAddress hook integrated
- [x] ENS Display component
- [x] ENS Input component
- [x] Works on mainnet (chainId: 1)
- [x] Documentation
- [ ] Live deployment
- [ ] Demo video

### BuidlGuidl Bounty
- [x] Next.js 14
- [x] TypeScript
- [x] Wagmi v2
- [x] RainbowKit
- [x] Clean code
- [x] Documentation
- [ ] Smart contract integration
- [ ] Live deployment

### Base Miniapp (Optional)
- [x] Social mechanics
- [x] Shareable links
- [x] Mobile-responsive
- [ ] Farcaster Frame adaptation
- [ ] Social share buttons

---

## 🎯 Next Steps

### Before Submission
1. [ ] Deploy to Vercel
2. [ ] Test on mainnet (ENS resolution)
3. [ ] Create demo video (3 min)
4. [ ] Polish UI (final touches)
5. [ ] Test complete user flow

### Optional Enhancements
1. [ ] Integrate smart contracts
2. [ ] Add Farcaster Frame support
3. [ ] Implement privacy features (TEE/FHE)
4. [ ] Add analytics
5. [ ] Create promotional materials

---

## 📞 Support

- **Issues**: GitHub Issues
- **Questions**: See documentation
- **Demo Help**: [DEMO_GUIDE.md](./DEMO_GUIDE.md)

---

## 📄 License

MIT License - feel free to fork and build!

---

## 🎉 Credits

Built with ❤️ for ETHRome 2025

**Technologies**:
- [Next.js](https://nextjs.org/)
- [RainbowKit](https://rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [ENS](https://ens.domains/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Let's win those bounties! 🏆**
