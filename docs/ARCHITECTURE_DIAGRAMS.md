# SecSanta Architecture Diagrams

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js 14"
        UI[User Interface<br/>fe/app/]
        Wallet[Wallet Connection<br/>RainbowKit + Wagmi<br/>fe/lib/wagmi.ts]
        PoolService[Pool Service Router<br/>fe/lib/pool-service.ts]
    end

    subgraph "Privacy Mode Selection"
        Toggle[Privacy Toggle<br/>fe/lib/privacy-config.ts]
        Toggle -->|iExec Mode| IExecPath[iExec Flow]
        Toggle -->|Zama Mode| ZamaPath[Zama Flow]
    end

    subgraph "iExec Mode - Arbitrum Sepolia"
        DataProtector[iExec DataProtector SDK<br/>Client-side AES-256 Encryption<br/>fe/lib/iexec-dataprotector.ts]
        SecSantaContract[SecSantaPool Contract<br/>0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8<br/>fe/contracts/SecSantaPool.sol]
        IExecNFT[Protected Data NFT<br/>Encrypted contribution storage]
        TEE[TEE Workers<br/>Intel SGX/TDX<br/>Off-chain computation]
    end

    subgraph "Zama Mode - Sepolia"
        ZamaSDK[Zama fhEVM SDK<br/>Homomorphic Encryption<br/>fe/lib/zama-service.ts]
        BCT[BirthdayConfidentialToken<br/>0xCee0c15B42EEb44491F588104bbC46812115dBB0<br/>backend/contracts/BirthdayConfidentialToken.sol]
        PoolContract[ContributionPool Contract<br/>0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0<br/>backend/contracts/ContributionPool.sol]
        KMS[KMS Oracle<br/>Decryption at finalization]
    end

    subgraph "Data Layer"
        Upstash[(Upstash Redis<br/>Pool metadata storage<br/>fe/lib/debug-data.ts)]
        Blockchain1[(Arbitrum Sepolia<br/>Chain ID: 421614)]
        Blockchain2[(Sepolia<br/>Chain ID: 11155111)]
    end

    UI --> Wallet
    Wallet --> PoolService
    PoolService --> Toggle

    IExecPath --> DataProtector
    DataProtector --> IExecNFT
    IExecNFT --> SecSantaContract
    SecSantaContract --> TEE
    SecSantaContract --> Blockchain1

    ZamaPath --> ZamaSDK
    ZamaSDK --> BCT
    BCT --> PoolContract
    PoolContract --> KMS
    PoolContract --> Blockchain2

    PoolService --> Upstash

    click DataProtector "https://tools.docs.iex.ec/tools/dataprotector" "iExec DataProtector Docs"
    click TEE "https://docs.iex.ec/" "iExec Documentation"
    click ZamaSDK "https://docs.zama.ai/fhevm" "Zama fhEVM Docs"
    click KMS "https://docs.zama.ai/fhevm/fundamentals/decryption" "KMS Decryption Docs"

    style DataProtector fill:#e1f5ff
    style ZamaSDK fill:#ffe1f5
    style SecSantaContract fill:#90EE90
    style PoolContract fill:#FFB6C1
