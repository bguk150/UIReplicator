#!/bin/bash
# Set production environment
export NODE_ENV=production

# Check if build exists, if not build it
if [ ! -d "./dist/public" ]; then
  echo "Build directory does not exist, building app..."
  node run-static.js
else
  echo "Build directory exists, serving static files..."
  node dist/static-server.js
fi
