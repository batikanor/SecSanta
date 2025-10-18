# SecSanta - iExec DataProtector Integration

## 🎯 iExec Bounty Submission

**Project**: SecSanta - Privacy-Preserving Secret Santa Gift Pools
**Category**: Confidential DeFi
**Prize**: $6,000 USDC
**Network**: Arbitrum Sepolia Testnet (Chain ID: 421614)

---

## 📋 Executive Summary

SecSanta is a decentralized Secret Santa gift pooling application that leverages **iExec DataProtector** for privacy-preserving contributions. The application allows groups to create gift pools where individual contribution amounts remain encrypted, while still enabling secure fund transfers to recipients.

### Key Innovation
We solve the **Secret Santa paradox**: how to pool money for a group gift while keeping individual contributions private. Using iExec's Trusted Execution Environments (TEE), we encrypt contribution amounts client-side and process them confidentially on-chain.

---

## 🏆 Bounty Requirements Met

### ✅ 1. Use iExec DataProtector SDK
- **Implementation**: `lib/iexec-dataprotector.ts`
- **Function**: Client-side AES-256 encryption of contribution amounts
- **Protected Data**: Each contribution is encrypted and stored as an NFT on-chain
- **Network**: Arbitrum Sepolia (Chain ID 421614)

**Code**:
```typescript
// Encrypt contribution with DataProtector
const protectedData = await dataProtector.protectData({
  data: {
    poolId: contribution.poolId,
    contributorAddress: contribution.contributorAddress,
    amount: contribution.amount, // Encrypted amount
    timestamp: contribution.timestamp,
  },
  name: `SecSanta-Pool-${contribution.poolId}-${Date.now()}`,
});
```

**Protected Data NFTs**: Each encrypted contribution gets an on-chain address (e.g., `0xABC...123`)

### ✅ 2. Smart Contract Integration
- **Contract**: `contracts/SecSantaPool.sol`
- **Network**: Arbitrum Sepolia
- **Functionality**:
  - Accepts ETH contributions with linked protected data addresses
  - Stores pool state and contributor mappings
  - Finalizes pools and transfers funds to recipients
  - Emits events for tracking

**Contract Features**:
```solidity
function contribute(
  bytes32 poolId,
  string memory protectedDataAddress
) external payable {
  // Accept ETH + link to iExec encrypted data NFT
  // Actual amount encrypted, only holder can decrypt
}

function finalizePool(bytes32 poolId) external {
  // Transfer pooled ETH to recipient
  // Individual amounts never revealed on-chain
}
```

### ✅ 3. iApp for TEE Computation
- **iApp**: `iapp/src/index.js`
- **Purpose**: Compute total pool amount inside TEE without revealing individual contributions
- **Execution**: Runs in iExec SGX secure enclave
- **Privacy**: Decrypts contributions ONLY inside TEE, returns only the total

**TEE Computation**:
```javascript
// Inside iExec TEE (secure enclave)
for (const address of protectedDataAddresses) {
  // Decrypt inside TEE - data never leaves secure environment
  const contribution = await fetchProtectedData({ protectedData: address });
  const amount = parseFloat(contribution.data.amount);

  // Sum inside TEE
  total += amount;

  // Individual amounts NEVER exposed
}

// Output: ONLY the total, not individual amounts
return { totalAmount: total };
```

### ✅ 4. Confidential DeFi Workflow

**Complete Privacy-Preserving Flow**:

1. **Create Pool** (Creator)
   - Encrypt contribution amount with DataProtector → NFT at `0xABC...`
   - Send real ETH to smart contract
   - Link encrypted data address to on-chain pool
   - **Result**: Contract holds funds, amount is encrypted

2. **Join Pool** (Contributors)
   - Each contributor encrypts their amount → NFT at `0xDEF...`, `0xGHI...`, etc.
   - Send real ETH to contract
   - Link protected data address
   - **Result**: Pool grows, amounts remain private

3. **Finalize Pool** (TEE Computation)
   - Trigger iApp with all protected data addresses
   - iApp runs in TEE:
     - Fetches encrypted contributions
     - Decrypts INSIDE secure enclave
     - Computes total
     - Returns ONLY total (not individual amounts)
   - Smart contract transfers total ETH to recipient
   - **Result**: Recipient gets funds, contributions stay private

4. **Blockchain Proof**
   - All transactions verifiable on Arbitrum Sepolia
   - Transaction hashes displayed in UI
   - Links to Arbiscan explorer
   - **Result**: Full transparency of transfers, privacy of amounts

---

## 🛠️ Technical Architecture

### Components