```

---

## 2. iExec Mode - Complete Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend<br/>Next.js
    participant DataProtector as iExec DataProtector SDK<br/>fe/lib/iexec-dataprotector.ts
    participant IPFS as IPFS<br/>Encrypted Storage
    participant SecSanta as SecSantaPool Contract<br/>fe/contracts/SecSantaPool.sol<br/>0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8
    participant Blockchain as Arbitrum Sepolia<br/>Chain: 421614
    participant Arbiscan as Arbiscan Explorer<br/>sepolia.arbiscan.io

    Note over User,Arbiscan: POOL CREATION FLOW

    User->>Frontend: Create Pool (ETH amount, recipient)
    Frontend->>Frontend: Check privacy mode = 'iexec'<br/>fe/lib/privacy-config.ts

    rect rgb(225, 245, 255)
        Note over Frontend,IPFS: Step 1: Client-Side Encryption
        Frontend->>DataProtector: protectContribution()<br/>{ poolId, address, amount, timestamp }
        DataProtector->>DataProtector: Generate AES-256 encryption key
        DataProtector->>DataProtector: Encrypt contribution data
        DataProtector->>IPFS: Upload encrypted data
        IPFS-->>DataProtector: IPFS hash
        DataProtector->>Blockchain: Mint Protected Data NFT<br/>(stores IPFS hash + encryption schema)
        Blockchain-->>DataProtector: NFT Address (0x...)
        DataProtector-->>Frontend: { address: "0x...", schema: {...} }
    end

    rect rgb(144, 238, 144)
        Note over Frontend,Blockchain: Step 2: On-Chain Pool Creation
        Frontend->>SecSanta: createPool(poolId, recipient)<br/>+ send ETH value
        SecSanta->>SecSanta: Store pool metadata<br/>mapping(bytes32 => Pool)
        SecSanta->>SecSanta: Record ETH escrow<br/>poolBalances[poolId] += msg.value
        SecSanta->>Blockchain: Emit PoolCreated event
        Blockchain-->>Frontend: Transaction hash
    end

    rect rgb(200, 230, 255)
        Note over Frontend,SecSanta: Step 3: Link Encrypted Data
        Frontend->>SecSanta: addCreatorProtectedData(poolId, nftAddress)
        SecSanta->>SecSanta: protectedDataAddresses[poolId].push(nftAddress)
        SecSanta->>Blockchain: Emit ProtectedDataLinked event
    end

    Frontend->>Frontend: Store pool metadata in Upstash<br/>fe/lib/debug-data.ts
    Frontend-->>User: ✅ Pool created!<br/>Show Arbiscan link

    Note over User,Arbiscan: CONTRIBUTION FLOW

    User->>Frontend: Join Pool (ETH amount)

    rect rgb(225, 245, 255)
        Note over Frontend,IPFS: Step 4: Encrypt Contribution
        Frontend->>DataProtector: protectContribution()<br/>{ poolId, contributorAddress, amount }
        DataProtector->>IPFS: Upload encrypted data
        DataProtector->>Blockchain: Mint Protected Data NFT
        DataProtector-->>Frontend: NFT Address
    end

    rect rgb(144, 238, 144)
        Note over Frontend,SecSanta: Step 5: Contribute On-Chain
        Frontend->>SecSanta: contribute(poolId, nftAddress)<br/>+ send ETH value
        SecSanta->>SecSanta: poolBalances[poolId] += msg.value
        SecSanta->>SecSanta: contributors[poolId].push(msg.sender)
        SecSanta->>SecSanta: protectedDataAddresses[poolId].push(nftAddress)
        SecSanta->>Blockchain: Emit Contribution event
        Blockchain-->>Frontend: Transaction hash
    end

    Frontend->>Frontend: Update pool in Upstash<br/>status = 'ready_to_finalize'
    Frontend-->>User: ✅ Contribution recorded!<br/>Show Arbiscan link

    Note over User,Arbiscan: FINALIZATION FLOW

    User->>Frontend: Finalize Pool (threshold met)
    Frontend->>Frontend: Verify creator permissions<br/>fe/lib/pool-service.ts:378

    rect rgb(255, 200, 150)
        Note over Frontend,SecSanta: Step 6: Transfer Funds
        Frontend->>SecSanta: finalizePool(poolId)
        SecSanta->>SecSanta: require(contributors.length >= threshold)
        SecSanta->>SecSanta: Calculate total: poolBalances[poolId]
        SecSanta->>SecSanta: Transfer ETH to recipient<br/>recipient.transfer(totalAmount)
        SecSanta->>SecSanta: Mark pool as finalized
        SecSanta->>Blockchain: Emit PoolFinalized event
        Blockchain-->>Frontend: Transaction hash
    end

    Frontend->>Frontend: Update pool status = 'finalized'<br/>Store finalization tx hash
    Frontend-->>User: 🎉 Pool finalized!<br/>Funds transferred to recipient<br/>Show Arbiscan proof

    Note over DataProtector,IPFS: 🔒 PRIVACY GUARANTEE:<br/>Individual amounts remain encrypted forever<br/>Only total transferred is public

    rect rgb(255, 230, 230)
        Note over User,Arbiscan: VERIFICATION LINKS
        User->>Arbiscan: View pool creation tx
        User->>Arbiscan: View contribution txs
        User->>Arbiscan: View finalization tx
        User->>Arbiscan: View contract state<br/>0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8
    end

    Note over User,Arbiscan: 📚 Documentation:<br/>DataProtector: https://tools.docs.iex.ec/tools/dataprotector<br/>iExec Docs: https://docs.iex.ec/<br/>Contract: fe/contracts/SecSantaPool.sol<br/>Integration: fe/lib/iexec-dataprotector.ts
```

