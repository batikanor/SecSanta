#!/bin/bash

echo "🧹 Cleaning up ports 3000 and 3001..."

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ Killed process on port 3000"
fi

# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ Killed process on port 3001"
fi

echo "🚀 Starting SecSanta development environment..."
echo ""

# Start both servers
concurrently "npm run server" "npm run dev"
