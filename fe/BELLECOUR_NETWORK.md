# Bellecour Network Required for iExec! 🔐

**Production URL:** https://secsanta-koxvwed6b-batikanors-projects.vercel.app

## Critical Fix: iExec Requires Bellecour Network

### What Changed

iExec DataProtector **only works on Bellecour network (chain ID 134)**, NOT Sepolia or Ethereum mainnet. Bellecour is iExec's dedicated sidechain for confidential computing.

### What We Fixed

1. ✅ **Added Bellecour Network to Wagmi Config** (`lib/wagmi.ts`)
   - Defined custom Bellecour chain (chain ID 134)
   - RPC URL: `https://bellecour.iex.ec`
   - Block Explorer: `https://blockscout-bellecour.iex.ec`
   - Native currency: xRLC (18 decimals)

2. ✅ **Added Bellecour to Network Options** (`lib/network-config.ts`)
   - New network mode: `'bellecour'`
   - Selectable in settings panel
   - Purple color indicator

3. ✅ **Updated Privacy Config** (`lib/privacy-config.ts`)
   - iExec privacy mode now requires Bellecour network
   - Updated description to mention network requirement

4. ✅ **Added Network Verification** (`lib/iexec-dataprotector.ts`)
   - Checks wallet is on Bellecour (chain ID 134) before encryption
   - Provides clear error message if on wrong network
   - Tells user to switch to Bellecour in their wallet

## How to Test iExec Encryption

### Step 1: Open the App

Visit: https://secsanta-koxvwed6b-batikanors-projects.vercel.app

### Step 2: Add Bellecour Network to Your Wallet

**Option A: Automatic (via app)**
1. Click "Connect Wallet"
2. When you select iExec privacy mode, your wallet should prompt you to add/switch to Bellecour

**Option B: Manual (MetaMask)**
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter Bellecour details:
   ```
   Network Name: iExec Sidechain (Bellecour)
   RPC URL: https://bellecour.iex.ec
   Chain ID: 134
   Currency Symbol: xRLC
   Block Explorer: https://blockscout-bellecour.iex.ec
   ```
6. Click "Save"

**Option C: Via ChainList**
1. Visit https://chainlist.org/chain/134
2. Click "Connect Wallet"
3. Click "Add to MetaMask"

### Step 3: Get xRLC Testnet Tokens

