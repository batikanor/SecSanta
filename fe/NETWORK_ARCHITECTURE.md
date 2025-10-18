# Network Architecture Plan

## Overview
SecSanta will support three modes:
1. **Mock Mode**: No blockchain, mock data for UI development
2. **Sepolia Mode**: Ethereum Sepolia testnet + Zama fhEVM for testing
3. **Mainnet Mode**: Production Ethereum mainnet (future)

## Current Architecture

### Existing Components
- ✅ Sepolia already configured in `lib/wagmi.ts` (conditional)
- ✅ Types are FHE-aware (`Pool.totalAmount`, `Contributor.amount`)
- ✅ Mock data system working
- ✅ RainbowKit wallet integration

### Current Toggles
1. **Storage**: `local` | `vercel-kv`
2. **Blockchain**: `mock` | `real`

## Proposed Changes

### 1. Toggle Redesign

**Before:**
```
Storage: Local ↔ Upstash
Blockchain: Mock ↔ Real
```

**After:**
```
Storage: Local ↔ Upstash
Network: Mock → Sepolia → Mainnet
```

**localStorage Key:**
```typescript
'secsanta-network-mode': 'mock' | 'sepolia' | 'mainnet'
```

**Default:** `'sepolia'` (safe for testing, works with Zama)

---

## Phase-by-Phase Implementation

### Phase 1: Network Selector UI (Immediate)

**Files to modify:**
- `components/DebugPanel.tsx` - Change toggle to 3-way selector
- `lib/network-config.ts` - NEW: Network configuration helper
- `components/Header.tsx` - Show current network
- `lib/pool-service.ts` - Update to check network mode

**Network Configuration:**
```typescript
// lib/network-config.ts
export type NetworkMode = 'mock' | 'sepolia' | 'mainnet';

export const NETWORK_CONFIG = {
  mock: {
    label: 'Mock',
    color: 'yellow',
    chainId: null,
    ensSupported: false, // Use mock ENS
  },
  sepolia: {
    label: 'Sepolia Testnet',
    color: 'blue',
    chainId: 11155111,
    ensSupported: true, // Sepolia has ENS
    rpcUrl: 'https://sepolia.infura.io/v3/...',
  },
  mainnet: {
    label: 'Ethereum Mainnet',
    color: 'green',
    chainId: 1,
    ensSupported: true,
    rpcUrl: 'https://mainnet.infura.io/v3/...',
  },
} as const;
```

### Phase 2: Smart Contract Foundation (Next)

**Smart Contract Structure:**
```
contracts/
├── SecretPool.sol          # Main pool contract
├── interfaces/
│   └── ISecretPool.sol
├── test/
│   └── SecretPool.test.ts
└── scripts/
    ├── deploy-sepolia.ts
    └── deploy-mainnet.ts
```

**Basic Pool Contract (v1 - No FHE yet):**
```solidity
// contracts/SecretPool.sol
pragma solidity ^0.8.20;

contract SecretPool {
    struct Pool {
        string name;
        address creator;
        address recipient;
        uint256 threshold;
        uint256 contributorCount;
        bool finalized;
    }

    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(address => uint256)) public contributions;

    event PoolCreated(bytes32 indexed poolId, address creator);
    event ContributionMade(bytes32 indexed poolId, address contributor);
    event PoolFinalized(bytes32 indexed poolId, uint256 totalAmount);

    function createPool(/* params */) external { /* ... */ }
    function contribute(bytes32 poolId) external payable { /* ... */ }
    function finalizePool(bytes32 poolId) external { /* ... */ }
}
```

**Deployment Addresses:**
```typescript
// lib/contract-addresses.ts
export const POOL_CONTRACT_ADDRESSES = {
  sepolia: '0x...', // Deployed on Sepolia
  mainnet: '0x...', // Future mainnet deployment
} as const;
```

### Phase 3: Zama fhEVM Integration (Future)

**Zama Setup:**
- Zama fhEVM is built on top of Ethereum (testnet available)
- Uses threshold FHE (TFHE) for encrypted computations
- Allows encrypted uint256 operations on-chain

**Contract with FHE:**
```solidity
// contracts/SecretPoolFHE.sol
pragma solidity ^0.8.20;

import "fhevm/lib/TFHE.sol";

contract SecretPoolFHE {
    struct Pool {
        string name;
        address creator;
        address recipient;
        uint256 threshold;
        euint32 totalAmount; // ← ENCRYPTED total
        uint256 contributorCount;
        bool finalized;
    }

    // Encrypted contributions
    mapping(bytes32 => mapping(address => euint32)) private encryptedContributions;

    function contribute(bytes32 poolId, bytes calldata encryptedAmount) external {
        euint32 amount = TFHE.asEuint32(encryptedAmount);
        encryptedContributions[poolId][msg.sender] = amount;

        // Add to total (FHE addition)
        pools[poolId].totalAmount = TFHE.add(
            pools[poolId].totalAmount,
            amount
        );
    }

    function finalizePool(bytes32 poolId) external {
        // Decrypt total amount (threshold decryption)
        uint32 total = TFHE.decrypt(pools[poolId].totalAmount);
        // Now revealed to recipient
    }
}
```

