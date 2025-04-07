#!/bin/bash

# Build both client and server
echo "Building client and server..."
npm run build

# Run the static server with the built files
echo "Building static server..."
esbuild server/static-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/static-server.js

# Start the static server
echo "Starting static server..."
NODE_ENV=production node dist/static-server.js