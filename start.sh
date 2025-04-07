#!/bin/bash

# Start script for Beyond Grooming
echo "💈 Beyond Grooming - Start Script 💈"

# Set production environment
export NODE_ENV=production

# Check if dist directory exists
if [ ! -d "dist" ] || [ ! -d "dist/public" ]; then
  echo "❌ Build artifacts not found. Running build script..."
  ./build.sh
  if [ $? -ne 0 ]; then
    echo "❌ Build failed. Cannot start the application."
    exit 1
  fi
fi

# Start the application
echo "🚀 Starting application in production mode..."
node dist/static-server.js

# Exit with the server's exit code
exit $?
