#!/usr/bin/env bash
# Don't exit on errors so we can try fallback approaches
set +e

# Print each command for debugging
set -x

echo "Attempting to install dependencies with devDependencies..."
npm ci --include=dev

# Check if the previous command failed
if [ $? -ne 0 ]; then
  echo "npm ci failed, trying fallback approach with npm install..."
  # Attempt to install dependencies with a more permissive approach
  npm install --include=dev
  
  # If that fails, try installing critical build dependencies explicitly
  if [ $? -ne 0 ]; then
    echo "Fallback npm install failed, installing critical build dependencies explicitly..."
    npm install vite esbuild typescript postcss autoprefixer tailwindcss @vitejs/plugin-react
  fi
fi

# Now we enforce strict error checking for the build process
set -e

echo "Running build commands..."
echo "PATH: $PATH"
echo "NPX location: $(which npx 2>/dev/null || echo 'npx not found')"
echo "VITE location: $(which vite 2>/dev/null || echo 'vite not found')"

# Attempt to run build with explicit path if available
if [ -f "./node_modules/.bin/vite" ]; then
  echo "Using local vite"
  NODE_ENV=production ./node_modules/.bin/vite build
else
  echo "Using npx vite"
  NODE_ENV=production npx vite build
fi

if [ -f "./node_modules/.bin/esbuild" ]; then
  echo "Using local esbuild"
  NODE_ENV=production ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
else
  echo "Using npx esbuild"
  NODE_ENV=production npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
fi

echo "Build completed successfully!"