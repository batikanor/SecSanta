'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Gift,
  Clock,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { ENSDisplay } from '@/components/ENSDisplay';
import { Pool } from '@/types/pool';
import { PoolService } from '@/lib/pool-service';
import { formatDate, truncateAddress } from '@/lib/utils';
import { getArbiscanTxLink, getArbiscanAddressLink } from '@/lib/contract-service';

export default function PoolDetailPage() {
  const params = useParams();
  const poolId = params.id as string;
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [contribution, setContribution] = useState('');
  const [giftSuggestion, setGiftSuggestion] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    async function loadPool() {
      try {
        setLoading(true);
        const poolData = await PoolService.getPool(poolId);
        if (poolData) {
          setPool(poolData);
        } else {
          setError('Pool not found');
        }
      } catch (err) {
        setError('Failed to load pool');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && poolId) {
      loadPool();
    }
  }, [isConnected, poolId]);

  const handleJoinPool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address || !pool) return;

    if (parseFloat(contribution) <= 0) {
      setError('Contribution must be greater than 0');
      return;
    }

    try {
      setContributing(true);
      const result = await PoolService.joinPool(
        { poolId, contribution, giftSuggestion: giftSuggestion || 'No suggestion' },
        address
      );

      if (result.success) {
        // Reload pool data
        const updatedPool = await PoolService.getPool(poolId);
        if (updatedPool) {
          setPool(updatedPool);
          setContribution('');
          setGiftSuggestion('');
        }
      } else {
        setError(result.error || 'Failed to join pool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setContributing(false);
    }
  };

  const handleFinalizePool = async () => {
    if (!address || !pool) return;

    if (pool.creatorAddress.toLowerCase() !== address.toLowerCase()) {
      setError('Only the pool creator can finalize');
      return;
    }

    try {
      setFinalizing(true);
      setError('');

      const result = await PoolService.finalizePool(poolId, address);

      if (result.success) {
        // Reload pool data to show finalization
        const updatedPool = await PoolService.getPool(poolId);
        if (updatedPool) {
          setPool(updatedPool);
        }
      } else {
        setError(result.error || 'Failed to finalize pool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFinalizing(false);
    }
  };

  const copyPoolLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasUserContributed = pool?.contributors.some(
    (c) => c.address.toLowerCase() === address?.toLowerCase()
  );

  const isCreator = pool?.creatorAddress.toLowerCase() === address?.toLowerCase();

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-600 mb-4">{error || 'Pool not found'}</p>
          <Link href="/dashboard" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Pool Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{pool.name}</h1>
              <p className="text-gray-500">Created {formatDate(pool.createdAt)}</p>
            </div>
            {pool.status === 'ongoing' ? (
              <span className="badge-warning flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Ongoing
              </span>
            ) : pool.status === 'ready_to_finalize' ? (
              <span className="badge-warning flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                <Clock className="w-4 h-4" />
                Ready to Finalize
              </span>
            ) : (
              <span className="badge-success flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Finalized
              </span>
            )}
          </div>

          {/* Pool Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recipient</h3>
              <ENSDisplay address={pool.recipientAddress} showFullAddress={false} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Progress</h3>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold">
                  {pool.contributors.length} / {pool.finalizationThreshold}
                </span>
                <span className="text-gray-600">contributors</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((pool.contributors.length / pool.finalizationThreshold) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {pool.status === 'finalized' && pool.totalAmount && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary-600" />
                  <span className="text-2xl font-bold text-secondary-600">
                    {pool.totalAmount} ETH
                  </span>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Gift Suggestions ({pool.giftSuggestions?.length || 0})
              </h3>
              {pool.giftSuggestions && pool.giftSuggestions.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {pool.giftSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span className="text-gray-800">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Suggestions are anonymous - no one knows who suggested what!
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">No suggestions yet</p>
              )}
            </div>
          </div>

          {/* Share Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Share this pool</h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyPoolLink}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Blockchain Verification Section */}
          {pool.onChain && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Blockchain Verified (Arbitrum Sepolia)
              </h3>

              <div className="space-y-3">
                {/* Contract Address */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">Smart Contract</p>
                  <a
                    href={getArbiscanAddressLink(process.env.NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-mono flex items-center gap-2"
                  >
                    {truncateAddress(process.env.NEXT_PUBLIC_SECSANTA_CONTRACT_ADDRESS || '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Pool Creation Transaction */}
                {pool.creationTxHash && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-green-900 mb-1">Pool Creation Transaction</p>
                    <a
                      href={getArbiscanTxLink(pool.creationTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm font-mono flex items-center gap-2 break-all"
                    >
                      {pool.creationTxHash.slice(0, 20)}...{pool.creationTxHash.slice(-18)}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {pool.blockNumber && (
                      <p className="text-xs text-green-700 mt-1">Block #{pool.blockNumber}</p>
                    )}
                  </div>
                )}

                {/* Privacy Mode Badge */}
                {pool.privacyMode === 'iexec' && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-purple-900 mb-1 flex items-center gap-1">
                      🔐 iExec DataProtector Privacy
                    </p>
                    <p className="text-xs text-purple-700">
                      Contributions encrypted with AES-256 and stored as NFTs on-chain
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Join Pool Form */}
        {pool.status === 'ongoing' && !hasUserContributed && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Join this Pool</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleJoinPool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Contribution (ETH)
                </label>
                <input
                  type="number"
                  required
                  step="0.001"
                  min="0.001"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  placeholder="0.1"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors"
                />
                <p className="mt-2 text-sm text-gray-500">
                  🔒 Your contribution will be <strong>encrypted</strong> and <strong>never</strong> revealed publicly - even after finalization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Suggestion (Optional)
                </label>
                <textarea
                  value={giftSuggestion}
                  onChange={(e) => setGiftSuggestion(e.target.value)}
                  placeholder="What do you think would be a good gift?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2 transition-colors resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Your suggestion will be anonymous - no one will know it&apos;s from you
                </p>
              </div>

              <button type="submit" disabled={contributing} className="w-full btn-primary">
                {contributing ? 'Joining Pool...' : 'Join Pool'}
              </button>
            </form>
          </div>
        )}

        {hasUserContributed && pool.status === 'ongoing' && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <p className="text-blue-900 font-medium">
              ✓ You&apos;ve already contributed to this pool!
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Waiting for {pool.finalizationThreshold - pool.contributors.length} more{' '}
              {pool.finalizationThreshold - pool.contributors.length === 1
                ? 'contributor'
                : 'contributors'}{' '}
              to finalize the pool.
            </p>
          </div>
        )}

        {/* Finalize Pool Button - Only for creator when threshold is met but not finalized on-chain */}
        {isCreator && (pool.status === 'ready_to_finalize' || (pool.status === 'finalized' && !pool.finalizationTxHash)) && pool.onChain && (
          <div className="card mb-6 bg-yellow-50 border-yellow-300">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              🎁 Ready to Finalize!
            </h3>
            <p className="text-yellow-800 mb-4">
              The pool has reached its threshold ({pool.contributors.length}/{pool.finalizationThreshold} contributors).
              Click below to transfer the pooled funds to the recipient on the blockchain.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleFinalizePool}
              disabled={finalizing}
              className="w-full btn-primary bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400"
            >
              {finalizing ? 'Finalizing Pool & Transferring Funds...' : '🎁 Finalize Pool & Transfer Funds'}
            </button>

            <p className="text-xs text-yellow-700 mt-3">
              ⚠️ This will trigger a blockchain transaction that transfers all pooled funds to the recipient.
              This action cannot be undone.
            </p>
          </div>
        )}

        {/* Contributors List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Contributors ({pool.contributors.length})
          </h2>

          <div className="space-y-3">
            {pool.contributors.map((contributor, index) => (
              <div
                key={`${contributor.address}-${index}`}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <ENSDisplay address={contributor.address} />
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDate(contributor.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 italic">
                    🔒 Amount encrypted
                  </div>
                </div>

                {/* Blockchain Proofs for this Contribution */}
                {(contributor.contributionTxHash || contributor.protectedDataAddress) && (
                  <div className="ml-13 space-y-2 mt-2">
                    {contributor.contributionTxHash && (
                      <div className="bg-white p-2 rounded border border-green-200">
                        <p className="text-xs font-medium text-green-900 mb-1">Blockchain Transaction</p>
                        <a
                          href={getArbiscanTxLink(contributor.contributionTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-xs font-mono flex items-center gap-1 break-all"
                        >
                          {contributor.contributionTxHash.slice(0, 16)}...{contributor.contributionTxHash.slice(-14)}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    {contributor.protectedDataAddress && (
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <p className="text-xs font-medium text-purple-900 mb-1">iExec Protected Data NFT</p>
                        <a
                          href={getArbiscanAddressLink(contributor.protectedDataAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-xs font-mono flex items-center gap-1 break-all"
                        >
                          {contributor.protectedDataAddress.slice(0, 16)}...{contributor.protectedDataAddress.slice(-14)}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {(pool.status === 'finalized' || pool.status === 'ready_to_finalize') && (
          <div className="mt-6 p-6 bg-secondary-50 border border-secondary-200 rounded-lg">
            {pool.finalizationTxHash ? (
              <>
                {/* Funds Actually Transferred */}
                <h3 className="font-bold text-secondary-900 text-lg mb-2">
                  🎉 Pool Finalized!
                </h3>
                <p className="text-secondary-800 mb-3">
                  {pool.totalAmount && (
                    <>
                      The total amount of <span className="font-bold">{pool.totalAmount} ETH</span> has
                      been transferred to <ENSDisplay address={pool.recipientAddress} className="font-bold" />.
                    </>
                  )}
                  {!pool.totalAmount && pool.privacyMode === 'iexec' && (
                    <>
                      Funds have been transferred to <ENSDisplay address={pool.recipientAddress} className="font-bold" />.
                      Individual amounts remain encrypted.
                    </>
                  )}
                </p>

                {/* Transaction Proof */}
                <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Blockchain Transaction Proof - Funds Transferred
                  </p>
                  <a
                    href={getArbiscanTxLink(pool.finalizationTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm break-all flex items-center gap-2"
                  >
                    {pool.finalizationTxHash}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-green-700 mt-2">
                    ✅ Verified on Arbitrum Sepolia blockchain
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Threshold Met But Funds Not Transferred Yet */}
                <h3 className="font-bold text-yellow-900 text-lg mb-2">
                  ⏳ Threshold Reached - Awaiting Finalization
                </h3>
                <p className="text-yellow-800 mb-3">
                  This pool has reached its contribution threshold ({pool.contributors.length}/{pool.finalizationThreshold} contributors),
                  but funds have <strong>not yet been transferred</strong> to the recipient.
                </p>
                {isCreator ? (
                  <p className="text-yellow-900 font-medium">
                    👆 See the &quot;Finalize Pool&quot; button above to transfer the funds on-chain.
                  </p>
                ) : (
                  <p className="text-yellow-800">
                    Waiting for the pool creator to finalize and transfer the funds.
                  </p>
                )}
              </>
            )}

            <div className="bg-white/50 border border-secondary-300 rounded-lg p-4 mt-4">
              <p className="text-sm text-secondary-800 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <strong>Privacy Preserved:</strong> Individual contribution amounts remain encrypted.
                {pool.privacyMode === 'iexec' && (
                  <> Only the total was computed in a Trusted Execution Environment (TEE).</>
                )}
                {pool.privacyMode === 'zama' && (
                  <> Only the total is revealed using homomorphic encryption (FHE).</>
                )}
              </p>
            </div>
            {pool.finalizedAt && (
              <p className="text-sm text-secondary-700 mt-3">
                {pool.finalizationTxHash ? 'Finalized' : 'Threshold reached'} on {formatDate(pool.finalizedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
