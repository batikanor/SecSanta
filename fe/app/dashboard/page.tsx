'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Gift, Users, Clock, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { ENSDisplay } from '@/components/ENSDisplay';
import { Pool } from '@/types/pool';
import { PoolService } from '@/lib/pool-service';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'finalized'>('all');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  useEffect(() => {
    async function loadPools() {
      try {
        setLoading(true);
        const allPools = await PoolService.getPools();
        setPools(allPools);
      } catch (error) {
        console.error('Failed to load pools:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isConnected) {
      loadPools();
    }
  }, [isConnected]);

  const filteredPools = pools.filter((pool) => {
    if (filter === 'all') return true;
    return pool.status === filter;
  });

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, <ENSDisplay address={address!} />
          </h1>
          <p className="text-gray-600">
            Manage your gift pools and create new ones
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ongoing'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setFilter('finalized')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'finalized'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Finalized
            </button>
          </div>

          <Link href="/pool/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Pool
          </Link>
        </div>

        {/* Pools Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="card text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No pools yet' : `No ${filter} pools`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Create your first gift pool to get started!'
                : `There are no ${filter} pools at the moment.`}
            </p>
            {filter === 'all' && (
              <Link href="/pool/create" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Your First Pool
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map((pool) => (
              <Link
                key={pool.id}
                href={`/pool/${pool.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                      {pool.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(pool.createdAt)}
                    </p>
                  </div>
                  {pool.status === 'ongoing' ? (
                    <span className="badge-warning flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Ongoing
                    </span>
                  ) : (
                    <span className="badge-success flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Finalized
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Recipient</p>
                    <ENSDisplay address={pool.recipientAddress} />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {pool.contributors.length}/{pool.finalizationThreshold}
                      </span>
                    </div>
                    {pool.status === 'finalized' && pool.totalAmount && (
                      <div className="flex items-center gap-1 text-secondary-600 font-medium">
                        <Gift className="w-4 h-4" />
                        <span>{pool.totalAmount} {pool.privacyMode === 'zama' ? 'BCT' : 'ETH'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Gift Ideas ({pool.giftSuggestions?.length || 0})
                    </p>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {pool.giftSuggestions?.[0] || 'No suggestions yet'}
                      {pool.giftSuggestions && pool.giftSuggestions.length > 1 && ` +${pool.giftSuggestions.length - 1} more`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