---

## 3. Zama FHE Mode - Complete Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend<br/>Next.js
    participant ZamaSDK as Zama fhEVM SDK<br/>fe/lib/zama-service.ts
    participant BCT as BirthdayConfidentialToken<br/>backend/contracts/BirthdayConfidentialToken.sol<br/>0xCee0c15B42EEb44491F588104bbC46812115dBB0
    participant Pool as ContributionPool Contract<br/>backend/contracts/ContributionPool.sol<br/>0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0
    participant KMS as KMS Oracle<br/>Zama Gateway
    participant Blockchain as Sepolia Testnet<br/>Chain: 11155111
    participant Etherscan as Sepolia Etherscan<br/>sepolia.etherscan.io

    Note over User,Etherscan: SETUP & MINTING

    User->>Frontend: Connect Wallet (Sepolia)
    Frontend->>ZamaSDK: Initialize fhEVM instance<br/>await createInstance(...)
    ZamaSDK->>KMS: Generate FHE public key
    KMS-->>ZamaSDK: Public key for encryption

    Frontend->>BCT: Mint BCT tokens<br/>mint(amount)
    BCT->>BCT: _mint(msg.sender, amount)<br/>Store as euint64 (encrypted balance)
    BCT->>Blockchain: Update encrypted balances
    Blockchain-->>Frontend: Tokens minted ✅

    Note over User,Etherscan: POOL CREATION FLOW

    User->>Frontend: Create Pool (BCT amount, recipient, threshold)
    Frontend->>Frontend: Check privacy mode = 'zama'<br/>fe/lib/pool-service.ts:89

    rect rgb(255, 225, 245)
        Note over Frontend,ZamaSDK: Step 1: Client-Side FHE Encryption
        Frontend->>ZamaSDK: Encrypt contribution amount<br/>instance.encrypt64(amount)
        ZamaSDK->>ZamaSDK: Convert to euint64<br/>Using FHE public key
        ZamaSDK-->>Frontend: Encrypted amount (euint64)
    end

    rect rgb(255, 182, 193)
        Note over Frontend,Pool: Step 2: Approve Token Operator
        Frontend->>BCT: approveOperator(poolAddress, encryptedAmount)
        BCT->>BCT: _approve(owner, spender, encryptedAmount)
        BCT->>BCT: Store encrypted allowance<br/>allowances[owner][spender] = euint64
        BCT->>Blockchain: Emit Approval event
    end

    rect rgb(255, 200, 220)
        Note over Frontend,Pool: Step 3: Create Pool On-Chain
        Frontend->>Pool: createPool(name, recipient, minContributors, encryptedAmount)
        Pool->>Pool: poolCounter++<br/>poolId = poolCounter
        Pool->>Pool: Store pool metadata<br/>pools[poolId] = Pool{...}
        Pool->>Pool: Add creator as contributor<br/>contributions[poolId][creator] = euint64
        Pool->>Pool: encryptedTotal[poolId] = encryptedAmount
        Pool->>BCT: transferFrom(creator, this, encryptedAmount)<br/>🔒 FHE transfer operation
        BCT->>BCT: _transfer with encrypted amounts<br/>TFHE.sub(balance[from], amount)<br/>TFHE.add(balance[to], amount)
        BCT->>Blockchain: Update encrypted state
        Pool->>Blockchain: Emit PoolCreated event
        Blockchain-->>Frontend: Transaction hash + poolId
    end

    Frontend->>Frontend: Store pool metadata in Upstash<br/>fe/lib/zama-pool-service.ts:56
    Frontend-->>User: ✅ Pool created!<br/>Show Sepolia Etherscan link

    Note over User,Etherscan: CONTRIBUTION FLOW

    User->>Frontend: Join Pool (BCT amount)
    Frontend->>Pool: hasContributed(poolId, address)<br/>Check if already contributed
    Pool-->>Frontend: false ✅

    rect rgb(255, 225, 245)
        Note over Frontend,ZamaSDK: Step 4: Encrypt Contribution
        Frontend->>ZamaSDK: Encrypt contribution<br/>instance.encrypt64(contributionAmount)
        ZamaSDK-->>Frontend: euint64 encrypted value
    end

    rect rgb(255, 182, 193)
        Note over Frontend,BCT: Step 5: Approve Tokens
        Frontend->>BCT: approveOperator(poolAddress, encryptedAmount)
        BCT->>BCT: Store encrypted allowance
    end

    rect rgb(255, 200, 220)
        Note over Frontend,Pool: Step 6: Contribute On-Chain
        Frontend->>Pool: contribute(poolId, encryptedAmount)
        Pool->>Pool: require(!hasContributed[poolId][msg.sender])
        Pool->>Pool: Store contribution<br/>contributions[poolId][contributor] = euint64
        Pool->>Pool: Homomorphic addition:<br/>encryptedTotal = TFHE.add(encryptedTotal, encryptedAmount)
        Pool->>BCT: transferFrom(contributor, this, encryptedAmount)
        BCT->>BCT: 🔒 FHE transfer (amounts stay encrypted)
        Pool->>Pool: contributorCount++
        Pool->>Blockchain: Emit Contribution event
        Blockchain-->>Frontend: Transaction hash
    end

    Frontend->>Frontend: Update pool in Upstash<br/>status = 'ready_to_finalize' (if threshold met)
    Frontend-->>User: ✅ Contribution recorded!<br/>Show Etherscan link

    Note over User,Etherscan: FINALIZATION & DECRYPTION FLOW

    User->>Frontend: Finalize Pool
    Frontend->>Frontend: Verify creator permissions<br/>fe/lib/zama-pool-service.ts:170

    rect rgb(255, 220, 180)
        Note over Frontend,KMS: Step 7: Request Decryption
        Frontend->>Pool: finalizePool(poolId)
        Pool->>Pool: require(contributorCount >= minContributors)
        Pool->>Pool: Mark as finalized: isFinalized[poolId] = true
        Pool->>KMS: Request decryption callback<br/>TFHE.allowTransient(encryptedTotal, Gateway)
        Pool->>Blockchain: Emit DecryptionRequested event
        Blockchain-->>Frontend: Transaction hash
    end

    Note over KMS: ⏳ KMS processes decryption<br/>(async callback, ~30-60 seconds)

    rect rgb(200, 255, 200)
        Note over KMS,Pool: Step 8: KMS Callback
        KMS->>KMS: Decrypt euint64 in TEE<br/>Access encrypted total securely
        KMS->>Pool: decryptionCallback(requestId, plainTotal)
        Pool->>Pool: Store decrypted value<br/>totalPlain[poolId] = plainTotal
        Pool->>BCT: transfer(recipient, plainTotal)<br/>Now using plaintext amount
        BCT->>BCT: Standard ERC20 transfer<br/>balance[pool] -= plainTotal<br/>balance[recipient] += plainTotal
        Pool->>Blockchain: Emit PoolFinalized event
    end

    Frontend->>Pool: Poll for totalPlain[poolId]<br/>fe/lib/zama-pool-service.ts:259
    Pool-->>Frontend: Decrypted total amount

    Frontend->>Frontend: Update pool in Upstash<br/>totalAmount = decrypted value<br/>status = 'finalized'
    Frontend-->>User: 🎉 Pool finalized!<br/>Total: X BCT transferred<br/>Show Etherscan proof

    Note over Pool,BCT: 🔒 PRIVACY GUARANTEE:<br/>Individual contributions remain encrypted (euint64)<br/>Only sum was decrypted via KMS<br/>contributions[poolId][address] = still encrypted!

    rect rgb(255, 230, 230)
        Note over User,Etherscan: VERIFICATION LINKS
        User->>Etherscan: View pool creation tx
        User->>Etherscan: View contribution txs
        User->>Etherscan: View finalization tx
        User->>Etherscan: View BCT contract<br/>0xCee0c15B42EEb44491F588104bbC46812115dBB0
        User->>Etherscan: View Pool contract<br/>0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0
    end

    Note over User,Etherscan: 📚 Documentation:<br/>Zama fhEVM: https://docs.zama.ai/fhevm<br/>KMS Decryption: https://docs.zama.ai/fhevm/fundamentals/decryption<br/>Token Contract: backend/contracts/BirthdayConfidentialToken.sol<br/>Pool Contract: backend/contracts/ContributionPool.sol<br/>Integration: fe/lib/zama-service.ts<br/>Deployment: fe/contracts/zama-deployment.json
