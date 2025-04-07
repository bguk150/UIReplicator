#!/bin/bash

# Beyond Grooming Dedicated Replit Start Script
echo "💈 Beyond Grooming Replit Start Script 💈"

# Clear any existing node processes to prevent port conflicts
echo "🧹 Cleaning up any existing processes..."
pkill -f "node dist/static-server.js" || true

# Set production environment
export NODE_ENV=production

# Make sure we have a build
if [ ! -d "dist/public" ] || [ ! -f "dist/static-server.js" ]; then
  echo "📦 No build found. Building application..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
  fi
fi

# Start the server directly, not with node -r flag which has issues in Replit
echo "🚀 Starting application server..."
node dist/static-server.js

# We should never get here unless the server exits
echo "⚠️ Server exited with code $?"
