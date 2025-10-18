# ⚡ Vercel Deployment - Quick Start

## 🎯 TL;DR

```bash
# 1. Deploy to Vercel
npm install -g vercel
vercel

# 2. On Vercel dashboard:
# - Storage → Create Database → KV → Connect to project

# 3. Add environment variable:
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_real_project_id

# 4. Done! 🎉
```

---

## 📚 Full Guide

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete instructions.

---

## ✅ What You Get

### Before (Express Server)
- ❌ Won't work on Vercel
- ❌ Need to run two servers
- ❌ Port 3001 for sync server

### After (Next.js API Routes + Vercel KV)
- ✅ **Serverless** - works on Vercel
- ✅ **One command** - just `npm run dev`
- ✅ **Persistent data** - Vercel KV (Redis)
- ✅ **Auto-sync** - across browsers/devices

---

## 🔄 How It Works

### Development
```
localhost:3000/api/pools → Next.js API Routes → localStorage
```

### Production (Vercel)
```
your-app.vercel.app/api/pools → Next.js API Routes → Vercel KV
```

---

## 🆚 Vercel KV vs. Supabase

Both work great! Here's why I chose **Vercel KV**:

| Feature | Vercel KV | Supabase |
|---------|-----------|----------|
| Setup | ✅ 1-click in Vercel | ⚠️ Separate account needed |
| Integration | ✅ Native Vercel | ⚠️ Add connection string |
| Performance | ✅ Edge-optimized | ✅ Good |
| Free Tier | ✅ 30k commands/month | ✅ Generous |
| Complexity | ✅ Simple (Redis) | ⚠️ Full SQL database |

**For this hackathon project**: Vercel KV is perfect - simpler, faster setup, and native integration.

**If you wanted Supabase instead**: Easy to switch! Just:
1. Create Supabase project
2. Install `@supabase/supabase-js`
3. Update API routes to use Supabase client
4. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel

---

## 📦 Files Changed

### New API Routes
- `app/api/pools/route.ts` - GET/POST pools
- `app/api/pools/[id]/route.ts` - GET/PUT specific pool
- `app/api/pool-id/route.ts` - Generate pool ID
- `app/api/clear/route.ts` - Clear all data

### Updated Files
- `lib/sync-client.ts` - Uses API routes instead of Express
- `.env.local` - Removed `SYNC_SERVER_URL`
- `package.json` - Added `@vercel/kv`

### Unchanged Files
- All UI components work the same
- Pool service logic unchanged
- Debug mode still works

---

## 🚀 Deploy Now

```bash
vercel
```

That's it! Follow the prompts and you're live! 🎉