```

---

## Key Differences: iExec vs Zama

| Aspect | iExec Mode | Zama Mode |
|--------|-----------|-----------|
| **Network** | Arbitrum Sepolia (421614) | Sepolia (11155111) |
| **Currency** | ETH | BCT (Confidential ERC20) |
| **Encryption** | Client-side AES-256 | On-chain FHE (euint64) |
| **Storage** | IPFS + NFT | On-chain encrypted state |
| **Computation** | Off-chain TEE workers | On-chain homomorphic operations |
| **Decryption** | Never (stays encrypted) | KMS oracle at finalization |
| **Total Reveal** | Implicit (ETH balance) | Explicit (KMS callback) |
| **Privacy Level** | 🔒🔒🔒 Forever encrypted | 🔒🔒 Encrypted until finalized |

## Contract Addresses

### iExec Mode
- **SecSantaPool**: `0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8`
- **Network**: Arbitrum Sepolia
- **Explorer**: https://sepolia.arbiscan.io/address/0xEC5Db14bFE52cF395a8778D32c25E59a2bD364B8

### Zama Mode
- **BirthdayConfidentialToken**: `0xCee0c15B42EEb44491F588104bbC46812115dBB0`
- **ContributionPool**: `0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0`
- **Network**: Sepolia
- **Explorer BCT**: https://sepolia.etherscan.io/address/0xCee0c15B42EEb44491F588104bbC46812115dBB0
- **Explorer Pool**: https://sepolia.etherscan.io/address/0xE45d459Fc44c2B5326Bcef9F10028Bc252Bc2fd0

## Code References

### Frontend Files
- `fe/lib/pool-service.ts` - Main orchestration, routes between iExec/Zama
- `fe/lib/iexec-dataprotector.ts` - iExec DataProtector integration
- `fe/lib/contract-service.ts` - SecSantaPool interactions
- `fe/lib/zama-service.ts` - Zama fhEVM SDK integration
- `fe/lib/zama-pool-service.ts` - Zama pool management
- `fe/lib/privacy-config.ts` - Privacy mode toggle
- `fe/lib/network-config.ts` - Network switching logic

### Smart Contracts
- `fe/contracts/SecSantaPool.sol` - iExec mode escrow contract
- `backend/contracts/BirthdayConfidentialToken.sol` - Zama confidential token
- `backend/contracts/ContributionPool.sol` - Zama FHE pool contract
- `fe/contracts/zama-deployment.json` - Zama contract addresses

### Documentation
- iExec DataProtector: https://tools.docs.iex.ec/tools/dataprotector
- iExec Main Docs: https://docs.iex.ec/
- Zama fhEVM: https://docs.zama.ai/fhevm
- Zama Decryption: https://docs.zama.ai/fhevm/fundamentals/decryption

---

**Generated for SecSanta - ETHRome 2025**
