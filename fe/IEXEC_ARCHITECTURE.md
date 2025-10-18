# iExec Privacy Integration Architecture

## Overview

This document outlines the architecture for integrating **iExec's confidential computing** into SecSanta, enabling truly private contributions where individual amounts remain encrypted even during computation.

## What is iExec?

iExec provides **Trusted Execution Environment (TEE)** based privacy tools using Intel SGX enclaves. Two key components:

1. **DataProtector** - Client-side encryption SDK for protecting user data
2. **iApp (iExec Application)** - Off-chain computation in secure TEE environments

## Why iExec for SecSanta?

| Feature | Without Privacy | With iExec |
|---------|----------------|-----------|
| Contribution Amount | Visible to everyone | Encrypted (AES-256) |
| Total Calculation | On-chain (public) | In TEE (confidential) |
| Threshold Check | Public logic | Confidential computation |
| Final Reveal | All amounts visible | Only total revealed |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         SecSanta dApp                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Action: "Contribute 0.5 ETH"                           │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────┐               │
│  │   1. DataProtector Encryption (Client)   │               │
│  │   - Encrypt amount with AES-256          │               │
│  │   - Store encrypted data on IPFS         │               │
│  │   - Record ownership on smart contract    │               │
│  └──────────────────────────────────────────┘               │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────┐               │
│  │   2. Smart Contract (On-Chain)           │               │
│  │   - Store encrypted data pointer         │               │
│  │   - Track contributor address             │               │
│  │   - Record IPFS hash                      │               │
│  └──────────────────────────────────────────┘               │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────┐               │
│  │   3. iApp Computation (TEE)              │               │
│  │   - Fetch encrypted contributions         │               │
│  │   - Decrypt in secure enclave            │               │
│  │   - Compute total amount                  │               │
│  │   - Check threshold                       │               │
│  │   - Return only: total + threshold met    │               │
│  └──────────────────────────────────────────┘               │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────┐               │
│  │   4. Finalization (Smart Contract)       │               │
│  │   - Transfer total to recipient          │               │
│  │   - Individual amounts stay encrypted    │               │
│  └──────────────────────────────────────────┘               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. DataProtector SDK Integration

**Installation:**
```bash
npm install @iexec/dataprotector
```

**Client-Side Encryption:**
```typescript
// lib/iexec-dataprotector.ts

import { IExecDataProtector } from '@iexec/dataprotector';

// Initialize DataProtector
const dataProtector = new IExecDataProtector(web3Provider);

// Encrypt contribution amount
async function encryptContribution(
  amount: string,
  poolId: string,
  contributorAddress: string
) {
  const protectedData = await dataProtector.protectData({
    data: {
      poolId,
      contributorAddress,
      amount,
      timestamp: Date.now(),
    },
    name: `SecSanta-Pool-${poolId}-${contributorAddress}`,
  });

  return {
    address: protectedData.address, // Smart contract address of protected data
    owner: protectedData.owner,
    name: protectedData.name,
    schema: protectedData.schema,
  };
}
```

**Key Features:**
- **AES-256 Encryption** - Industry-standard symmetric encryption
- **Client-Side** - Encryption happens in browser before any network transmission
- **IPFS Storage** - Encrypted data stored on decentralized storage
- **On-Chain Ownership** - Smart contract records who owns the encrypted data
- **Access Control** - Only authorized iApps can decrypt in TEE

### 2. iApp (Confidential Computing)

**What is an iApp?**
An iApp is a Docker container that runs in an Intel SGX Trusted Execution Environment. It can:
- Decrypt protected data inside the secure enclave
- Perform computations without exposing raw data
- Return only the computed result (not the raw inputs)

**iApp Generator Setup:**
```bash
# Install iExec CLI
npm install -g @iexec/cli

# Initialize iExec project
iexec init

# Generate iApp using iApp Generator
npx @iexec/iapp-generator init

# Choose:
# - Language: JavaScript
# - Project Mode: Basic
# - Purpose: Confidential computation
```

**iApp Code (JavaScript example):**
```javascript
// src/app.js

const { IExecDataProtectorSharing } = require('@iexec/dataprotector');

async function computePoolTotal(protectedDataAddresses) {
  // This code runs inside Intel SGX enclave
  const dataProtectorSharing = new IExecDataProtectorSharing();

  let total = 0;
  const contributions = [];

  // Fetch and decrypt all protected data
  for (const address of protectedDataAddresses) {
    const decryptedData = await dataProtectorSharing.consumeProtectedData({
      protectedData: address,
      workerpoolAddress: process.env.WORKERPOOL_ADDRESS,
    });

    const contribution = JSON.parse(decryptedData);
    contributions.push({
      address: contribution.contributorAddress,
      // Amount stays encrypted in output
    });

    total += parseFloat(contribution.amount);
  }

  // Return only aggregated result
  return {
    totalAmount: total.toString(),
    contributorCount: contributions.length,
    // Individual amounts NOT included
  };
}

module.exports = { computePoolTotal };
```

**Building and Deploying iApp:**
```bash
# Build Docker image
docker build -t secsanta-pool-computer .

# Push to Docker Hub
docker push yourusername/secsanta-pool-computer

# Deploy to iExec
iexec app deploy
```

### 3. Smart Contract Updates

**New Contract Functions Needed:**
```solidity
// contracts/SecretPoolIExec.sol
pragma solidity ^0.8.20;

contract SecretPoolIExec {
    struct ProtectedContribution {
        address contributor;
        address protectedDataAddress; // From DataProtector
        uint256 timestamp;
    }

    struct Pool {
        string name;
        address creator;
        address recipient;
        uint256 threshold;
        ProtectedContribution[] contributions;
        bool finalized;
        uint256 computedTotal; // From iApp
    }

    mapping(bytes32 => Pool) public pools;

    event PoolCreated(bytes32 indexed poolId);
    event ProtectedContributionAdded(
        bytes32 indexed poolId,
        address indexed contributor,
        address protectedDataAddress
    );
    event PoolTotalComputed(bytes32 indexed poolId, uint256 total);
    event PoolFinalized(bytes32 indexed poolId, uint256 total);

    function createPool(
        string memory name,
        address recipient,
        uint256 threshold,
        address initialProtectedData
    ) external returns (bytes32) {
        bytes32 poolId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            name,
            block.timestamp
        ));

        Pool storage pool = pools[poolId];
        pool.name = name;
        pool.creator = msg.sender;
        pool.recipient = recipient;
        pool.threshold = threshold;
        pool.finalized = false;

        if (initialProtectedData != address(0)) {
            pool.contributions.push(ProtectedContribution({
                contributor: msg.sender,
                protectedDataAddress: initialProtectedData,
                timestamp: block.timestamp
            }));

            emit ProtectedContributionAdded(poolId, msg.sender, initialProtectedData);
        }

        emit PoolCreated(poolId);
        return poolId;
    }

    function addProtectedContribution(
        bytes32 poolId,
        address protectedDataAddress
    ) external {
        require(!pools[poolId].finalized, "Pool is finalized");
        require(protectedDataAddress != address(0), "Invalid protected data address");

        pools[poolId].contributions.push(ProtectedContribution({
            contributor: msg.sender,
            protectedDataAddress: protectedDataAddress,
            timestamp: block.timestamp
        }));

        emit ProtectedContributionAdded(poolId, msg.sender, protectedDataAddress);
    }

    function setComputedTotal(bytes32 poolId, uint256 total) external {
        // TODO: Add access control - only iExec oracle can call this
        require(!pools[poolId].finalized, "Already finalized");

        pools[poolId].computedTotal = total;
        emit PoolTotalComputed(poolId, total);

        // Auto-finalize if threshold met
        if (total >= pools[poolId].threshold) {
            _finalizePool(poolId);
        }
    }

    function _finalizePool(bytes32 poolId) private {
        Pool storage pool = pools[poolId];
        require(!pool.finalized, "Already finalized");

        pool.finalized = true;

        // Transfer funds to recipient
        payable(pool.recipient).transfer(pool.computedTotal);

        emit PoolFinalized(poolId, pool.computedTotal);
    }
}
```

### 4. Frontend Integration

**File Structure:**
```
lib/
  ├── iexec-config.ts         # iExec network configuration
  ├── iexec-dataprotector.ts  # DataProtector client
  ├── iexec-pool-service.ts   # Pool service with iExec
  └── privacy-config.ts       # Privacy mode settings
```

