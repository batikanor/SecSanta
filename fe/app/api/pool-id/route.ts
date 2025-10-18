import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if env vars are available)
const redis = process.env.KV_REST_API_URL
  ? Redis.fromEnv()
  : null;

const USE_KV = redis !== null;

// GET /api/pool-id - Generate new pool ID
export async function GET() {
  try {
    if (USE_KV && redis) {
      const counterData = await redis.get<number>('pool-counter');
      const counter = typeof counterData === 'number' ? counterData : 1;
      const newCounter = counter + 1;
      await redis.set('pool-counter', newCounter);
      return NextResponse.json({ poolId: `pool-${counter}` });
    } else {
      // Development fallback - use timestamp
      return NextResponse.json({ poolId: `pool-${Date.now()}` });
    }
  } catch (error) {
    console.error('Error generating pool ID:', error);
    return NextResponse.json({ poolId: `pool-${Date.now()}` });
  }
}
