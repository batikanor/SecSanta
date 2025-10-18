/**
 * Demo Sync Utilities
 *
 * Since localStorage is browser-specific, this provides utilities to:
 * 1. Export pool data as shareable JSON
 * 2. Import pool data from another browser
 * 3. Share via URL parameters
 */

import { Pool } from '@/types/pool';

const STORAGE_KEY = 'secsanta_debug_pools';
const COUNTER_KEY = 'secsanta_pool_counter';

/**
 * Export all pools as JSON string
 */
export function exportPools(): string {
  if (typeof window === 'undefined') return '{}';

  const pools = localStorage.getItem(STORAGE_KEY) || '[]';
  const counter = localStorage.getItem(COUNTER_KEY) || '1';

  return JSON.stringify({
    pools: JSON.parse(pools),
    counter: parseInt(counter, 10),
    timestamp: Date.now(),
  }, null, 2);
}

/**
 * Import pools from JSON string
 */
export function importPools(jsonString: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not in browser environment' };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data.pools || !Array.isArray(data.pools)) {
      return { success: false, error: 'Invalid data format' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.pools));
    localStorage.setItem(COUNTER_KEY, (data.counter || 1).toString());

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to parse JSON' };
  }
}

/**
 * Copy pools data to clipboard for easy sharing
 */
export async function copyPoolsToClipboard(): Promise<boolean> {
  try {
    const data = exportPools();
    await navigator.clipboard.writeText(data);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download pools as JSON file
 */
export function downloadPoolsAsFile(): void {
  const data = exportPools();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `secsanta-pools-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get shareable URL with pool data
 */
export function getShareableUrl(poolId: string): string {
  if (typeof window === 'undefined') return '';

  const pools = localStorage.getItem(STORAGE_KEY);
  if (!pools) return '';

  const allPools: Pool[] = JSON.parse(pools);
  const pool = allPools.find(p => p.id === poolId);

  if (!pool) return '';

  const baseUrl = window.location.origin;
  const encoded = btoa(JSON.stringify(pool));

  return `${baseUrl}/pool/${poolId}?data=${encodeURIComponent(encoded)}`;
}

/**
 * Load pool from URL parameter if present
 */
export function loadPoolFromUrl(): Pool | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');

  if (!data) return null;

  try {
    const decoded = atob(decodeURIComponent(data));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
