import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Pool } from '@/types/pool';

// Initialize Redis client (only if env vars are available)
const redis = process.env.KV_REST_API_URL
  ? Redis.fromEnv()
  : null;

const USE_KV = redis !== null;

// GET /api/pools/[id] - Get specific pool
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (USE_KV && redis) {
      const poolsData = await redis.get<Pool[]>('pools');
      const pools = Array.isArray(poolsData) ? poolsData : [];
      const pool = pools.find((p) => p.id === id) || null;
      return NextResponse.json({ pool });
    } else {
      return NextResponse.json({ pool: null });
    }
  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json({ pool: null });
  }
}

// PUT /api/pools/[id] - Update pool
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    if (USE_KV && redis) {
      const poolsData = await redis.get<Pool[]>('pools');
      const pools = Array.isArray(poolsData) ? poolsData : [];
      const poolIndex = pools.findIndex((p) => p.id === id);

      if (poolIndex === -1) {
        return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });
      }

      const updatedPools = [...pools];
      updatedPools[poolIndex] = { ...updatedPools[poolIndex], ...updates };
      await redis.set('pools', updatedPools);

      return NextResponse.json({ success: true, pool: updatedPools[poolIndex] });
    } else {
      return NextResponse.json({ success: true, pool: updates });
    }
  } catch (error) {
    console.error('Error updating pool:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pool' }, { status: 500 });
  }
}
