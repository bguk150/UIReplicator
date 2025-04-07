#!/bin/bash

# Choose the best startup method based on environment and settings

# Set production mode as default for safety
export NODE_ENV=production

# Determine if we're on Render or Replit
if [ "$RENDER" = "true" ]; then
  echo "📡 Render environment detected"
  node run-static.js
elif [ -n "$REPL_ID" ]; then
  echo "🌐 Replit environment detected"
  # Run the Replit-specific startup
  ./start.sh
else
  echo "💻 Local environment detected"
  node run-static.js
fi
