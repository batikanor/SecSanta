'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Gift, Users, Lock, Sparkles } from 'lucide-react';
import { DEBUG_MODE } from '@/lib/debug-data';

export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-6 rounded-2xl shadow-xl">
              <Gift className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-600">SecSanta</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create anonymous gift pools with friends. Contribute secretly, gift transparently.
            Powered by Ethereum and ENS.
          </p>

          {DEBUG_MODE && (
            <div className="mb-6 inline-block px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                🔧 DEBUG MODE ACTIVE - Using mock data for development
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                          >
                            Connect Wallet to Start
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Anonymous Contributions</h3>
            <p className="text-gray-600">
              Your contribution amount stays hidden until the pool is finalized.
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-secondary-100 p-3 rounded-full">
                <Users className="w-8 h-8 text-secondary-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Group Gifting</h3>
            <p className="text-gray-600">
              Pool funds with friends to create amazing group gifts.
            </p>
          </div>

          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">ENS Integration</h3>
            <p className="text-gray-600">
              See beautiful ENS names instead of cryptic addresses.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Create a Pool</h4>
                <p className="text-gray-600">
                  Set up a gift pool with recipient, your contribution, and minimum participant threshold.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Invite Friends</h4>
                <p className="text-gray-600">
                  Share the pool with friends. They can join and add their contributions anonymously.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Auto-Finalize</h4>
                <p className="text-gray-600">
                  When the threshold is met, the pool finalizes and funds transfer to the recipient.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
