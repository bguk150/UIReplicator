#!/bin/bash

# Set environment variables
export NODE_ENV=development
# Disable the Replit cartographer plugin to avoid build errors
export CARTOGRAPHER_DISABLE=true 

echo "Building client for development..."
npx vite build

if [ $? -eq 0 ]; then
  echo "Client built successfully!"
  echo "Starting server in development mode..."
  npx tsx server/index.ts
else
  echo "Client build failed!"
  exit 1
fi