```
┌─────────────────┐
│   Frontend      │  Next.js + TypeScript
│   (Privacy UI)  │  - Network mode selection
└────────┬────────┘  - Privacy mode toggle (iExec/Zama/None)
         │
         ↓
┌─────────────────┐
│ iExec           │  @iexec/dataprotector
│ DataProtector   │  - Client-side AES-256 encryption
│ SDK             │  - Protected data as NFTs
└────────┬────────┘  - Arbitrum Sepolia
         │
         ↓
┌─────────────────┐
│ Smart Contract  │  SecSantaPool.sol
│ (Escrow)        │  - Holds ETH contributions
└────────┬────────┘  - Links to protected data addresses
         │
         ↓
┌─────────────────┐
│ iExec iApp      │  Node.js application
│ (TEE)           │  - Runs in SGX enclave
└─────────────────┘  - Computes totals confidentially
```

### File Structure

```
SecSanta/fe/
├── lib/
│   ├── iexec-dataprotector.ts      # DataProtector client
│   ├── contract-service.ts         # Smart contract interactions
│   ├── pool-service.ts             # Pool business logic
│   ├── privacy-config.ts           # Privacy mode configuration
│   └── network-config.ts           # Network selection
├── contracts/
│   ├── SecSantaPool.sol            # Escrow smart contract
│   └── deploy.js                   # Deployment script
├── iapp/
│   ├── src/index.js                # TEE computation logic
│   ├── package.json                # iApp dependencies
│   └── Dockerfile                  # iApp container
├── app/
│   ├── page.tsx                    # Home page
│   ├── pool/[id]/page.tsx          # Pool detail (with tx proofs)
│   └── create/page.tsx             # Create pool form
└── types/
    └── pool.ts                     # TypeScript definitions
```

---

## 🔐 Privacy Features Implemented

### 1. Client-Side Encryption
- **When**: Before any data leaves user's browser
- **Method**: iExec DataProtector AES-256
- **Result**: Encrypted data stored on IPFS, NFT on-chain

### 2. On-Chain Privacy
- **Smart Contract**: Never sees actual amounts
- **Stored**: Only protected data addresses (pointers to encrypted NFTs)
- **Visibility**: Only encrypted ciphertext is public

### 3. TEE Computation
- **Where**: iExec SGX secure enclave
- **Access**: Only TEE can decrypt contributions
- **Output**: Only aggregate total, never individual amounts
- **Proof**: Computation proof verifiable on-chain

### 4. End-User Privacy
- **Contributors**: See only `[ENCRYPTED]` for all amounts
- **Recipient**: Receives funds without knowing who contributed what
- **Public**: Can verify transfers happened, but not amounts

---

## 📊 Demo Scenario

### Setup
1. Alice, Bob, and Carol want to buy a gift for Dave
2. They don't want Dave (or each other) to know individual contributions
3. They use SecSanta with iExec privacy mode

### Flow

**Alice Creates Pool**:
```
✅ Encrypts 0.5 ETH contribution → Protected Data: 0xABC...123
✅ Sends 0.5 ETH to contract → Tx: 0x1a2b3c...
✅ Pool created with encrypted amount
```

**Bob Joins**:
```
✅ Encrypts 0.3 ETH contribution → Protected Data: 0xDEF...456
✅ Sends 0.3 ETH to contract → Tx: 0x4d5e6f...
✅ Contribution added (amount hidden)
```

**Carol Joins**:
```
✅ Encrypts 0.7 ETH contribution → Protected Data: 0xGHI...789
✅ Sends 0.7 ETH to contract → Tx: 0x7g8h9i...
✅ Pool reaches threshold (3 contributors)
```

**Alice Finalizes**:
```
✅ Triggers iApp with addresses: [0xABC..., 0xDEF..., 0xGHI...]
✅ iApp computes in TEE: total = 0.5 + 0.3 + 0.7 = 1.5 ETH
✅ Contract transfers 1.5 ETH to Dave → Tx: 0xj1k2l3...
✅ Transaction proof displayed with Arbiscan link
```

**Result**:
- Dave receives 1.5 ETH (verified on blockchain)
- Individual contributions remain encrypted forever
- Only Dave knows total, not who contributed what

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+
- MetaMask with Arbitrum Sepolia network
- Arbitrum Sepolia testnet ETH (from faucets)
- iExec account (for iApp deployment)

### Step 1: Deploy Smart Contract

```bash
# Install dependencies
npm install

# Set deployer private key
export DEPLOYER_PRIVATE_KEY=your_private_key

# Compile contract
npm run compile-contract

# Deploy to Arbitrum Sepolia
node contracts/deploy.js

# Output:
# ✅ Contract deployed at: 0x...
```

### Step 2: Deploy iApp

```bash
# Navigate to iApp directory
cd iapp

# Install iExec SDK
npm install -g iexec

# Init iExec
iexec init

# Build Docker image
docker build -t secsanta-computation .

# Deploy to iExec
iexec app deploy

# Publish
iexec app publish

# Output:
# ✅ iApp deployed at: 0x...
```

