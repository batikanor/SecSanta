'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { ENSInput } from '@/components/ENSInput';
import { CreatePoolFormData } from '@/types/pool';
import { PoolService } from '@/lib/pool-service';
import { isZamaMode } from '@/lib/network-config';

export const dynamic = 'force-dynamic';

export default function CreatePoolPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<CreatePoolFormData>({
    name: '',
    recipientAddress: '',
    selfContribution: '',
    finalizationThreshold: 2,
    giftSuggestion: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    if (!formData.recipientAddress) {
      setError('Please enter a valid recipient address or ENS name');
      return;
    }

    if (parseFloat(formData.selfContribution) <= 0) {
      setError('Contribution must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const result = await PoolService.createPool(formData, address);

      if (result.success && result.poolId) {
        router.push(`/pool/${result.poolId}`);
      } else {
        setError(result.error || 'Failed to create pool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-600">Please connect your wallet to create a pool.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Gift Pool</h1>

          {isZamaMode() && (
            <div className="mb-6 p-4 bg-cyan-50 border border-cyan-300 rounded-lg">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-cyan-900 mb-1">🔐 Zama FHE Mode</p>
                  <p className="text-sm text-cyan-800 mb-2">
                    Before creating a pool, you need to mint confidential tokens and approve the pool contract:
                  </p>
                  <ol className="text-sm text-cyan-800 space-y-1 ml-4 mb-3">
                    <li>1️⃣ Mint confidential BCT tokens</li>
                    <li>2️⃣ Approve the pool contract as operator</li>
                    <li>3️⃣ Then create your encrypted pool!</li>
                  </ol>
                  <Link 
                    href="/mint"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    <Coins className="w-4 h-4" />
                    Go to Mint Page
                  </Link>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pool Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pool Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Alice's Birthday Gift"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors"
              />
            </div>

            {/* Recipient Address */}
            <ENSInput
              label="Recipient Address"
              required
              value={formData.recipientAddress}
              onChange={(value) => setFormData({ ...formData, recipientAddress: value })}
              placeholder="0x... or vitalik.eth"
            />

            {/* Self Contribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Contribution ({isZamaMode() ? 'BCT' : 'BCT'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.001"
                min="0.001"
                value={formData.selfContribution}
                onChange={(e) => setFormData({ ...formData, selfContribution: e.target.value })}
                placeholder="0.1"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors"
              />
              <p className="mt-2 text-sm text-gray-500">
                The amount you&apos;ll contribute to the gift pool
              </p>
            </div>

            {/* Finalization Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Contributors <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="20"
                value={formData.finalizationThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, finalizationThreshold: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors"
              />
              <p className="mt-2 text-sm text-gray-500">
                The pool will finalize when this many people have contributed (including you)
              </p>
            </div>

            {/* Gift Suggestion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gift Suggestion <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.giftSuggestion}
                onChange={(e) => setFormData({ ...formData, giftSuggestion: e.target.value })}
                placeholder="What should this gift pool be used for? (visible on blockchain)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors resize-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                This will be visible to all participants and stored on the blockchain
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Creating Pool...' : 'Create Pool'}
              </button>
              <Link href="/dashboard" className="flex-1 btn-secondary text-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <span>🔒</span> Privacy-First Design
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Encrypted Contributions:</strong> Your amount is encrypted and NEVER revealed publicly</li>
            <li>• <strong>Homomorphic Encryption:</strong> Total is computed without decrypting individual amounts (using Zama FHE)</li>
            <li>• <strong>Anonymous Suggestions:</strong> Gift ideas are shown without attribution</li>
            <li>• <strong>Only Total Revealed:</strong> When finalized, only the sum is shown to the recipient</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
