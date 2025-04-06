#!/bin/bash
# Copy files to where Render expects them
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Make sure we're in the right directory
echo "Copying package.json to Render's expected location"
cp package.json /opt/render/project/src/
cp package-lock.json /opt/render/project/src/ 2>/dev/null || echo "No package-lock.json found, continuing..."
cp -r client /opt/render/project/src/
cp -r server /opt/render/project/src/
cp -r shared /opt/render/project/src/
cp tsconfig.json /opt/render/project/src/ 2>/dev/null || echo "No tsconfig.json found, continuing..."
cp vite.config.ts /opt/render/project/src/ 2>/dev/null || echo "No vite.config.ts found, continuing..."
cp tailwind.config.ts /opt/render/project/src/ 2>/dev/null || echo "No tailwind.config.ts found, continuing..."
cp postcss.config.js /opt/render/project/src/ 2>/dev/null || echo "No postcss.config.js found, continuing..."
cp theme.json /opt/render/project/src/ 2>/dev/null || echo "No theme.json found, continuing..."
cp drizzle.config.ts /opt/render/project/src/ 2>/dev/null || echo "No drizzle.config.ts found, continuing..."

# Navigate to where the files are now
cd /opt/render/project/src/

# We don't install dependencies here as the render.yaml's buildCommand will do that

echo "Files copied successfully!"