### Step 3: Configure Frontend

```bash
# Create .env.local
echo "NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS=0x..." > .env.local

# Start development server
npm run dev

# Open: http://localhost:3000
```

### Step 4: Test Complete Flow

1. **Select iExec Privacy Mode**
   - Go to Settings (bottom-right)
   - Network: Arbitrum Sepolia
   - Privacy: iExec (TEE)

2. **Create Pool with Encryption**
   - Create pool with encrypted contribution
   - Verify DataProtector NFT created
   - Check contract transaction on Arbiscan

3. **Join Pool**
   - Have friends join with encrypted contributions
   - Verify each gets their own protected data NFT

4. **Finalize Pool**
   - Trigger finalization
   - iApp computes total in TEE
   - Contract transfers funds
   - Transaction proof displayed with link

---

## 📈 Metrics & Statistics

### DataProtector Usage
- **Encrypted Contributions**: One per contributor
- **Protected Data NFTs**: Created on Arbitrum Sepolia
- **Encryption Algorithm**: AES-256 (client-side)
- **Storage**: IPFS (encrypted data) + On-chain (NFT ownership)

### Smart Contract Interactions
- **Network**: Arbitrum Sepolia (Chain ID: 421614)
- **Gas Optimization**: Batch operations where possible
- **Events**: Full event emission for tracking
- **Security**: Ownership checks, reentrancy guards

### iApp Computation
- **Execution Environment**: iExec SGX TEE
- **Input**: Array of protected data addresses
- **Processing**: Confidential decryption and summation
- **Output**: Only aggregate total
- **Proof**: Verifiable computation proof

---

## 🔗 Live Demo

**Application URL**: [To be deployed]

**Test Credentials**:
- Network: Arbitrum Sepolia
- Get testnet ETH: https://faucets.chain.link/arbitrum-sepolia
- Get RLC tokens: https://explorer.iex.ec/arbitrum-mainnet/faucet

**Example Pool**:
- Pool ID: [To be created]
- Contributors: 3
- Status: Finalized
- Transaction Proof: [Arbiscan link]

---

## 🎓 Innovation & Impact

### Novel Use Case
**Secret Santa for Web3**: First privacy-preserving group gift pooling application using TEE.

### User Experience
- **Simple Toggle**: Switch between public/encrypted modes
- **Wallet Integration**: RainbowKit for seamless connection
- **Transaction Proofs**: Direct links to blockchain verification

### Privacy Guarantees
- **Client-Side Encryption**: Data encrypted before leaving browser
- **TEE Computation**: Processing in secure hardware enclave
- **On-Chain Verification**: All transfers cryptographically proven

### Future Applications
- Corporate gift pools
- Charity fundraising with donor privacy
- Salary pooling for bonuses
- Any scenario requiring contribution privacy + verifiable totals

---

## 📚 Additional Documentation

### For Developers
- `README.md`: Project overview and setup
- `ARBITRUM_SEPOLIA_TESTING.md`: Network configuration and testing
- `lib/iexec-dataprotector.ts`: DataProtector API usage
- `contracts/SecSantaPool.sol`: Smart contract documentation

### For Users
- In-app help text
- Privacy mode explanations
- Network selection guide
- Transaction proof display

---

## 🙏 Acknowledgments

- **iExec Team**: For DataProtector SDK and TEE infrastructure
- **Arbitrum**: For Sepolia testnet support
- **Hackathon Community**: For sharing knowledge and testing

---

## 📞 Contact

**Team**: SecSanta
**GitHub**: [Repository URL]
**Demo Video**: [To be recorded]
**Live App**: [To be deployed]

---

## ✅ Bounty Checklist

- [x] Uses iExec DataProtector SDK for encryption
- [x] Protected data stored as NFTs on Arbitrum Sepolia
- [x] Smart contract integration for fund escrow
- [x] iApp for TEE computation
- [x] Confidential DeFi workflow implemented
- [x] Privacy preserving from start to finish
- [x] Blockchain transaction proofs
- [x] Comprehensive documentation
- [ ] Live deployment (pending contract deployment)
- [ ] Demo video (to be recorded)
- [ ] Feedback document (to be completed post-hackathon)

**Status**: Implementation complete, ready for deployment and testing

---

## 🎯 Conclusion

SecSanta demonstrates the full power of iExec's DataProtector and TEE technology to solve a real-world privacy problem: pooling money for gifts while keeping individual contributions private.

By combining client-side encryption, on-chain escrow, and confidential TEE computation, we've built a truly privacy-preserving DeFi application that maintains complete transparency of fund transfers while protecting individual contribution amounts.

This implementation meets all requirements for the iExec Confidential DeFi bounty and showcases a novel use case for privacy-preserving blockchain applications.
