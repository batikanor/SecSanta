# 🎁 SecSanta - Privacy-Preserving Gift Pools

> Anonymous group gifting with encrypted contributions powered by iExec TEE and Zama FHE

**ETHRome 2025 Hackathon Project**

[Live Demo](https://secsanta.vercel.app) • [Documentation](./docs/)

---

## What is SecSanta?

SecSanta enables groups to create anonymous gift contribution pools where individual amounts remain **cryptographically hidden** until finalization:

1. **Create a pool** for a recipient (birthdays, farewells, celebrations)
2. **Contributors join** with encrypted contributions - amounts stay hidden from everyone
3. **Auto-finalize** when threshold is met - funds transfer to recipient
4. **Privacy preserved** - individual amounts never revealed, only the total

### The Problem

Traditional group gifting platforms expose contribution amounts, creating:
- **Social pressure** - people see what others contribute
- **Bias and inequality** - larger contributions visible
- **Privacy concerns** - financial information leaked

### Our Solution

Two privacy modes powered by cutting-edge cryptography:

**🔐 iExec Mode** (Arbitrum Sepolia)
- Client-side AES-256 encryption via DataProtector SDK
- Encrypted data stored as NFTs on-chain
- TEE (Trusted Execution Environment) computation
- Contributions remain encrypted forever

**🔐 Zama FHE Mode** (Sepolia)
- Fully Homomorphic Encryption on smart contracts
- On-chain encrypted computation
- KMS oracle decryption at finalization
- Confidential ERC20 tokens (BCT)

---

## 🏆 Prize Qualifications

### iExec - $6,000 💰

**Category**: Confidential DeFi using DataProtector

**Our Implementation**:
- ✅ DataProtector SDK integration for client-side encryption
- ✅ Smart contract deployed on Arbitrum Sepolia (`0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8`)
- ✅ Encrypted contribution data stored as NFTs
- ✅ Real blockchain transactions with verification links
- ✅ Pool creation, contribution, and finalization all on-chain
- ✅ Transaction proofs visible on Arbiscan

**Key Files**:
- `fe/lib/iexec-dataprotector.ts` - DataProtector integration
- `fe/lib/contract-service.ts` - Smart contract interactions
- `fe/contracts/SecSantaPool.sol` - Contribution pool contract

---

### Zama - $5,000 💰

**Category**: FHE-based confidential applications

**Our Implementation**:
- ✅ Zama fhEVM Relayer SDK integration
- ✅ BirthdayConfidentialToken (BCT) deployed on Sepolia (`0xCee0c15B42EEb44491F588104bbC46812115dBB0`)
- ✅ ContributionPool contract with FHE operations (`0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0`)
- ✅ On-chain encrypted arithmetic (homomorphic addition)
- ✅ KMS oracle decryption at finalization
- ✅ Confidential token transfers using operator approvals

**Key Files**:
- `fe/lib/zama-service.ts` - Zama FHE integration
- `fe/lib/zama-pool-service.ts` - Pool service for FHE mode
- `backend/contracts/BirthdayConfidentialToken.sol` - Confidential ERC20
- `backend/contracts/ContributionPool.sol` - FHE contribution pool

---

## 🚀 Quick Start

```bash
cd fe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Privacy Mode Toggle**: Use the debug panel to switch between iExec and Zama modes

---

## 🔧 Technical Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **RainbowKit** + **Wagmi v2** for Web3 integration
- **Tailwind CSS** for styling

### Smart Contracts

**iExec Mode** (Arbitrum Sepolia):
- SecSantaPool contract manages ETH contributions
- iExec DataProtector stores encrypted amounts as NFTs

**Zama Mode** (Sepolia):
- BirthdayConfidentialToken (BCT) - FHE-enabled ERC20
- ContributionPool - Manages encrypted contributions with `euint64`

### Privacy Comparison

| Feature | iExec Mode | Zama Mode |
|---------|------------|-----------|
| Network | Arbitrum Sepolia | Sepolia |
| Currency | ETH | BCT (confidential tokens) |
| Encryption | Client-side AES-256 | On-chain FHE |
| Storage | Off-chain (NFTs) | On-chain (encrypted) |
| Computation | TEE workers | Smart contract homomorphic ops |
| Decryption | Never | KMS oracle at finalization |

---

## 🎯 Key Features

### Privacy First
- ✅ Dual privacy modes (iExec TEE + Zama FHE)
- ✅ Encrypted contributions with cryptographic guarantees
- ✅ Individual amounts never revealed publicly
- ✅ Verifiable on-chain transactions

### User Experience
- ✅ Clean, modern interface
- ✅ Mobile-responsive design
- ✅ Transaction verification links (Arbiscan/Etherscan)
- ✅ Real-time pool progress tracking
- ✅ One-click pool finalization

### Production Ready
- ✅ Deployed smart contracts on testnets
- ✅ Full integration with both privacy SDKs
- ✅ Comprehensive error handling
- ✅ Transaction proof system
- ✅ Live demo on Vercel

---

## 📚 Documentation

- **[Setup Guide](./docs/QUICKSTART.md)** - Installation and configuration
- **[Integration Details](./docs/INTEGRATION_GUIDE.md)** - Smart contract integration
- **[Demo Guide](./docs/DEMO_GUIDE.md)** - How to demo the project

---

## 🌐 Deployment

**Live App**: https://secsanta.vercel.app

**Deployed Contracts**:
- iExec Pool (Arbitrum Sepolia): `0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8`
- Zama Token (Sepolia): `0xCee0c15B42EEb44491F588104bbC46812115dBB0`
- Zama Pool (Sepolia): `0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0`

---

## 📄 License

MIT License

---

## 🎉 Built For

**ETHRome 2025** - Pushing the boundaries of privacy-preserving DeFi

**Technologies**: Next.js • iExec DataProtector • Zama fhEVM • RainbowKit • Wagmi • Solidity
