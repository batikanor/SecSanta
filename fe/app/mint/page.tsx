'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getNetworkMode } from '@/lib/network-config';
import zamaDeployment from '@/contracts/zama-deployment.json';

// Dynamic import for Zama SDK
let initSDK: any;
let createInstance: any;
let FhevmInstance: any;

if (typeof window !== 'undefined') {
  const zamaSDK = require('@zama-fhe/relayer-sdk/web');
  initSDK = zamaSDK.initSDK;
  createInstance = zamaSDK.createInstance;
  FhevmInstance = zamaSDK.FhevmInstance;
}

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('5');
  const [minting, setMinting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [isZamaMode, setIsZamaMode] = useState(false);

  // Check network mode and listen for changes
  useEffect(() => {
    const checkMode = () => {
      setIsZamaMode(getNetworkMode() === 'sepolia-zama');
    };
    
    checkMode();
    
    // Listen for storage changes (when debug panel updates network mode)
    window.addEventListener('storage', checkMode);
    
    // Also poll every second as a fallback (storage events don't fire in same tab)
    const interval = setInterval(checkMode, 1000);
    
    return () => {
      window.removeEventListener('storage', checkMode);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isConnected && address && isZamaMode) {
      loadBalance();
    }
  }, [isConnected, address, isZamaMode]);

  const loadBalance = async () => {
    if (!address || typeof window === 'undefined') return;
    
    setLoadingBalance(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const tokenContract = new ethers.Contract(
        zamaDeployment.token.address,
        [
          'function confidentialBalanceOf(address) view returns (bytes32)',
        ],
        signer
      );

      // Note: The balance is encrypted, so we can only get the handle
      // Actual balance viewing requires decryption which is complex
      setBalance('Encrypted (view on-chain)');
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance('Error loading');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleMint = async () => {
    if (!address || !amount || typeof window === 'undefined') return;

    setMinting(true);
    setTxHash('');

    try {
      console.log('🎁 Minting BCT tokens...', { amount, address });

      // Initialize Zama SDK
      console.log('🔄 Initializing Zama SDK...');
      await initSDK();
      console.log('✅ Zama SDK initialized');

      // Create FHEVM instance
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const config = {
        relayerUrl: 'https://zama.sepolia.relayer.gateway.zama.ai/v1/relayer',
        chainId: 11155111,
        gatewayChainId: 11155111,
        tfheExecutorContractAddress: '0x6A32e94EFfA1ab8c4CEf86Df0BBcD7e55D3Cf8c6',
        kmsSignerContractAddress: '0xFD3b5F0e674Afe5fF47609C2dC86F9c785BB2fAe',
        kmsVerifierContractAddress: '0x9c2E18C3C86A0207b6C2C11C5E38B900d2bc8eE5',
      };

      console.log('🔧 Creating FHEVM instance...');
      const instance = await createInstance(config);
      console.log('✅ FHEVM instance created');

      // Encrypt the mint amount
      const amountWei = ethers.parseEther(amount).toString();
      console.log('🔐 Encrypting amount:', { original: amount, wei: amountWei });

      const input = instance.createEncryptedInput(zamaDeployment.token.address, address);
      input.add64(BigInt(amountWei));
      const encryptedInput = await input.encrypt();

      console.log('✅ Encrypted input created');

      // Get the token contract
      const tokenContract = new ethers.Contract(
        zamaDeployment.token.address,
        [
          'function faucet(bytes32 encryptedAmount, bytes calldata inputProof) external',
        ],
        signer
      );

      // Call faucet (mints to msg.sender)
      console.log('📝 Calling faucet on token contract...');
      const tx = await tokenContract.faucet(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      console.log('⏳ Waiting for mint transaction...', tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Tokens minted successfully!', receipt);

      alert(`Successfully received ${amount} BCT from faucet! Transaction: ${tx.hash}`);
      
      // Reload balance
      await loadBalance();
    } catch (error: any) {
      console.error('❌ Failed to mint tokens:', error);
      alert(`Failed to mint tokens: ${error.message || 'Unknown error'}`);
    } finally {
      setMinting(false);
    }
  };

  const handleApprove = async () => {
    if (!address || typeof window === 'undefined') return;

    setApproving(true);
    setTxHash('');

    try {
      console.log('🔑 Approving pool contract...');

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        zamaDeployment.token.address,
        [
          'function setOperator(address operator, uint48 validUntil) external',
        ],
        signer
      );

      // Approve for 30 days
      const validUntil = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);
      
      console.log('📝 Setting operator...', {
        pool: zamaDeployment.pool.address,
        validUntil: new Date(validUntil * 1000).toLocaleString()
      });

      const tx = await tokenContract.setOperator(
        zamaDeployment.pool.address,
        validUntil
      );

      console.log('⏳ Waiting for approval transaction...', tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Pool approved successfully!', receipt);

      alert(`Successfully approved pool contract! Transaction: ${tx.hash}`);
    } catch (error: any) {
      console.error('❌ Failed to approve pool:', error);
      alert(`Failed to approve pool: ${error.message || 'Unknown error'}`);
    } finally {
      setApproving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
              <p className="text-gray-300">Please connect your wallet to mint BCT tokens.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isZamaMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Zama FHE Mode Required</h1>
              <p className="text-gray-300 mb-6">
                This page is only available in Zama FHE mode. Please enable it in the debug panel.
              </p>
              <a
                href="/dashboard"
                className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            🔐 Mint BCT Tokens
          </h1>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Your BCT Balance</h2>
              <div className="bg-white/5 rounded-lg p-4">
                {loadingBalance ? (
                  <p className="text-gray-300">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-cyan-400">{balance} BCT</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Get Tokens from Faucet</h2>
              <p className="text-gray-300 mb-4">
                Get confidential BCT tokens from the faucet. These tokens are required to create and contribute to pools. Anyone can use the faucet (up to 10,000 BCT total).
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Amount (BCT)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="10"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <button
                onClick={handleMint}
                disabled={minting || !amount || parseFloat(amount) <= 0}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {minting ? '⏳ Getting from faucet...' : '💧 Get BCT from Faucet'}
              </button>
            </div>

            <div className="border-t border-white/20 pt-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Approve Pool Contract</h2>
              <p className="text-gray-300 mb-4">
                Approve the pool contract to spend your BCT tokens. This is required before creating or contributing to pools.
              </p>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {approving ? '⏳ Approving...' : '🔑 Approve Pool Contract'}
              </button>
            </div>

            {txHash && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Transaction submitted:</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
                >
                  {txHash}
                </a>
              </div>
            )}
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• You must get tokens from faucet before you can create or contribute to pools</li>
              <li>• Faucet limit: 10,000 BCT total per address</li>
              <li>• You must approve the pool contract before you can transfer tokens</li>
              <li>• Token balances are encrypted and cannot be viewed directly</li>
              <li>• Make sure you&apos;re connected to Sepolia testnet</li>
              <li>• Approval is valid for 30 days</li>
            </ul>
          </div>

          <div className="text-center">
            <a
              href="/pool/create"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Create a Pool →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
