# Smart Contract Integration Guide

## 🔗 For the Backend/Smart Contract Team Member

This guide explains how to integrate smart contracts with the existing frontend.

---

## 📋 Current State

The frontend is **100% complete and functional** in DEBUG mode:
- ✅ All UI components working
- ✅ All user flows implemented
- ✅ ENS integration complete
- ✅ Mock data system in place
- ✅ TypeScript types defined

**Your job**: Replace mock data calls with real smart contract interactions.

---

## 🎯 Required Smart Contract Functions

### 1. Create Pool
```solidity
function createPool(
    address recipient,
    uint256 finalizationThreshold,
    string memory giftSuggestion
) external payable returns (uint256 poolId);
```

**What it does**:
- Creates a new gift pool
- Records creator's contribution (msg.value)
- Returns a unique pool ID
- Emits PoolCreated event

### 2. Join Pool
```solidity
function joinPool(uint256 poolId) external payable;
```

**What it does**:
- Adds contributor to pool
- Records contribution amount (msg.value)
- Checks if threshold is met
- Auto-finalizes if threshold reached
- Emits ContributorJoined event

### 3. Get Pool Details
```solidity
function getPool(uint256 poolId) external view returns (
    string memory name,
    address recipient,
    address[] memory contributors,
    uint256 finalizationThreshold,
    uint256 totalAmount,
    string memory giftSuggestion,
    bool finalized
);
```

### 4. Get All Pools
```solidity
function getAllPools() external view returns (uint256[] memory poolIds);
```

### 5. Get Contribution Amount
```solidity
function getContribution(uint256 poolId, address contributor)
    external view returns (uint256 amount);
```

**Privacy Note**: This should only return amounts if pool is finalized!

---

## 📁 Files to Modify

### Main Integration File

**File**: `fe/lib/pool-service.ts`

This is the **ONLY** file you need to modify. All UI components already use this service layer.

### Step-by-Step Integration

#### 1. Update Environment Variables

Add to `fe/.env.local`:
```env
# Set to false to use real blockchain
NEXT_PUBLIC_FE_DEBUG_MODE=false

# Your deployed contract address
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x...

# Network (1 for mainnet, 11155111 for sepolia, 8453 for base)
NEXT_PUBLIC_CHAIN_ID=1
```

#### 2. Create Contract ABI File

Create `fe/lib/abis/PoolContract.ts`:
```typescript
export const PoolContractABI = [
  // Paste your contract ABI here
  {
    "inputs": [...],
    "name": "createPool",
    "outputs": [...],
    "stateMutability": "payable",
    "type": "function"
  },
  // ... rest of ABI
] as const;
```

#### 3. Modify PoolService Methods

Replace the mock implementations with real contract calls.

### Example: createPool Implementation

```typescript
import { parseEther, formatEther } from 'viem';
import { writeContract, waitForTransactionReceipt, readContract } from '@wagmi/core';
import { config } from './wagmi';
import { PoolContractABI } from './abis/PoolContract';

const POOL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS as `0x${string}`;

static async createPool(
  data: CreatePoolFormData,
  creatorAddress: string
): Promise<{ success: boolean; poolId?: string; error?: string }> {
  if (DEBUG_MODE) {
    // ... existing mock implementation ...
    return { success: true, poolId };
  }

  try {
    // Write to contract
    const { hash } = await writeContract(config, {
      address: POOL_CONTRACT_ADDRESS,
      abi: PoolContractABI,
      functionName: 'createPool',
      args: [
        data.recipientAddress as `0x${string}`,
        BigInt(data.finalizationThreshold),
        data.giftSuggestion,
      ],
      value: parseEther(data.selfContribution),
    });

    // Wait for transaction
    const receipt = await waitForTransactionReceipt(config, { hash });

    // Parse event to get pool ID
    const poolCreatedEvent = receipt.logs.find(
      log => log.topics[0] === 'PoolCreated...' // Your event signature
    );

    const poolId = /* extract from event */;

    return { success: true, poolId: poolId.toString() };
  } catch (error: any) {
    console.error('Error creating pool:', error);
    return {
      success: false,
      error: error.message || 'Failed to create pool'
    };
  }
}
```

