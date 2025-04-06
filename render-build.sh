#!/usr/bin/env bash
set -e

# Print each command for debugging
set -x

echo "Installing dependencies with devDependencies..."
npm ci --include=dev

echo "Running build commands..."
NODE_ENV=production npx vite build
NODE_ENV=production npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"