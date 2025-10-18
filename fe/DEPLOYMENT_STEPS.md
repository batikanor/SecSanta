# 🚀 Deployment Steps for iExec Integration

## Overview

This document outlines the steps needed to deploy the complete iExec integration for SecSanta. The code is written and ready - these are the operational steps to get everything running on testnet.

---

## Prerequisites

### 1. Get Arbitrum Sepolia Testnet ETH
You'll need testnet ETH for:
- Deploying the smart contract (gas fees)
- Testing pool creation and contributions

**Faucets**:
- Alchemy: https://www.alchemy.com/faucets/arbitrum-sepolia
- Chainlink: https://faucets.chain.link/arbitrum-sepolia
- LearnWeb3: https://learnweb3.io/faucets/arbitrum_sepolia/

**Recommended Amount**: Get at least 0.5 ETH from faucets to cover deployment and testing.

### 2. Get RLC Testnet Tokens (for iExec)
**Faucet**: https://explorer.iex.ec/arbitrum-mainnet/faucet
- Connect wallet on Arbitrum Sepolia
- Request RLC tokens
- These are used for iExec operations

### 3. Setup iExec Account
```bash
# Install iExec CLI
npm install -g iexec

# Initialize wallet
iexec wallet create

# Save the wallet file securely
# You'll need this for deploying the iApp
```

---

## Step 1: Deploy Smart Contract

### 1.1 Compile Contract

```bash
# Install Solidity compiler
npm install -g solc

# Compile SecSantaPool.sol
cd contracts
solcjs --abi --bin --include-path node_modules/ --base-path . -o . SecSantaPool.sol

# This creates:
# - SecSantaPool_sol_SecSantaPool.abi
# - SecSantaPool_sol_SecSantaPool.bin
```

### 1.2 Create Contract Artifact

Create `contracts/SecSantaPool.json`:
```json
{
  "abi": [...], // Copy from .abi file
  "bytecode": "0x..." // Copy from .bin file
}
```

### 1.3 Deploy Contract

```bash
# Set your private key (wallet with Arbitrum Sepolia ETH)
export DEPLOYER_PRIVATE_KEY=your_private_key_here

# Run deployment script
node contracts/deploy.js

# Expected output:
# 🚀 Deploying SecSantaPool to Arbitrum Sepolia...
# ✅ Contract deployed successfully!
# Address: 0x1234567890abcdef...
# Explorer: https://sepolia.arbiscan.io/address/0x1234567890abcdef...
```

### 1.4 Save Contract Address

The deployment script saves to `contracts/deployment.json`. You'll need the address for the next steps.

---

## Step 2: Deploy iApp for TEE Computation

### 2.1 Build Docker Image

```bash
cd iapp

# Build the Docker image
docker build -t secsanta-pool-computation .

# Tag for DockerHub (replace with your DockerHub username)
docker tag secsanta-pool-computation YOUR_DOCKERHUB_USERNAME/secsanta-pool-computation:1.0.0

# Push to DockerHub
docker push YOUR_DOCKERHUB_USERNAME/secsanta-pool-computation:1.0.0
```

### 2.2 Initialize iExec App

```bash
# In iapp directory
iexec init --skip-wallet

# Edit iexec.json
{
  "app": {
    "owner": "YOUR_WALLET_ADDRESS",
    "name": "secsanta-pool-computation",
    "type": "DOCKER",
    "multiaddr": "docker.io/YOUR_DOCKERHUB_USERNAME/secsanta-pool-computation:1.0.0",
    "checksum": "0x...", // Will be calculated
    "mrenclave": {
      "framework": "SCONE",
      "version": "v5",
      "entrypoint": "npm start",
      "heapSize": 1073741824
    }
  }
}
```

### 2.3 Deploy iApp

```bash
# Deploy app to iExec
iexec app deploy --wallet-file <path-to-wallet>

# Expected output:
# ℹ using chain [bellecour]
# ✔ Deployed new app at address 0xabcdef...

# Publish app
iexec app publish --wallet-file <path-to-wallet>

# ✔ Published app 0xabcdef...
```

### 2.4 Save iApp Address

You'll need this address for triggering TEE computations.

---

## Step 3: Configure Frontend

### 3.1 Update Environment Variables

Create or update `.env.local`:
```bash
# Smart contract address from Step 1
NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS=0x1234567890abcdef...

# iExec iApp address from Step 2 (for future TEE trigger)
NEXT_PUBLIC_IEXEC_IAPP_ADDRESS=0xabcdef123456...

# WalletConnect project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Upstash Redis (already configured)
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Build & Test Locally

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
```

---

## Step 4: Test Complete Flow

### 4.1 Setup MetaMask

1. Open MetaMask
2. Add Arbitrum Sepolia network (if not already added)
3. Ensure you have some testnet ETH

### 4.2 Configure SecSanta

1. Open application
2. Click Settings (bottom-right)
3. Select **Arbitrum Sepolia** network
4. Select **iExec (TEE)** privacy mode
5. Page will reload

### 4.3 Create Pool

1. Click "Create Pool"
2. Fill form:
   - Pool Name: "Test iExec Pool"
   - Recipient: Any Ethereum address
   - Your Contribution: 0.01 (ETH)
   - Threshold: 3
   - Gift Suggestion: "Gaming Console"

3. Click "Create Pool"

