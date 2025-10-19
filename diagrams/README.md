# SecSanta Architecture Diagrams - Taikai Submission

High-quality PNG images generated from Mermaid diagrams for ETHRome 2025 hackathon submission.

## Generated Images

### 1. System Architecture Overview
**File**: `1-system-architecture.png`
- **Resolution**: 1936 x 1897 pixels
- **Size**: 227 KB
- **Format**: PNG with transparency
- **Description**: Complete system architecture showing both iExec and Zama privacy modes, frontend integration, smart contracts, and data layer

**Use for**:
- Main project overview
- Technical architecture section
- Explaining dual-mode privacy system

---

### 2. iExec Mode Complete Flow
**File**: `2-iexec-flow.png`
- **Resolution**: 2286 x 3888 pixels
- **Size**: 514 KB
- **Format**: PNG with transparency
- **Description**: Step-by-step sequence diagram showing pool creation, contribution, and finalization with iExec DataProtector encryption

**Use for**:
- iExec bounty submission ($6,000)
- Demonstrating DataProtector SDK integration
- Showing client-side encryption + blockchain flow
- Proving on-chain transactions on Arbitrum Sepolia

**Key Features Highlighted**:
- Client-side AES-256 encryption
- Protected Data NFT creation
- IPFS storage
- On-chain ETH escrow
- TEE computation capability
- Privacy guarantee (amounts never decrypted)

---

### 3. Zama FHE Mode Complete Flow
**File**: `3-zama-flow.png`
- **Resolution**: 2848 x 5740 pixels
- **Size**: 835 KB
- **Format**: PNG with transparency
- **Description**: Comprehensive sequence diagram showing FHE encryption, homomorphic addition, KMS decryption, and BCT token transfers

**Use for**:
- Zama bounty submission ($5,000)
- Demonstrating fhEVM integration
- Showing on-chain encrypted computation
- Proving homomorphic operations

**Key Features Highlighted**:
- euint64 encrypted values on-chain
- Homomorphic addition (TFHE.add)
- KMS oracle decryption
- Confidential ERC20 token (BCT)
- Privacy guarantee (individual amounts stay encrypted)

---

## Technical Details

### Rendering Specifications
- **Tool**: Mermaid CLI (mmdc)
- **Configuration**: Custom theme with optimized colors
- **Background**: Transparent for versatile use
- **Font**: Arial sans-serif, 16px base size
- **Color Scheme**:
  - iExec components: Light blue (#e1f5ff)
  - Zama components: Light pink (#ffe1f5)
  - Smart contracts: Green/Pink highlights

### Contract Addresses (Visible in Diagrams)

**iExec Mode**:
- SecSantaPool: `0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8`
- Network: Arbitrum Sepolia (Chain ID: 421614)
- Explorer: https://sepolia.arbiscan.io/

**Zama Mode**:
- BirthdayConfidentialToken: `0xCee0c15B42EEb44491F588104bbC46812115dBB0`
- ContributionPool: `0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0`
- Network: Sepolia (Chain ID: 11155111)
- Explorer: https://sepolia.etherscan.io/

---

## File References in Diagrams

All diagrams include references to actual code files:
- `fe/lib/iexec-dataprotector.ts` - iExec DataProtector integration
- `fe/lib/zama-service.ts` - Zama fhEVM SDK integration
- `fe/lib/pool-service.ts` - Main pool orchestration
- `fe/lib/zama-pool-service.ts` - Zama pool management
- `fe/contracts/SecSantaPool.sol` - iExec mode contract
- `backend/contracts/BirthdayConfidentialToken.sol` - Zama token
- `backend/contracts/ContributionPool.sol` - Zama pool contract

---

## Documentation Links in Diagrams

Diagrams reference official documentation:
- iExec DataProtector: https://tools.docs.iex.ec/tools/dataprotector
- iExec Main Docs: https://docs.iex.ec/
- Zama fhEVM: https://docs.zama.ai/fhevm
- Zama Decryption: https://docs.zama.ai/fhevm/fundamentals/decryption

---

## Usage Tips for Taikai Submission

### iExec Bounty ($6,000)
Upload `2-iexec-flow.png` to show:
- ✅ DataProtector SDK integration
- ✅ Client-side encryption
- ✅ Protected Data NFTs
- ✅ On-chain transactions (Arbitrum Sepolia)
- ✅ Real smart contract deployment

Also include `1-system-architecture.png` to show overall integration.

### Zama Bounty ($5,000)
Upload `3-zama-flow.png` to show:
- ✅ fhEVM SDK integration
- ✅ On-chain FHE encryption (euint64)
- ✅ Homomorphic addition operations
- ✅ KMS oracle decryption
- ✅ Confidential token transfers

Also include `1-system-architecture.png` to show overall integration.

### General Submission
All three images work together to show:
- Complete privacy-preserving architecture
- Dual-mode implementation
- Production-ready smart contracts
- Real blockchain transactions
- Professional technical documentation

---

## Image Quality

All images are:
- **High resolution** (suitable for presentations and documentation)
- **Transparent background** (works on any background color)
- **Color-coded** (easy to understand different components)
- **Comprehensive** (include all steps, contracts, and documentation links)
- **Production-ready** (ready for submission without editing)

---

**Generated**: October 19, 2025
**Project**: SecSanta - Privacy-Preserving Gift Pools
**Hackathon**: ETHRome 2025
**Bounties**: iExec ($6,000) + Zama ($5,000)
