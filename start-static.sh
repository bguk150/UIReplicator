#!/bin/bash

# Static server startup script for Beyond Grooming
# This script is specially designed to work in the Replit environment

echo "💈 Beyond Grooming - Static Server Starter 💈"

# Set environment variables
export NODE_ENV=production

# Ensure we have a build
if [ ! -d "dist/public" ] || [ ! -f "dist/static-server.js" ]; then
  echo "📦 Build artifacts not found. Running build..."
  ./build-helper.sh
  
  if [ $? -ne 0 ]; then
    echo "❌ Build failed! Cannot start server."
    exit 1
  fi
fi

# Start the server
echo "🚀 Starting static server..."
echo "🔗 The app should be available at https://$REPL_SLUG.$REPL_OWNER.repl.co"

node dist/static-server.js