### Example: getPools Implementation

```typescript
static async getPools(): Promise<Pool[]> {
  if (DEBUG_MODE) {
    // ... existing mock implementation ...
    return getMockPools();
  }

  try {
    // Get all pool IDs
    const poolIds = await readContract(config, {
      address: POOL_CONTRACT_ADDRESS,
      abi: PoolContractABI,
      functionName: 'getAllPools',
    });

    // Fetch details for each pool
    const pools = await Promise.all(
      poolIds.map(async (poolId) => {
        const poolData = await readContract(config, {
          address: POOL_CONTRACT_ADDRESS,
          abi: PoolContractABI,
          functionName: 'getPool',
          args: [poolId],
        });

        // Transform contract data to Pool type
        return {
          id: poolId.toString(),
          name: poolData.name,
          recipientAddress: poolData.recipient,
          giftSuggestion: poolData.giftSuggestion,
          finalizationThreshold: Number(poolData.finalizationThreshold),
          contributors: await this.getContributors(poolId),
          status: poolData.finalized ? 'finalized' : 'ongoing',
          totalAmount: poolData.finalized
            ? formatEther(poolData.totalAmount)
            : undefined,
          createdAt: /* from blockchain timestamp */,
        } as Pool;
      })
    );

    return pools;
  } catch (error) {
    console.error('Error fetching pools:', error);
    throw error;
  }
}
```

### Example: joinPool Implementation

```typescript
static async joinPool(
  data: JoinPoolFormData,
  contributorAddress: string
): Promise<{ success: boolean; error?: string }> {
  if (DEBUG_MODE) {
    // ... existing mock implementation ...
  }

  try {
    const { hash } = await writeContract(config, {
      address: POOL_CONTRACT_ADDRESS,
      abi: PoolContractABI,
      functionName: 'joinPool',
      args: [BigInt(data.poolId)],
      value: parseEther(data.contribution),
    });

    await waitForTransactionReceipt(config, { hash });

    return { success: true };
  } catch (error: any) {
    console.error('Error joining pool:', error);
    return {
      success: false,
      error: error.message || 'Failed to join pool'
    };
  }
}
```

---

## 🔄 Testing Your Integration

### 1. Test on Testnet First
```env
NEXT_PUBLIC_FE_DEBUG_MODE=false
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x... # Your sepolia deployment
NEXT_PUBLIC_CHAIN_ID=11155111 # Sepolia
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

### 2. Test Flow
1. Connect wallet on Sepolia
2. Get test ETH from faucet
3. Create a pool
4. Join with second wallet
5. Verify finalization

### 3. Check UI Updates
All UI should automatically work:
- Dashboard refreshes with new pools
- Pool detail page shows real data
- ENS resolution works
- Transaction loading states appear

---

## 🎨 UI Already Handles

You don't need to worry about these - the UI already handles:

- ✅ Loading states during transactions
- ✅ Error messages
- ✅ Success confirmations
- ✅ ENS name resolution
- ✅ Address formatting
- ✅ Date formatting
- ✅ Responsive design
- ✅ Wallet connection
- ✅ Chain switching

---

## 📝 Type Definitions

The types are already defined in `fe/types/pool.ts`:

```typescript
export interface Pool {
  id: string;
  name: string;
  creatorAddress: string;
  recipientAddress: string;
  recipientEnsName?: string;
  giftSuggestion: string;
  finalizationThreshold: number;
  contributors: Contributor[];
  status: 'ongoing' | 'finalized' | 'cancelled';
  totalAmount?: string;
  createdAt: number;
  finalizedAt?: number;
}

