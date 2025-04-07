#!/bin/bash

# Special script for Replit Workflow
echo "💈 Beyond Grooming - Replit Mode 💈"

# Set production mode and any Replit-specific variables
export NODE_ENV=production

# Check if build exists
if [ ! -d "dist" ] || [ ! -f "dist/static-server.js" ] || [ ! -d "dist/public" ]; then
  echo "📦 Build needed, running npm build..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
  fi
  echo "✅ Build completed successfully"
else
  echo "✅ Using existing build"
fi

# Start server using our production script
echo "🚀 Starting server in production mode..."
node run-static.js
