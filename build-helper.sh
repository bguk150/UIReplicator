#!/usr/bin/env bash
set -e

# Print each command for debugging
set -x

echo "Installing dependencies with devDependencies..."
npm ci --include=dev

echo "Running build commands from the build script..."
npm run build