export interface Contributor {
  address: string;
  ensName?: string;
  amount: string;
  joinedAt: number;
}
```

Make sure your contract data maps to these interfaces.

---

## 🚨 Important Considerations

### Privacy Implementation

**Current**: Amounts hidden in UI only

**Production Options**:

1. **Basic**: Smart contract enforces privacy
   ```solidity
   mapping(uint256 => mapping(address => uint256)) private contributions;

   function getContribution(uint256 poolId, address contributor)
       public view returns (uint256) {
       require(pools[poolId].finalized, "Pool not finalized");
       return contributions[poolId][contributor];
   }
   ```

2. **Advanced**: Use iExec or Zama for FHE
   - Encrypt contributions on-chain
   - Decrypt only when finalized
   - Requires integration with privacy protocol

### Event Handling

Emit events for frontend to listen:
```solidity
event PoolCreated(uint256 indexed poolId, address creator, address recipient);
event ContributorJoined(uint256 indexed poolId, address contributor);
event PoolFinalized(uint256 indexed poolId, uint256 totalAmount);
```

Frontend can listen to these for real-time updates:
```typescript
import { watchContractEvent } from '@wagmi/core';

watchContractEvent(config, {
  address: POOL_CONTRACT_ADDRESS,
  abi: PoolContractABI,
  eventName: 'PoolFinalized',
  onLogs: (logs) => {
    // Refresh pool data
    refetch();
  },
});
```

### Gas Optimization

Tips for your smart contract:
- Use `uint256` for pool IDs (cheaper than strings)
- Batch operations where possible
- Consider upgradeability (proxy pattern)
- Optimize storage layout

---

## 🔍 Debugging

If something doesn't work:

1. **Check DEBUG mode**: Is it actually off?
   ```typescript
   console.log('DEBUG_MODE:', DEBUG_MODE); // Should be false
   ```

2. **Check contract address**:
   ```typescript
   console.log('Contract:', POOL_CONTRACT_ADDRESS);
   ```

3. **Check network**:
   ```typescript
   console.log('Chain ID:', config.chains[0].id);
   ```

4. **Check wallet connection**:
   - Is wallet connected?
   - Is it on the right network?
   - Does it have enough gas?

5. **Check transaction errors**:
   - Look at browser console
   - Check transaction on block explorer
   - Verify contract function exists

---

## 📚 Helpful Resources

### Wagmi v2 Documentation
- [Writing to Contracts](https://wagmi.sh/react/guides/write-to-contract)
- [Reading from Contracts](https://wagmi.sh/react/guides/read-from-contract)
- [Watching Events](https://wagmi.sh/core/api/actions/watchContractEvent)

### Viem Documentation
- [parseEther](https://viem.sh/docs/utilities/parseEther)
- [formatEther](https://viem.sh/docs/utilities/formatEther)
- [Transaction Receipts](https://viem.sh/docs/actions/public/waitForTransactionReceipt)

### Example Projects
- Look at Scaffold-ETH-2 examples
- Wagmi examples repo
- RainbowKit docs

---

## ✅ Integration Checklist

- [ ] Smart contracts deployed to testnet
- [ ] Contract ABI exported
- [ ] ABI file created in `fe/lib/abis/`
- [ ] Contract address in `.env.local`
- [ ] DEBUG_MODE set to false
- [ ] Implemented `createPool` in pool-service.ts
- [ ] Implemented `joinPool` in pool-service.ts
- [ ] Implemented `getPools` in pool-service.ts
- [ ] Implemented `getPool` in pool-service.ts
- [ ] Tested create pool flow
- [ ] Tested join pool flow
- [ ] Tested finalization
- [ ] Verified ENS resolution works
- [ ] Checked gas costs
- [ ] Ready for mainnet deployment

---

## 🤝 Communication

If you need to modify the frontend:

**DO**:
- Modify `pool-service.ts`
- Add new utility functions in `lib/utils.ts`
- Update types in `types/pool.ts` if needed

**DON'T**:
- Modify UI components (unless absolutely necessary)
- Change the Pool/Contributor interfaces drastically
- Remove DEBUG mode (keep it for testing)

**Questions?**
- Comment in the code
- Create GitHub issues
- Ask in team chat

---

## 🎉 Success Criteria

You know integration is complete when:

1. ✅ Create pool works with real transactions
2. ✅ Join pool works with real transactions
3. ✅ Pools display from blockchain
4. ✅ Finalization triggers automatically
5. ✅ ENS names resolve correctly
6. ✅ All UI features work as in DEBUG mode
7. ✅ No console errors
8. ✅ Transactions confirm on block explorer

---

**Good luck with the integration! The frontend team has your back. 🚀**
