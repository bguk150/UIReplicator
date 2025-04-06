#!/bin/bash
# Install all dependencies including dev dependencies
npm install --include=dev

# Run the build commands
NODE_ENV=production npx vite build
NODE_ENV=production npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist