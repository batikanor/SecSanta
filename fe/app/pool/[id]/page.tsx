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

export default function PoolDetailPage() {
  const params = useParams();
  const poolId = params.id as string;
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
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

  const copyPoolLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasUserContributed = pool?.contributors.some(
    (c) => c.address.toLowerCase() === address?.toLowerCase()
  );

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
                  Your contribution amount will remain hidden until the pool finalizes
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

        {/* Contributors List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Contributors ({pool.contributors.length})
          </h2>

          <div className="space-y-3">
            {pool.contributors.map((contributor, index) => (
              <div
                key={`${contributor.address}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
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

                {pool.status === 'ongoing' && (
                  <div className="text-sm text-gray-500 italic">
                    Amount hidden
                  </div>
                )}

                {pool.status === 'finalized' && (
                  <div className="text-right">
                    <p className="font-semibold text-secondary-600">{contributor.amount} ETH</p>
                    <p className="text-xs text-gray-500">Contributed</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {pool.status === 'finalized' && (
          <div className="mt-6 p-6 bg-secondary-50 border border-secondary-200 rounded-lg">
            <h3 className="font-bold text-secondary-900 text-lg mb-2">
              🎉 Pool Finalized!
            </h3>
            <p className="text-secondary-800">
              The total amount of <span className="font-bold">{pool.totalAmount} ETH</span> has
              been transferred to <ENSDisplay address={pool.recipientAddress} className="font-bold" />.
            </p>
            {pool.finalizedAt && (
              <p className="text-sm text-secondary-700 mt-2">
                Finalized on {formatDate(pool.finalizedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
