#!/bin/bash

# Beyond Grooming - Special Replit startup script
echo "💈 Beyond Grooming - Replit Startup Script 💈"

# Set production environment 
export NODE_ENV=production

echo "📦 Building application for Replit environment..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Exiting."
  exit 1
fi

echo "✅ Build successful"

# Debug: Show what's in the dist directory
echo "📂 Checking build output..."
ls -la dist
ls -la dist/public

# Start server directly 
echo "🚀 Starting server in Replit environment..."
node dist/static-server.js
