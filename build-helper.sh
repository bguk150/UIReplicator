#!/bin/bash

# Beyond Grooming Build Helper
# This script helps with building and running the application in various environments

# Detect environment
IS_RENDER="${RENDER:-false}"
IS_REPLIT="${REPL_ID:+true}"
IS_REPLIT="${IS_REPLIT:-false}"
NODE_ENV="${NODE_ENV:-development}"

echo "🔍 Environment detection:"
echo "- Render: $IS_RENDER"
echo "- Replit: $IS_REPLIT"
echo "- NODE_ENV: $NODE_ENV"

# Set NODE_ENV to production in Render or Replit environments
if [ "$IS_RENDER" = "true" ] || [ "$IS_REPLIT" = "true" ]; then
  echo "🔄 Setting NODE_ENV to production for deployment environment"
  export NODE_ENV="production"
fi

# Check if build is needed
if [ ! -d "dist" ] || [ ! -d "dist/public" ] || [ ! -f "dist/public/index.html" ] || [ ! -f "dist/static-server.js" ]; then
  echo "📦 Build needed, running npm build..."
  npm run build
  
  if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
  fi
  
  echo "✅ Build completed successfully"
else
  echo "✅ Build already exists, skipping build step"
fi

# Start the application
echo "🚀 Starting the application in $NODE_ENV mode..."

if [ "$NODE_ENV" = "production" ]; then
  # In production, use the static server
  echo "🚀 Using static server for production mode"
  node dist/static-server.js
else
  # In development, use the development server
  echo "🚀 Using development server"
  tsx server/index.ts
fi