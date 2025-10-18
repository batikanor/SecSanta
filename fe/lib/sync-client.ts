/**
 * Sync Client
 * Uses Next.js API routes for cross-browser syncing
 * Works both locally (with localStorage fallback) and on Vercel (with KV)
 */

import { Pool } from '@/types/pool';

const STORAGE_MODE_KEY = 'secsanta-storage-mode'; // 'local' or 'vercel-kv'

// In development: use localhost:3000/api (Next.js dev server)
// In production: uses same domain /api (Vercel deployment)
const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SYNC_SERVER_URL || 'http://localhost:3000');

/**
 * Check if we should use Vercel KV (via API routes)
 * Priority: localStorage setting > explicit default ('vercel-kv')
 */
function shouldUseVercelKV(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_MODE_KEY);
    if (stored !== null) {
      return stored === 'vercel-kv';
    }
    // Default to 'vercel-kv' if not set (matches DebugPanel default)
    return true;
  }
  // Server-side: check env var, default to true
  return process.env.NEXT_PUBLIC_USE_SYNC_SERVER !== 'false';
}

/**
 * Check if sync server is available
 */
export async function isSyncServerAvailable(): Promise<boolean> {
  if (!shouldUseVercelKV()) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/pools`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all pools from sync server
 */
export async function syncGetPools(): Promise<Pool[]> {
  if (!shouldUseVercelKV()) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/pools`);
    if (!response.ok) throw new Error('Failed to fetch pools');

    const data = await response.json();
    return data.pools || [];
  } catch (error) {
    console.error('Sync server error:', error);
    return [];
  }
}

/**
 * Add pool to sync server
 */
export async function syncAddPool(pool: Pool): Promise<boolean> {
  if (!shouldUseVercelKV()) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/pools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pool),
    });

    return response.ok;
  } catch (error) {
    console.error('Sync server error:', error);
    return false;
  }
}

/**
 * Update pool in sync server
 */
export async function syncUpdatePool(poolId: string, updates: Partial<Pool>): Promise<boolean> {
  if (!shouldUseVercelKV()) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/pools/${poolId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    return response.ok;
  } catch (error) {
    console.error('Sync server error:', error);
    return false;
  }
}

/**
 * Generate pool ID from sync server
 */
export async function syncGeneratePoolId(): Promise<string> {
  if (!shouldUseVercelKV()) return '';

  try {
    const response = await fetch(`${API_BASE_URL}/api/pool-id`);
    if (!response.ok) throw new Error('Failed to generate pool ID');

    const data = await response.json();
    return data.poolId; // Changed from data.id
  } catch (error) {
    console.error('Sync server error:', error);
    return '';
  }
}

/**
 * Clear all data on sync server
 */
export async function syncClearData(): Promise<boolean> {
  if (!shouldUseVercelKV()) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/clear`, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Sync server error:', error);
    return false;
  }
}
