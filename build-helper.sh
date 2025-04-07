#!/bin/bash

# Build helper script for Beyond Grooming
# This script ensures the build output is in the correct location for Replit

echo "💈 Beyond Grooming - Build Helper 💈"

# Run the build
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully!"

# Check if dist directory exists and has the expected content
if [ ! -d "dist/public" ]; then
  echo "❌ dist/public directory not found after build! Something went wrong."
  exit 1
fi

if [ ! -f "dist/static-server.js" ]; then
  echo "❌ dist/static-server.js not found after build! Something went wrong."
  exit 1
fi

echo "📂 Build output overview:"
ls -la dist
ls -la dist/public

echo "✨ Build process complete and verified!"
