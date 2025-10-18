/**
 * Sync Client
 * Connects to local sync server for automatic cross-browser syncing
 */

import { Pool } from '@/types/pool';

const SYNC_SERVER_URL = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || 'http://localhost:3001';
const USE_SYNC_SERVER = process.env.NEXT_PUBLIC_USE_SYNC_SERVER === 'true';

/**
 * Check if sync server is available
 */
export async function isSyncServerAvailable(): Promise<boolean> {
  if (!USE_SYNC_SERVER) return false;

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/pools`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all pools from sync server
 */
export async function syncGetPools(): Promise<Pool[]> {
  if (!USE_SYNC_SERVER) return [];

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/pools`);
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
  if (!USE_SYNC_SERVER) return false;

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/pools`, {
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
  if (!USE_SYNC_SERVER) return false;

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/pools/${poolId}`, {
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
  if (!USE_SYNC_SERVER) return '';

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/pool-id`);
    if (!response.ok) throw new Error('Failed to generate pool ID');

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Sync server error:', error);
    return '';
  }
}

/**
 * Clear all data on sync server
 */
export async function syncClearData(): Promise<boolean> {
  if (!USE_SYNC_SERVER) return false;

  try {
    const response = await fetch(`${SYNC_SERVER_URL}/api/clear`, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Sync server error:', error);
    return false;
  }
}
