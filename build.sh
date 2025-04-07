#!/bin/bash
# Build script for both client and server

echo "Starting build process..."

# Make sure dist directory exists
mkdir -p dist/public

# Build the client application
echo "Building client with vite..."
npm run build

# Build the static server
echo "Building static server with esbuild..."
npx esbuild server/static-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/static-server.js

echo "Build completed successfully!"