**Privacy Mode Configuration:**
```typescript
// lib/privacy-config.ts

export type PrivacyMode = 'none' | 'iexec' | 'zama';

const PRIVACY_MODE_KEY = 'secsanta-privacy-mode';

export function getPrivacyMode(): PrivacyMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PRIVACY_MODE_KEY) as PrivacyMode;
    if (stored && ['none', 'iexec', 'zama'].includes(stored)) {
      return stored;
    }
  }
  return 'none'; // Default: no privacy (public amounts)
}

export function setPrivacyMode(mode: PrivacyMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRIVACY_MODE_KEY, mode);
  }
}

export const PRIVACY_CONFIG = {
  none: {
    label: 'No Privacy',
    shortLabel: 'PUBLIC',
    color: 'gray',
    description: 'Contribution amounts are public',
    enabled: true,
  },
  iexec: {
    label: 'iExec (TEE)',
    shortLabel: 'IEXEC',
    color: 'purple',
    description: 'Encrypted with Trusted Execution Environments',
    enabled: true,
  },
  zama: {
    label: 'Zama (FHE)',
    shortLabel: 'ZAMA',
    color: 'indigo',
    description: 'Fully Homomorphic Encryption',
    enabled: false, // Will be enabled when Zama is implemented
  },
} as const;
```

**Updated Pool Service:**
```typescript
// lib/pool-service.ts

import { getPrivacyMode } from './privacy-config';
import { createPoolWithIExec, contributeToPoolWithIExec } from './iexec-pool-service';
import { createPoolWithZama, contributeToPoolWithZama } from './zama-pool-service';

export class PoolService {
  static async createPool(
    name: string,
    recipient: string,
    threshold: number,
    initialContribution: string
  ): Promise<string> {
    if (isMockMode()) {
      return await createMockPool(name, recipient, threshold, initialContribution);
    }

    const privacyMode = getPrivacyMode();

    switch (privacyMode) {
      case 'iexec':
        return await createPoolWithIExec(name, recipient, threshold, initialContribution);

      case 'zama':
        return await createPoolWithZama(name, recipient, threshold, initialContribution);

      case 'none':
      default:
        return await createPoolPublic(name, recipient, threshold, initialContribution);
    }
  }

  static async contribute(poolId: string, amount: string): Promise<void> {
    if (isMockMode()) {
      return await contributeMock(poolId, amount);
    }

    const privacyMode = getPrivacyMode();

    switch (privacyMode) {
      case 'iexec':
        return await contributeToPoolWithIExec(poolId, amount);

      case 'zama':
        return await contributeToPoolWithZama(poolId, amount);

      case 'none':
      default:
        return await contributePublic(poolId, amount);
    }
  }
}
```

**iExec Pool Service Implementation:**
```typescript
// lib/iexec-pool-service.ts

import { IExecDataProtector } from '@iexec/dataprotector';
import { ethers } from 'ethers';
import { SecretPoolIExecABI } from './abis';

export async function createPoolWithIExec(
  name: string,
  recipient: string,
  threshold: number,
  initialContribution: string
): Promise<string> {
  // 1. Get Web3 provider
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contributorAddress = await signer.getAddress();

  // 2. Encrypt initial contribution with DataProtector
  const dataProtector = new IExecDataProtector(provider);

  const protectedData = await dataProtector.protectData({
    data: {
      poolName: name,
      contributorAddress,
      amount: initialContribution,
      timestamp: Date.now(),
    },
    name: `SecSanta-${name}-${contributorAddress}-initial`,
  });

  // 3. Create pool on smart contract
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_POOL_CONTRACT_IEXEC,
    SecretPoolIExecABI,
    signer
  );

  const thresholdWei = ethers.utils.parseEther(threshold.toString());

  const tx = await contract.createPool(
    name,
    recipient,
    thresholdWei,
    protectedData.address // Address of protected data
  );

  const receipt = await tx.wait();
  const poolCreatedEvent = receipt.events?.find(e => e.event === 'PoolCreated');
  const poolId = poolCreatedEvent?.args?.poolId;

  return poolId;
}

export async function contributeToPoolWithIExec(
  poolId: string,
  amount: string
): Promise<void> {
  // 1. Get Web3 provider
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contributorAddress = await signer.getAddress();

  // 2. Encrypt contribution with DataProtector
  const dataProtector = new IExecDataProtector(provider);

  const protectedData = await dataProtector.protectData({
    data: {
      poolId,
      contributorAddress,
      amount,
      timestamp: Date.now(),
    },
    name: `SecSanta-Pool-${poolId}-${contributorAddress}`,
  });

  // 3. Add encrypted contribution to pool
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_POOL_CONTRACT_IEXEC,
    SecretPoolIExecABI,
    signer
  );

  const tx = await contract.addProtectedContribution(
    poolId,
    protectedData.address
  );

  await tx.wait();

  // 4. Trigger iApp computation (optional - can be done by creator)
  // This would call the iApp to compute the new total
}
```

