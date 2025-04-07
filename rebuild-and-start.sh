#!/bin/bash

# Beyond Grooming - Rebuild and Start
# This script rebuilds the app and starts it in production mode

# Set production mode
export NODE_ENV=production

# Clean previous build
rm -rf dist

# Build the app
echo "🔨 Building application..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Start the app in production mode
echo "🚀 Starting application in production mode..."
node run-static.js
