import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if env vars are available)
const redis = process.env.KV_REST_API_URL
  ? Redis.fromEnv()
  : null;

const USE_KV = redis !== null;

// POST /api/clear - Clear all data
export async function POST() {
  try {
    if (USE_KV && redis) {
      await redis.set('pools', []);
      await redis.set('pool-counter', 1);
      return NextResponse.json({ success: true, message: 'All data cleared' });
    } else {
      return NextResponse.json({ success: true, message: 'Development mode - no data to clear' });
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear data' }, { status: 500 });
  }
}
