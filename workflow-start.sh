#!/bin/bash

# Beyond Grooming Custom Workflow Script for Replit
echo "💈 Beyond Grooming App - Replit Workflow Starter 💈"

# Set production mode
export NODE_ENV=production

# Determine if we need to build first
if [ ! -d "dist/public" ] || [ "$1" == "--rebuild" ]; then
  echo "📦 Building application..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
  fi
  echo "✅ Build completed successfully!"
fi

# Start static server directly
echo "🚀 Starting server in production mode..."
node dist/static-server.js