You need xRLC (Bellecour's native token) to pay for transactions on Bellecour:

1. Visit iExec Faucet: https://faucet.bellecour.iex.ec
2. Connect your wallet (on Bellecour network)
3. Request testnet xRLC
4. You should receive a small amount for testing

### Step 4: Configure SecSanta for Bellecour + iExec

1. Open settings (bottom-right corner)
2. **Data Storage**: Select **Upstash** (recommended)
3. **Network**: Select **Bellecour (iExec)**
4. **Privacy Mode**: Select **iExec (TEE)**
5. Status badge should show: `UPSTASH / BELLECOUR / IEXEC`

### Step 5: Create an Encrypted Pool

1. Make sure you're connected to Bellecour in your wallet
2. Click "Create Pool"
3. Fill in form:
   - Pool name: "Test Bellecour iExec"
   - Recipient: Any Ethereum address
   - Your contribution: "0.1" xRLC
   - Threshold: 3 contributors
   - Gift suggestion: "Gaming Console"
4. Click "Create Pool"
5. Watch the console logs:
   ```
   🔐 iExec privacy mode enabled - encrypting contribution...
   🔐 Encrypting contribution with iExec DataProtector...
   ✅ Contribution encrypted successfully!
   ```
6. Approve MetaMask transaction
7. Pool created with encrypted contribution!

### Step 6: Verify Encryption

1. Check pool detail page
2. Your contribution amount shows: **`[ENCRYPTED]`**
3. Protected data address visible: `0x...` (the encrypted data NFT)
4. Privacy mode badge: **iExec**

## Error Messages You Might See

### "iExec DataProtector requires Bellecour network (chain ID 134)"

**Cause:** Your wallet is connected to the wrong network (e.g., Sepolia, Mainnet)

**Fix:**
1. Open your wallet
2. Switch to Bellecour network (chain ID 134)
3. Try creating the pool again

### "Failed to encrypt contribution: Missing required configuration for chainId X"

**Cause:** Wallet is on wrong network when DataProtector initializes

**Fix:** Same as above - switch to Bellecour network in your wallet

### "No Ethereum provider found. Please connect your wallet."

**Cause:** Wallet not connected

**Fix:** Click "Connect Wallet" button and connect via MetaMask or WalletConnect

## Network Architecture

### Networks Available in SecSanta

1. **Mock Mode**
   - No blockchain
   - LocalStorage/Upstash for data
   - For UI testing only

2. **Sepolia** (Chain ID 11155111)
   - Ethereum testnet
   - For regular smart contracts (future)
   - NO iExec support

3. **Bellecour** (Chain ID 134) ← **Required for iExec!**
   - iExec Sidechain
   - For iExec DataProtector encryption
   - Native token: xRLC
   - Testnet/development network

4. **Mainnet** (Chain ID 1)
   - Ethereum mainnet
   - For production (future)
   - NO iExec support yet

### Privacy Modes

- **None**: Public contribution amounts (works on any network)
- **iExec (TEE)**: Encrypted with iExec DataProtector (**Bellecour only**)
- **Zama (FHE)**: Fully Homomorphic Encryption (coming soon - will work on Sepolia)

## Technical Details

### Bellecour Network Specs

```typescript
{
  id: 134,
  name: 'iExec Sidechain',
  nativeCurrency: {
    decimals: 18,
    name: 'xRLC',
    symbol: 'xRLC',
  },
  rpcUrls: {
    default: {
      http: ['https://bellecour.iex.ec'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-bellecour.iex.ec',
    },
  },
  testnet: true,
}
```

### Network Verification Code

When you try to encrypt a contribution, the app checks:

```typescript
async function checkBellecourNetwork(provider: any): Promise<void> {
  const chainId = await provider.request({ method: 'eth_chainId' });
  const chainIdNum = parseInt(chainId, 16);

  if (chainIdNum !== 134) {
    throw new Error(
      `iExec DataProtector requires Bellecour network (chain ID 134). ` +
      `You are currently on chain ID ${chainIdNum}. ` +
      `Please switch to Bellecour network in your wallet.`
    );
  }
}
```

## What Works Now

✅ Bellecour network added to wagmi config
✅ Bellecour network selectable in settings
✅ Network verification before encryption
✅ Clear error messages if on wrong network
✅ iExec DataProtector will initialize on Bellecour
✅ Encryption should work when on Bellecour + wallet connected

## What Still Needs Testing

⏳ Actually encrypt a contribution on Bellecour with real wallet
⏳ Verify encrypted data is stored correctly
⏳ Test with multiple contributors
⏳ Confirm protected data NFTs are minted on-chain
⏳ Grant access to iApp (when iApp is deployed)

## Known Limitations

1. **No Smart Contracts Yet**
   - Pool data still stored in Upstash
   - Not on-chain yet
   - Future: Deploy smart contracts to Bellecour

2. **No iApp for TEE Computation**
   - Individual amounts encrypted ✅
   - Total not computed via TEE yet ⏳
   - Need to create and deploy iApp

3. **Bellecour is Testnet**
   - xRLC has no real value
   - For development/testing only
   - Production version would use different setup

## Files Modified

1. `lib/wagmi.ts` - Added Bellecour chain definition
2. `lib/network-config.ts` - Added 'bellecour' network mode
3. `lib/privacy-config.ts` - Updated iExec to require Bellecour
4. `lib/iexec-dataprotector.ts` - Added network verification
5. `BELLECOUR_NETWORK.md` - This documentation

## Next Steps

1. **Test with Real Wallet on Bellecour**
   - Get xRLC from faucet
   - Try creating a pool with iExec privacy
   - Verify encryption works
   - Check protected data on Blockscout

2. **Deploy Smart Contracts to Bellecour**
   - Create SecretPool contract
   - Deploy to Bellecour network
   - Integrate with frontend

3. **Create iApp for TEE Computation**
   - Use iApp Generator
   - Implement pool total computation
   - Deploy to iExec infrastructure
   - Test confidential computation

4. **Full E2E Testing**
   - Multiple contributors on Bellecour
   - All contributions encrypted
   - TEE computes total
   - Total revealed to recipient only

## Summary

iExec DataProtector **requires Bellecour network (chain ID 134)**. The app now:
- Includes Bellecour in supported networks
- Lets you select Bellecour in settings
- Verifies you're on Bellecour before encryption
- Provides clear error messages if you're on wrong network

**To use iExec encryption:**
1. Add Bellecour to your wallet
2. Get xRLC from faucet
3. Select Bellecour network in SecSanta
4. Select iExec privacy mode
5. Create a pool - it will encrypt your contribution!

**Live URL:** https://secsanta-koxvwed6b-batikanors-projects.vercel.app

The encryption is ready to test on Bellecour! 🚀🔐
