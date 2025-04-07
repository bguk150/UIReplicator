#!/bin/bash

# Build script for Beyond Grooming
echo "💈 Beyond Grooming - Build Script 💈"

# Set production environment
export NODE_ENV=production

# Build the application
echo "📦 Building application..."

# Build the frontend and backend
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully!"
echo "✨ Build artifacts are in the dist/ directory"
