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
  npm install --no-fund --no-audit --include=dev
  
  # If that fails, try installing critical build dependencies explicitly
  if [ $? -ne 0 ]; then
    echo "Fallback npm install failed, installing critical build dependencies explicitly..."
    npm install vite esbuild typescript postcss autoprefixer tailwindcss @vitejs/plugin-react --no-fund --no-audit
  fi
fi

# Now we enforce strict error checking for the build process
set -e

echo "Running build commands..."
echo "PATH: $PATH"
echo "NPX location: $(which npx)"
echo "VITE location: $(which vite)"

# Attempt to run build with explicit npx path
NODE_ENV=production ./node_modules/.bin/vite build
NODE_ENV=production ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"