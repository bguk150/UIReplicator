#!/bin/bash

# Beyond Grooming - Rebuild and Start Script
echo "💈 Beyond Grooming - Rebuild and Start Script 💈"

# Set production environment
export NODE_ENV=production

# Clean up any old processes
pkill -f "node dist/static-server.js" || true

# Force a rebuild
echo "📦 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully!"

# Start the server directly
echo "🚀 Starting server..."
node dist/static-server.js