## Network Configuration

### Bellecour Testnet (Recommended for Testing)

iExec's primary testnet is **Bellecour**, not Arbitrum Sepolia.

**Network Details:**
```typescript
// lib/iexec-config.ts

export const IEXEC_NETWORKS = {
  bellecour: {
    chainId: 134,
    name: 'iExec Bellecour',
    rpcUrl: 'https://bellecour.iex.ec',
    explorerUrl: 'https://blockscout-bellecour.iex.ec',
    nativeCurrency: {
      name: 'xRLC',
      symbol: 'xRLC',
      decimals: 18,
    },
    faucet: 'https://faucet.bellecour.iex.ec',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;
```

**Getting Test Tokens:**
1. Visit: https://faucet.bellecour.iex.ec
2. Connect your wallet
3. Request xRLC (test tokens for Bellecour)
4. Use xRLC to pay for iApp executions

### Updated Wagmi Config

```typescript
// lib/wagmi.ts

import { bellecour, arbitrum } from 'wagmi/chains';

// Define Bellecour chain
export const bellecour = {
  id: 134,
  name: 'iExec Bellecour',
  network: 'bellecour',
  nativeCurrency: { name: 'xRLC', symbol: 'xRLC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bellecour.iex.ec'] },
    public: { http: ['https://bellecour.iex.ec'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout-bellecour.iex.ec' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'SecSanta - Secret Gift Pools',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [
    sepolia,     // Ethereum testnet
    bellecour,   // iExec testnet (for iExec privacy mode)
    arbitrum,    // Arbitrum mainnet (for production iExec)
    mainnet,     // Ethereum mainnet
  ],
  ssr: true,
});
```

## UI Changes: Privacy Mode Selector

### Updated Debug Panel

