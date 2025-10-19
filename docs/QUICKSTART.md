# ⚡ Quick Start Guide

## 🚀 Get Running in 2 Minutes

### Step 1: Navigate to Project
```bash
cd SecSanta/fe
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to: **http://localhost:3000**

**That's it!** ✅

---

## 🎯 What You'll See

### 1. Landing Page
- Clean hero section
- "Connect Wallet to Start" button
- Features overview

### 2. Connect Wallet
- Click "Connect Wallet"
- Select MetaMask (or any Web3 wallet)
- Approve connection
- **Notice**: Header shows your ENS name if you have one!

### 3. Dashboard
- Empty state initially (no pools yet)
- "Create New Pool" button prominently displayed

### 4. Create Your First Pool
Click "Create New Pool" and fill in:
- **Pool Name**: "Test Gift Pool"
- **Recipient**: Type `vitalik.eth` (watch it auto-resolve!)
- **Your Contribution**: `0.1`
- **Minimum Contributors**: `3`
- **Gift Suggestion**: "Birthday present for Vitalik"

Click "Create Pool" → Wait 2 seconds → Redirected to pool page

### 5. View Pool
You'll see:
- Pool status: "Ongoing (1/3 contributors)"
- Your ENS name as contributor
- Share link (copy button)
- Progress bar

### 6. Simulate Other Users
To complete the demo flow:

**Option A**: Open in 2 more browser tabs with different wallets

**Option B**: Modify mock data in `fe/lib/debug-data.ts` to pre-fill pools

---

## 🎬 Quick Demo (30 seconds)

1. Connect wallet
2. Create pool with ENS name as recipient
3. Show ENS auto-resolution
4. Show dashboard with pool
5. Show pool detail page

**That's your 30-second demo!**

---

## 🔧 Debug Mode

The app runs in DEBUG mode by default:
- ✅ No real blockchain transactions
- ✅ Mock data and simulated delays
- ✅ Perfect for demos and development

**See**: Yellow banner at top saying "DEBUG MODE ACTIVE"

---

## 📱 Test on Mobile

### Using ngrok or similar:
```bash
# In another terminal
ngrok http 3000
```

Copy the ngrok URL and open on your phone!

### Using local network:
Find your local IP:
```bash
ipconfig getifaddr en0  # macOS
```

Open `http://YOUR_IP:3000` on phone (same WiFi)

---

## 🎯 Common First-Time Issues

### Issue: "Module not found"
**Solution**: Did you run `npm install`?
```bash
npm install
```

### Issue: "Port 3000 already in use"
**Solution**: Use a different port
```bash
PORT=3001 npm run dev
```

### Issue: "ENS names not resolving"
**Solution**: In DEBUG mode, ENS uses mock data
- Check `fe/lib/debug-data.ts` for predefined names
- Or turn off DEBUG mode (needs real blockchain)

### Issue: "Wallet won't connect"
**Solution**:
- Make sure MetaMask is installed
- Try refreshing the page
- Check browser console for errors

---

## 📚 Next Steps

### For Development
1. **Read**: `fe/README.md` for architecture
2. **Modify**: Start with `fe/lib/debug-data.ts` for mock data
3. **Experiment**: Change UI in component files

### For Demo Prep
1. **Read**: `DEMO_GUIDE.md` for full script
2. **Practice**: Run through user flows
3. **Deploy**: Push to Vercel for live URL

### For Smart Contract Integration
1. **Read**: `INTEGRATION_GUIDE.md`
2. **Set**: `NEXT_PUBLIC_FE_DEBUG_MODE=false`
3. **Implement**: Contract calls in `pool-service.ts`

---

## 🗂️ Project Files

### Essential Files
- `README.md` - Main documentation
- `DEMO_GUIDE.md` - Complete demo script
- `BOUNTIES.md` - Bounty strategy
- `PROJECT_SUMMARY.md` - Overview & status
- `fe/README.md` - Frontend-specific docs

### Code Entry Points
- `fe/app/page.tsx` - Landing page
- `fe/app/dashboard/page.tsx` - Dashboard
- `fe/components/ENSDisplay.tsx` - ENS name display
- `fe/lib/pool-service.ts` - Service layer

---

## 🎨 Customization Quick Tips

### Change Theme Colors
Edit: `fe/tailwind.config.ts`
```typescript
colors: {
  primary: { ... }, // Red by default
  secondary: { ... }, // Green by default
}
```

### Add Mock Pool Data
Edit: `fe/lib/debug-data.ts`
```typescript
export const MOCK_POOLS: Pool[] = [
  // Add your mock pools here
];
```

### Modify Landing Page
Edit: `fe/app/page.tsx`

---

## 💡 Tips for Best Demo Experience

1. **Use ENS Names**: Type `vitalik.eth` instead of addresses
2. **Show Auto-Resolution**: Watch as ENS names resolve in real-time
3. **Highlight Progress**: Show the 1/3, 2/3, 3/3 progression
4. **Point Out Privacy**: Mention amounts are hidden until finalization
5. **Show Final State**: Display the finalized pool with all amounts revealed

---

## 🏆 You're All Set!

The app is running at: **http://localhost:3000**

**Now**:
- Explore the features
- Create some pools
- Practice your demo
- Have fun!

**Questions?** Check the other docs:
- Architecture: `fe/README.md`
- Demo Script: `DEMO_GUIDE.md`
- Bounties: `BOUNTIES.md`

---

**Happy Hacking! 🎁**
