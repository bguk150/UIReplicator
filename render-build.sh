#!/bin/bash
# Make sure we have all dev dependencies installed
npm install --include=dev

# Now run the build commands with npx
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
