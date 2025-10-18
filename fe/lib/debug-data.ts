/**
 * DEBUG MODE DATA
 * This file contains mock data for development
 * Debug mode can be toggled via UI (stored in localStorage) or env var
 *
 * Uses localStorage to persist data across browser windows/tabs
 */

import { Pool } from '@/types/pool';

const BLOCKCHAIN_MODE_KEY = 'secsanta-blockchain-mode'; // 'mock' or 'real'

/**
 * Check if blockchain mock mode is enabled
 * Priority: localStorage > env var
 */
export function isBlockchainMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(BLOCKCHAIN_MODE_KEY);
    if (stored !== null) {
      return stored === 'mock';
    }
  }
  // Default to mock if env var says debug mode
  return process.env.NEXT_PUBLIC_FE_DEBUG_MODE === 'true';
}

// For backwards compatibility
export const DEBUG_MODE = isBlockchainMockMode();

const STORAGE_KEY = 'secsanta_debug_pools';
const COUNTER_KEY = 'secsanta_pool_counter';

// Mock wallet addresses
export const MOCK_ADDRESSES = {
  user1: '0x1234567890123456789012345678901234567890',
  user2: '0x2345678901234567890123456789012345678901',
  user3: '0x3456789012345678901234567890123456789012',
  recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
};

// Mock ENS names
export const MOCK_ENS_NAMES: Record<string, string> = {
  [MOCK_ADDRESSES.user1]: 'alice.eth',
  [MOCK_ADDRESSES.user2]: 'bob.eth',
  [MOCK_ADDRESSES.user3]: 'charlie.eth',
  [MOCK_ADDRESSES.recipient]: 'vitalik.eth',
};

// LocalStorage helpers
function getPoolsFromStorage(): Pool[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePoolsToStorage(pools: Pool[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
  } catch (error) {
    console.error('Failed to save pools to localStorage:', error);
  }
}

function getCounterFromStorage(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    return stored ? parseInt(stored, 10) : 1;
  } catch {
    return 1;
  }
}

function saveCounterToStorage(counter: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COUNTER_KEY, counter.toString());
  } catch (error) {
    console.error('Failed to save counter to localStorage:', error);
  }
}

export async function generateMockPoolId(): Promise<string> {
  // Try sync server first
  const { syncGeneratePoolId } = await import('./sync-client');
  const syncId = await syncGeneratePoolId();
  if (syncId) return syncId;

  // Fallback to localStorage
  const counter = getCounterFromStorage();
  const poolId = `pool-${counter}`;
  saveCounterToStorage(counter + 1);
  return poolId;
}

export async function getMockPools(): Promise<Pool[]> {
  // Try sync server first
  const { syncGetPools } = await import('./sync-client');
  const syncPools = await syncGetPools();
  if (syncPools.length > 0) return syncPools;

  // Fallback to localStorage
  return getPoolsFromStorage();
}

export async function addMockPool(pool: Pool): Promise<void> {
  // Try sync server first
  const { syncAddPool } = await import('./sync-client');
  const synced = await syncAddPool(pool);

  // Always save to localStorage as backup
  const pools = getPoolsFromStorage();
  pools.push(pool);
  savePoolsToStorage(pools);
}

export async function updateMockPool(poolId: string, updates: Partial<Pool>): Promise<void> {
  // Try sync server first
  const { syncUpdatePool } = await import('./sync-client');
  await syncUpdatePool(poolId, updates);

  // Always update localStorage as backup
  const pools = getPoolsFromStorage();
  const index = pools.findIndex(p => p.id === poolId);
  if (index !== -1) {
    pools[index] = { ...pools[index], ...updates };
    savePoolsToStorage(pools);
  }
}

export async function getMockPool(poolId: string): Promise<Pool | undefined> {
  const pools = await getMockPools();
  return pools.find(p => p.id === poolId);
}

// Clear all debug data (useful for testing)
export async function clearMockData(): Promise<void> {
  // Clear sync server
  const { syncClearData } = await import('./sync-client');
  await syncClearData();

  // Clear localStorage
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COUNTER_KEY);
  } catch (error) {
    console.error('Failed to clear mock data:', error);
  }
}

// Simulate ENS resolution
export function mockResolveEnsName(address: string): string | undefined {
  return MOCK_ENS_NAMES[address.toLowerCase()];
}

export function mockResolveEnsAddress(ensName: string): string | undefined {
  const entry = Object.entries(MOCK_ENS_NAMES).find(([_, name]) => name === ensName);
  return entry ? entry[0] : undefined;
}

// Simulate transaction delay
export function simulateTransactionDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 2000));
}