```typescript
// components/DebugPanel.tsx

import { PRIVACY_CONFIG, getPrivacyMode, setPrivacyMode, type PrivacyMode } from '@/lib/privacy-config';

export function DebugPanel() {
  const [privacyMode, setPrivacyModeState] = useState<PrivacyMode>('none');

  useEffect(() => {
    const mode = getPrivacyMode();
    setPrivacyModeState(mode);
  }, []);

  const handlePrivacyChange = (newMode: PrivacyMode) => {
    setPrivacyModeState(newMode);
    setPrivacyMode(newMode);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Network</label>
        {/* ... existing network selector ... */}
      </div>

      {/* Privacy Mode Selector (only show in Sepolia/Mainnet) */}
      {networkMode !== 'mock' && (
        <div>
          <label className="block text-sm font-medium mb-2">Privacy Mode</label>
          <p className="text-xs text-gray-500 mb-2">
            Choose how contribution amounts are protected
          </p>

          {(['none', 'iexec', 'zama'] as const).map((mode) => {
            const config = PRIVACY_CONFIG[mode];
            const isSelected = privacyMode === mode;
            const isDisabled = !config.enabled;

            return (
              <button
                key={mode}
                onClick={() => !isDisabled && handlePrivacyChange(mode)}
                disabled={isDisabled}
                className={`w-full text-left px-3 py-2 rounded-md border-2 transition-all mb-2 ${
                  isSelected
                    ? `border-${config.color}-500 bg-${config.color}-50`
                    : isDisabled
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{config.label}</span>
                  {isSelected && <div className={`w-2 h-2 rounded-full bg-${config.color}-500`} />}
                  {isDisabled && <span className="text-xs text-gray-400">Coming Soon</span>}
                </div>
                <p className="text-xs mt-0.5 text-gray-600">{config.description}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Storage Selector */}
      {/* ... existing storage toggle ... */}
    </div>
  );
}
```

### Status Badge Update

```typescript
// Show privacy mode in bottom-right badge
{mounted && networkMode !== 'mock' && privacyMode !== 'none' && (
  <span className="text-xs">
    {PRIVACY_CONFIG[privacyMode].shortLabel}
  </span>
)}
```

## Step-by-Step Implementation Guide

### Phase 1: Setup (Day 1)

**1. Install Dependencies**
```bash
cd /Users/batikanorpava/Documents/other_development/2025-10-ethrome/SecSanta/fe
npm install @iexec/dataprotector @iexec/iapp-generator
npm install -g @iexec/cli
```

**2. Create Privacy Config Files**
```bash
# Create new files
touch lib/privacy-config.ts
touch lib/iexec-config.ts
touch lib/iexec-dataprotector.ts
touch lib/iexec-pool-service.ts
```

**3. Setup Bellecour Testnet**
- Add Bellecour to MetaMask (chainId: 134)
- Get test xRLC from faucet: https://faucet.bellecour.iex.ec
- Update wagmi.ts to include Bellecour chain

### Phase 2: DataProtector Integration (Day 2-3)

**1. Implement Privacy Config**
- Copy privacy-config.ts code from above
- Add to network-config.ts integration

**2. Implement DataProtector Client**
- Copy iexec-dataprotector.ts code from above
- Test encryption/decryption locally

**3. Update UI**
- Add Privacy Mode selector to DebugPanel
- Update status badge
- Add privacy mode indicators to pool cards

### Phase 3: iApp Creation (Day 4-5)

**1. Initialize iApp Project**
```bash
cd /Users/batikanorpava/Documents/other_development/2025-10-ethrome/SecSanta
mkdir iexec-iapp
cd iexec-iapp

# Generate iApp
npx @iexec/iapp-generator init

# Choose:
# - Language: JavaScript
# - Project mode: Basic
# - Purpose: Confidential computation
```

**2. Implement Pool Total Computation**
- Edit `src/app.js` with pool total logic
- Handle multiple encrypted contributions
- Return only aggregated total

**3. Build and Test Locally**
```bash
# Build Docker image
docker build -t secsanta-pool-computer .

# Test locally
docker run secsanta-pool-computer
```

**4. Deploy to iExec**
```bash
# Deploy app to iExec
iexec app deploy

# Note the deployed app address
```

### Phase 4: Smart Contract (Day 6-7)

**1. Create Contracts Project**
```bash
cd /Users/batikanorpava/Documents/other_development/2025-10-ethrome/SecSanta
mkdir contracts-iexec
cd contracts-iexec

npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

**2. Write SecretPoolIExec Contract**
- Copy contract code from above
- Add iExec oracle integration
- Test with Hardhat

**3. Deploy to Bellecour**
```bash
# Configure hardhat for Bellecour
# Deploy
npx hardhat run scripts/deploy.ts --network bellecour
```

### Phase 5: Frontend Integration (Day 8-9)

**1. Implement iExec Pool Service**
- Copy iexec-pool-service.ts code
- Update pool-service.ts to use privacy modes
- Test create pool flow

**2. Add Contract ABIs**
```bash
# Copy ABIs from compiled contracts
cp ../contracts-iexec/artifacts/contracts/SecretPoolIExec.sol/SecretPoolIExec.json lib/abis/
```

**3. Update Pool Components**
- Show encrypted contribution indicators
- Add "Compute Total" button (triggers iApp)
- Display computed total vs individual amounts

### Phase 6: Testing (Day 10)

**1. End-to-End Test Flow**
- Create pool with encrypted contribution
- Add more encrypted contributions
- Trigger iApp computation
- Verify only total is revealed
- Finalize pool

**2. Cross-Browser Test**
- Test with Upstash sync
- Verify encrypted data syncs correctly
- Test privacy mode switching

### Phase 7: Deployment (Day 11)

