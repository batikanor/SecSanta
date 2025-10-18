/**
 * Deployment Script for SecSantaPool Smart Contract
 *
 * Deploys to Arbitrum Sepolia Testnet (Chain ID: 421614)
 *
 * Requirements:
 * - Node.js with ethers.js installed
 * - Private key with Arbitrum Sepolia ETH for gas
 * - solc (Solidity compiler) to compile the contract
 *
 * Usage:
 *   1. Compile contract: npm run compile-contract
 *   2. Deploy: node contracts/deploy.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Network configuration
const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';
const CHAIN_ID = 421614;

async function main() {
  console.log('🚀 Deploying SecSantaPool to Arbitrum Sepolia...\n');

  // Read private key from environment
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not set in environment');
    console.log('   Set it with: export DEPLOYER_PRIVATE_KEY=your_private_key');
    process.exit(1);
  }

  // Connect to Arbitrum Sepolia
  const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📝 Deployment Configuration:');
  console.log(`   Network: Arbitrum Sepolia`);
  console.log(`   Chain ID: ${CHAIN_ID}`);
  console.log(`   RPC: ${ARBITRUM_SEPOLIA_RPC}`);
  console.log(`   Deployer: ${wallet.address}\n`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('❌ Error: Deployer has no ETH for gas fees');
    console.log('   Get testnet ETH from: https://faucets.chain.link/arbitrum-sepolia');
    process.exit(1);
  }

  // Read compiled contract
  const contractPath = path.join(__dirname, 'SecSantaPool.sol');
  if (!fs.existsSync(contractPath)) {
    console.error('❌ Error: Contract file not found');
    console.log(`   Expected at: ${contractPath}`);
    process.exit(1);
  }

  console.log('\n📄 Contract source found');
  console.log('   File: SecSantaPool.sol');

  // Read ABI and bytecode (you'll need to compile first)
  const artifactPath = path.join(__dirname, 'SecSantaPool.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('\n❌ Error: Compiled contract artifact not found');
    console.log('   Please compile the contract first:');
    console.log('   1. Install solc: npm install -g solc');
    console.log('   2. Compile: solcjs --abi --bin contracts/SecSantaPool.sol -o contracts/');
    console.log('   3. Create JSON artifact with abi and bytecode');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const { abi, bytecode } = artifact;

  console.log('\n🔧 Deploying contract...');

  // Deploy contract
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log('⏳ Waiting for deployment transaction...');
  console.log(`   Transaction hash: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('\n✅ Contract deployed successfully!');
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Explorer: https://sepolia.arbiscan.io/address/${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: 'arbitrum-sepolia',
    chainId: CHAIN_ID,
    contractAddress: contractAddress,
    deploymentTx: contract.deploymentTransaction().hash,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, 'deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log('\n📝 Deployment info saved to deployment.json');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Update .env.local with:');
  console.log(`      NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('   2. Verify contract on Arbiscan (optional)');
  console.log('   3. Test creating a pool with iExec privacy mode');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