**Expected Flow**:
```
🔐 iExec privacy mode enabled - encrypting contribution...
✅ Contribution encrypted successfully!
📝 Creating pool on blockchain...
⏳ Waiting for transaction confirmation...
✅ Pool created on-chain!
🔗 Linking encrypted data to on-chain pool...
✅ Complete! Pool created with encrypted contribution on blockchain.
```

4. Verify on Arbiscan:
   - You should see a transaction
   - Contract should have received 0.01 ETH
   - Protected data address should be linked

### 4.4 Join Pool (with other accounts)

1. Switch MetaMask account (or have friends join)
2. Navigate to the pool
3. Join with encrypted contribution
4. Verify each contribution:
   - Shows `[ENCRYPTED]` in UI
   - Creates new protected data NFT
   - Sends real ETH to contract

### 4.5 Finalize Pool

1. Switch back to pool creator account
2. Once threshold is reached, click "Finalize Pool" (you'll need to add this button)
3. Trigger finalization

**Expected**:
```
🎁 Finalizing pool on-chain...
⏳ Waiting for finalization transaction...
✅ Pool finalized on-chain! Funds transferred to recipient.
```

4. Verify on Arbiscan:
   - Contract transferred total ETH to recipient
   - Transaction hash displayed in UI
   - Can click to view on Arbiscan

### 4.6 Verify Privacy

- Individual amounts should show `[ENCRYPTED]`
- Only total revealed (if TEE computation ran)
- Protected data NFTs visible on Arbiscan
- Actual amounts never exposed on-chain

---

## Step 5: Deploy to Production (Vercel)

### 5.1 Push to GitHub

```bash
git add .
git commit -m "Complete iExec integration with smart contract and iApp"
git push origin main
```

### 5.2 Deploy on Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS
# - NEXT_PUBLIC_IEXEC_IAPP_ADDRESS
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# - KV_REST_API_URL
# - KV_REST_API_TOKEN
```

### 5.3 Test Production

1. Visit deployed URL
2. Test complete flow
3. Verify all transactions on Arbiscan

---

## Step 6: Create Demo Video

### 6.1 Record Demo

**Recommended Flow**:
1. **Introduction** (30 seconds)
   - What is SecSanta
   - The privacy problem we solve

2. **iExec Integration** (1 minute)
   - Show privacy mode selection
   - Explain DataProtector encryption
   - Show TEE computation concept

3. **Live Demo** (2 minutes)
   - Create pool with encryption
   - Show protected data NFT created
   - Join pool (switch accounts)
   - Finalize and show transaction proof

4. **Technical Deep Dive** (1 minute)
   - Show smart contract on Arbiscan
   - Show encrypted data NFTs
   - Explain privacy guarantees

5. **Conclusion** (30 seconds)
   - Recap innovation
   - Future applications

**Tools**: OBS Studio, Loom, or built-in screen recording

---

## Step 7: Submit to iExec Bounty

### 7.1 Prepare Submission

**Required Materials**:
- ✅ GitHub repository with code
- ✅ Live deployed application
- ✅ Demo video
- ✅ Documentation (IEXEC_BOUNTY_SUBMISSION.md)
- ✅ Smart contract address on Arbiscan
- ✅ iApp address on iExec explorer
- ⚠️ Feedback document (create after using iExec tools)

### 7.2 Feedback Document

Create a document covering:
- Experience using DataProtector SDK
- Challenges faced during integration
- Suggestions for improvement
- Documentation quality
- Developer experience
- What worked well

### 7.3 Submit

Follow iExec bounty submission guidelines:
- Include all links
- Provide clear testing instructions
- Highlight novel use case
- Demonstrate confidential DeFi workflow

---

## Troubleshooting

### Contract Deployment Fails

**Error**: "Insufficient funds"
**Fix**: Get more Arbitrum Sepolia ETH from faucets

**Error**: "Contract already deployed at this address"
**Fix**: Generate new deployment address or use existing

### iApp Deployment Fails

**Error**: "Docker image not found"
**Fix**: Ensure Docker image is pushed to DockerHub and accessible

**Error**: "Invalid wallet"
**Fix**: Ensure wallet has RLC tokens on Arbitrum Sepolia

### DataProtector Errors

**Error**: "Chain ID mismatch"
**Fix**: Ensure MetaMask is on Arbitrum Sepolia (421614)

**Error**: "Wallet not connected"
**Fix**: Connect wallet before creating pool

### Transaction Fails

**Error**: "Pool does not exist"
**Fix**: Ensure contract address is correctly configured

**Error**: "Already contributed"
**Fix**: Each address can only contribute once per pool

---

## Next Steps

After successful deployment:

1. **Test Thoroughly**: Create multiple pools, test edge cases
2. **Optimize Gas**: Consider batching operations
3. **Add TEE Trigger**: Implement automatic iApp execution on finalization
4. **Monitor Costs**: Track gas usage and optimize
5. **User Feedback**: Get real users to test
6. **Iterate**: Improve based on feedback

---

## Summary

**Estimated Time**:
- Contract deployment: 30 minutes
- iApp deployment: 1-2 hours
- Frontend deployment: 30 minutes
- Testing: 1-2 hours
- Demo video: 1 hour
- **Total**: ~4-6 hours

**What You'll Have**:
- ✅ Deployed smart contract on Arbitrum Sepolia
- ✅ iApp running in iExec TEE
- ✅ Live application with transaction proofs
- ✅ Complete privacy-preserving DeFi flow
- ✅ iExec bounty submission ready

**Ready to qualify for the $6k iExec bounty!** 🎉
