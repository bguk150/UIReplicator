#!/bin/bash

# Beyond Grooming - Dev Build & Run wrapper
# This script intelligently handles the development environment
echo "💈 Beyond Grooming - Dev Build & Run 💈"

# Check if we're in Replit
if [ -n "$REPL_ID" ] && [ -n "$REPL_OWNER" ]; then
  echo "🔄 Detected Replit environment, using production mode..."
  export NODE_ENV=production
  
  # Check if we need to build
  if [ ! -d "dist/public" ] || [ ! -f "dist/static-server.js" ]; then
    echo "📦 Building application..."
    npm run build
    
    if [ $? -ne 0 ]; then
      echo "❌ Build failed!"
      exit 1
    fi
  fi
  
  # Start the static server
  echo "🚀 Starting server in Replit environment..."
  node dist/static-server.js
else
  # In regular development mode
  echo "🔄 Running in standard development mode..."
  tsx server/index.ts
fi
