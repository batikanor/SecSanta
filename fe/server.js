/**
 * Simple sync server for DEBUG mode
 * Stores pools in memory and syncs across all connected clients
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (resets when server restarts)
let pools = [];
let poolCounter = 1;

// Get all pools
app.get('/api/pools', (req, res) => {
  res.json({ pools, counter: poolCounter });
});

// Add a new pool
app.post('/api/pools', (req, res) => {
  const pool = req.body;
  pools.push(pool);
  res.json({ success: true, pool });
});

// Update a pool
app.put('/api/pools/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const index = pools.findIndex(p => p.id === id);
  if (index !== -1) {
    pools[index] = { ...pools[index], ...updates };
    res.json({ success: true, pool: pools[index] });
  } else {
    res.status(404).json({ success: false, error: 'Pool not found' });
  }
});

// Get next pool ID
app.get('/api/pool-id', (req, res) => {
  const id = `pool-${poolCounter}`;
  poolCounter++;
  res.json({ id, counter: poolCounter });
});

// Clear all data (useful for testing)
app.post('/api/clear', (req, res) => {
  pools = [];
  poolCounter = 1;
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🎁 SecSanta Sync Server running on http://localhost:${PORT}`);
  console.log('📡 All browsers will now sync automatically!');
});