**1. Environment Variables**
```bash
# Add to .env.local
NEXT_PUBLIC_POOL_CONTRACT_IEXEC=0x...  # Bellecour contract address
NEXT_PUBLIC_IEXEC_APP_ADDRESS=0x...    # iApp address
```

**2. Deploy to Vercel**
```bash
vercel --prod --yes
```

**3. Submit Bounty**
- Document iExec integration
- Record demo video
- Submit to ETHRome

## Environment Variables

```bash
# .env.local

# Existing variables
NEXT_PUBLIC_USE_SYNC_SERVER=true
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Network defaults
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_DEFAULT_PRIVACY_MODE=none

# iExec on Bellecour (testnet)
NEXT_PUBLIC_POOL_CONTRACT_IEXEC_BELLECOUR=0x...
NEXT_PUBLIC_IEXEC_APP_ADDRESS_BELLECOUR=0x...

# iExec on Arbitrum (mainnet - future)
NEXT_PUBLIC_POOL_CONTRACT_IEXEC_ARBITRUM=0x...
NEXT_PUBLIC_IEXEC_APP_ADDRESS_ARBITRUM=0x...
```

## Privacy Mode Comparison

| Feature | None | iExec (TEE) | Zama (FHE) |
|---------|------|-------------|------------|
| **Encryption** | ❌ Public | ✅ AES-256 | ✅ FHE |
| **Computation** | On-chain | Off-chain (TEE) | On-chain |
| **Gas Cost** | Low | Medium | High |
| **Privacy Level** | None | High | Very High |
| **Maturity** | Stable | Production Ready | Beta |
| **Network** | Any EVM | Bellecour/Arbitrum | Sepolia (testnet) |
| **Use Case** | Public pools | Private contributions | Encrypted computation |

## Testing Checklist

### Before Deployment

- [ ] Privacy mode selector shows all three options
- [ ] Privacy config persists across page refresh
- [ ] iExec mode only available in Sepolia/Bellecour
- [ ] DataProtector encrypts contributions successfully
- [ ] Build succeeds with iExec dependencies

### After Deploying Phase 1 (DataProtector)

- [ ] Can encrypt contribution with DataProtector
- [ ] Protected data stored on IPFS
- [ ] Ownership recorded on-chain
- [ ] Can view protected data address in pool

### After Deploying Phase 2 (iApp)

- [ ] iApp can fetch protected data
- [ ] iApp decrypts in TEE correctly
- [ ] iApp computes total without revealing individuals
- [ ] Result verifiable on-chain

### After Full Integration

- [ ] Create pool with encrypted contributions
- [ ] Add multiple encrypted contributions
- [ ] Trigger confidential computation
- [ ] Only total revealed, amounts stay private
- [ ] Pool finalizes correctly

## Open Questions

1. **iApp Trigger**: Who triggers the iApp computation? Creator? Automatic? Oracle?
2. **Gas Sponsorship**: Should we sponsor iApp executions on Bellecour?
3. **Computation Frequency**: Compute total after each contribution or on-demand?
4. **Result Oracle**: How does iApp result get back to smart contract? Need oracle?
5. **Network Choice**: Start with Bellecour or wait for Arbitrum support?
6. **Migration Path**: How to migrate from "none" privacy to iExec?
7. **Cost Estimation**: How much xRLC per computation? Need to estimate costs.

## Resources

- **DataProtector Docs**: https://tools.docs.iex.ec/tools/dataProtector
- **iApp Generator**: https://tools.docs.iex.ec/tools/iapp-generator
- **iExec SDK**: https://github.com/iExecBlockchainComputing/iexec-sdk
- **Bellecour Explorer**: https://blockscout-bellecour.iex.ec
- **Bellecour Faucet**: https://faucet.bellecour.iex.ec
- **iExec Discord**: https://discord.gg/pbt9m98wnU

## Next Steps

1. **Immediate**: Install dependencies and create config files
2. **Day 1-3**: Implement DataProtector encryption
3. **Day 4-5**: Create and deploy iApp
4. **Day 6-7**: Write and deploy smart contracts
5. **Day 8-9**: Integrate frontend
6. **Day 10**: Test thoroughly
7. **Day 11**: Deploy and submit bounty

---

**Ready to build private gift pools with iExec! 🎁🔒**
