#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Build the application
echo "Building application..."
npm run build

# Build static server
echo "Building static server..."
esbuild server/static-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/static-server.js

# Start the static server
echo "Starting static server..."
node dist/static-server.js