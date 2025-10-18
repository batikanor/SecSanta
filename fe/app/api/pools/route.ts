import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Pool } from '@/types/pool';

// Initialize Redis client (only if env vars are available)
const redis = process.env.KV_REST_API_URL
  ? Redis.fromEnv()
  : null;

const USE_KV = redis !== null;

// GET /api/pools - Get all pools
export async function GET() {
  try {
    if (USE_KV && redis) {
      const poolsData = await redis.get<Pool[]>('pools');
      const pools = Array.isArray(poolsData) ? poolsData : [];
      const counterData = await redis.get<number>('pool-counter');
      const counter = typeof counterData === 'number' ? counterData : 1;
      return NextResponse.json({ pools, counter });
    } else {
      // Development fallback - return empty
      return NextResponse.json({ pools: [], counter: 1 });
    }
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json({ pools: [], counter: 1 });
  }
}

// POST /api/pools - Add new pool
export async function POST(request: NextRequest) {
  try {
    const pool = await request.json();

    if (USE_KV && redis) {
      const poolsData = await redis.get<Pool[]>('pools');
      const pools = Array.isArray(poolsData) ? poolsData : [];
      const updatedPools = [...pools, pool];
      await redis.set('pools', updatedPools);
      return NextResponse.json({ success: true, pool });
    } else {
      // Development fallback
      return NextResponse.json({ success: true, pool });
    }
  } catch (error) {
    console.error('Error adding pool:', error);
    return NextResponse.json({ success: false, error: 'Failed to add pool' }, { status: 500 });
  }
}