**Frontend FHE Integration:**
```typescript
// lib/fhe-client.ts
import { createFhevmInstance } from 'fhevmjs';

export async function encryptContribution(amount: bigint, contractAddress: string) {
  const instance = await createFhevmInstance({
    chainId: 11155111, // Sepolia
    publicKey: await getPublicKey(contractAddress),
  });

  return instance.encrypt32(amount);
}
```

---

## Network-Specific Behavior

### Mock Mode
- **Pool Storage**: localStorage or Upstash Redis
- **Contributions**: Plain numbers, no encryption
- **ENS**: Mock resolver (`vitalik.eth` → `0xd8dA...`)
- **Gas**: Free (no blockchain)
- **Use Case**: UI development, demos

### Sepolia Mode
- **Pool Storage**: On-chain events + indexing OR Upstash as cache
- **Contributions**: Real transactions on Sepolia
- **ENS**: Real Sepolia ENS resolution
- **Gas**: Free Sepolia ETH from faucet
- **Smart Contracts**: Deployed on Sepolia
- **Use Case**: Integration testing, hackathon demos

### Sepolia + Zama Mode (Future Phase 3)
- **Contributions**: Encrypted via Zama TFHE
- **Storage**: Zama fhEVM-compatible contracts
- **Computation**: On-chain FHE sum computation
- **Decryption**: Threshold decryption when finalized
- **Use Case**: Privacy testing, pre-production

### Mainnet Mode (Future, Post-Audit)
- **Everything real**: Real ETH, audited contracts
- **High security**: Multi-sig, timelock, emergency pause
- **Use Case**: Production

---

## File Changes Summary

### New Files
- ✅ `NETWORK_ARCHITECTURE.md` (this file)
- `lib/network-config.ts` - Network configuration
- `lib/contract-addresses.ts` - Deployed contract addresses
- `lib/fhe-client.ts` - Zama FHE encryption (Phase 3)
- `contracts/SecretPool.sol` - Smart contract (Phase 2)

### Modified Files
- `components/DebugPanel.tsx` - 3-way network selector
- `lib/debug-data.ts` - Rename `isBlockchainMockMode()` → `getNetworkMode()`
- `lib/pool-service.ts` - Switch on network mode
- `components/ENSInput.tsx` - Network-aware ENS resolution
- `lib/wagmi.ts` - Always enable Sepolia
- `.env.example` - Add Sepolia RPC URL

---

## Environment Variables

```bash
# Network Configuration
NEXT_PUBLIC_ENABLE_TESTNETS=true # Always true now
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia # mock | sepolia | mainnet

# Contract Addresses
NEXT_PUBLIC_POOL_CONTRACT_SEPOLIA=0x...
NEXT_PUBLIC_POOL_CONTRACT_MAINNET=0x...

# Sepolia RPC (optional, uses public RPC by default)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Zama fhEVM (Phase 3)
NEXT_PUBLIC_ZAMA_GATEWAY_URL=https://gateway.zama.ai
```

---

## Migration Path

### Step 1: UI Changes (No Breaking Changes)
- Add network selector dropdown
- Keep existing localStorage keys working
- Default to Sepolia for new users

### Step 2: Contract Deployment
- Deploy basic pool contract to Sepolia
- Test with real wallets
- Index events for pool data

### Step 3: Zama Integration
- Deploy FHE contracts
- Add encryption to contributions
- Enable privacy features

### Step 4: Mainnet (After Audit)
- Security audit
- Deploy to mainnet
- Switch default to Sepolia (mainnet opt-in)

---

## Security Considerations

### Mock Mode
- ⚠️ Data in localStorage is unencrypted
- ⚠️ Anyone with browser access can see pools
- ✅ No real money at risk

### Sepolia Mode
- ✅ On-chain transparency (all contributions visible)
- ⚠️ No privacy yet (amounts are public)
- ✅ Free to test (testnet ETH)

### Sepolia + Zama Mode
- ✅ Encrypted contributions (TFHE)
- ✅ Total computed without revealing individuals
- ⚠️ Decryption threshold needed
- ✅ Privacy-preserving

### Mainnet Mode
- ✅ Real money, audited contracts
- ✅ Privacy with FHE
- ⚠️ Gas costs apply
- ⚠️ Irreversible transactions

---

## Open Questions for Discussion

1. **Indexing Strategy**: Use The Graph? Custom indexer? Just Upstash cache?
2. **Zama Timing**: Wait for stable fhEVM release? Use current testnet?
3. **Gas Sponsorship**: Should we sponsor gas on Sepolia for better UX?
4. **Network Auto-Switch**: Should we auto-switch user's wallet to Sepolia?
5. **Mainnet Timeline**: When do we plan production launch?

---

## Next Steps (Immediate)

1. ✅ Create this architecture doc
2. Implement network selector UI (3-way dropdown)
3. Create `lib/network-config.ts`
4. Update all components to use network mode
5. Enable Sepolia by default
6. Test network switching
7. (Later) Write and deploy smart contracts
