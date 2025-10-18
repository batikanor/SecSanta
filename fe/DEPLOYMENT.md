# 🚀 Deployment Guide - Vercel + Vercel KV

## Overview

SecSanta is configured to deploy seamlessly to Vercel with **Vercel KV (Redis)** for cross-browser data syncing.

---

## ✅ What Changed for Vercel

### Before (Local Development)
- ❌ Express server on port 3001
- ❌ Doesn't work on Vercel (serverless)
- ❌ Need to run two servers

### After (Vercel-Ready)
- ✅ Next.js API routes (`/api/pools`, etc.)
- ✅ Works on Vercel serverless
- ✅ Uses Vercel KV (Redis) in production
- ✅ Falls back to localStorage in development

---

## 📦 Step 1: Push to GitHub

```bash
cd fe
git init
git add .
git commit -m "Initial commit - SecSanta"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/secsanta.git
git push -u origin main
```

---

## 🔗 Step 2: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? secsanta (or your choice)
# - Directory? ./
# - Override settings? No
```

### Option B: Vercel Dashboard

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `./fe` if repo includes parent folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click **"Deploy"**

---

## 🗄️ Step 3: Set Up Vercel KV (Redis)

### Create KV Database

1. Go to your project dashboard on Vercel
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"KV"** (Redis)
5. Name it: `secsanta-kv`
6. Region: Choose closest to your users
7. Click **"Create"**

### Connect to Project

1. After creating KV, click **"Connect Project"**
2. Select your `secsanta` project
3. Vercel automatically adds environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

---

## ⚙️ Step 4: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables

```env
# Debug mode - set to true to use localStorage fallback
NEXT_PUBLIC_FE_DEBUG_MODE=true

# Sync server - set to true to use API routes
NEXT_PUBLIC_USE_SYNC_SERVER=true

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here

# Chain configuration
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

### How to Set Variables on Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
   - **Value**: The actual value
   - **Environment**: Production, Preview, Development (select all)
3. Click **"Save"**

---

## 🎯 Step 5: Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com/
2. Sign in / Create account
3. Create a new project
4. Copy the **Project ID**
5. Add to Vercel environment variables

---

## 🧪 Step 6: Test Your Deployment

### Automatic Deployment
- Every `git push` to main triggers a new deployment
- Vercel builds and deploys automatically

### Test the App

1. Visit your Vercel URL (e.g., `https://secsanta.vercel.app`)
2. Connect wallet
3. Create a pool
4. Open in another browser → Pool should sync! ✅

---

## 🔄 How It Works

### Development (localhost)
```
Browser → Next.js API Routes → localStorage
         (http://localhost:3000/api/pools)
```

### Production (Vercel)
```
Browser → Next.js API Routes → Vercel KV (Redis)
         (https://your-app.vercel.app/api/pools)
```

### Architecture
- **Client** calls `/api/pools`, `/api/pools/[id]`, etc.
- **API Routes** check if `KV_REST_API_URL` exists:
  - ✅ **Production**: Use Vercel KV (persistent across browsers/devices)
  - ❌ **Development**: Return empty data (falls back to localStorage)

---

## 📊 Vercel KV Details

### What is Vercel KV?
- **Redis-compatible** key-value store
- **Serverless-optimized** for Vercel
- **Global edge network** for low latency
- **Free tier**: 30,000 commands/month

### Pricing
- **Free**: Perfect for demo/hackathon
- **Pro**: $0.20 per 100k commands (if you scale)

### Data Structure
```typescript
// Stored in KV:
{
  "pools": [
    { id: "pool-1", name: "Alice's Birthday", ... },
    { id: "pool-2", name: "Bob's Wedding", ... }
  ],
  "pool-counter": 3
}
```

---

## 🛠️ Local Development (Still Works!)

### With API Routes (Recommended)

```bash
npm run dev
```

Then open http://localhost:3000

- API routes work at `http://localhost:3000/api/*`
- No need for Express server!
- Data syncs via Next.js API routes → localStorage

### With Express Server (Old Way)

```bash
npm run dev:full
```

- Express server on port 3001
- Next.js on port 3000
- Can still use if preferred

---

## 🚨 Troubleshooting

### "Pools not syncing on Vercel"

**Check:**
1. Vercel KV database is created and connected
2. Environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set
3. Redeploy after adding environment variables

### "WalletConnect not working"

**Fix:**
1. Get real Project ID from https://cloud.walletconnect.com/
2. Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in Vercel
3. Redeploy

### "ENS names not showing"

**Check:**
1. User is connected to Ethereum Mainnet (not testnet)
2. User has reverse record set at https://app.ens.domains
3. Browser console for errors

### "API routes returning empty data"

**In Production:**
- Check Vercel KV is connected
- Check `KV_REST_API_URL` environment variable exists
- View Vercel logs: **Project → Deployments → [latest] → Runtime Logs**

**In Development:**
- Expected behavior - falls back to localStorage
- Check browser localStorage: DevTools → Application → Local Storage

---

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Vercel KV database created and connected
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_FE_DEBUG_MODE`
  - [ ] `NEXT_PUBLIC_USE_SYNC_SERVER`
  - [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (real ID)
  - [ ] `NEXT_PUBLIC_CHAIN_ID`
  - [ ] `NEXT_PUBLIC_ENABLE_TESTNETS`
- [ ] App tested on Vercel URL
- [ ] Multi-browser sync verified
- [ ] ENS names displaying correctly

---

## 🎉 You're Live!

Your app is now:
- ✅ Deployed on Vercel
- ✅ Using Vercel KV for data sync
- ✅ Accessible worldwide
- ✅ Auto-deploying on every push
- ✅ Ready for demo/hackathon!

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **ENS Domains**: https://app.ens.domains

---

## 🆘 Need Help?

**Vercel Support:**
- Documentation: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Project Issues:**
- Check browser console (F12)
- Check Vercel logs
- Review environment variables

---

**Happy Deploying! 🚀**
