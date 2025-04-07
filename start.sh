#!/bin/bash

# Set production environment
export NODE_ENV=production

# Build the client and server
echo "Building application..."
npm run build

# Build the static server with esbuild
echo "Building static server..."
npx esbuild server/static-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/static-server.js

# Start the static server
echo "Starting static server..."
node dist/static-server.js
