#!/bin/bash

# Beyond Grooming Startup Script
# Handles multiple environments and startup modes

# Display header
echo "==============================================="
echo "💈 Beyond Grooming Barbershop Queue System 💈"
echo "==============================================="

# Detect environment
if [ "$RENDER" = "true" ]; then
  ENV="render"
elif [ -n "$REPL_ID" ]; then
  ENV="replit"
else
  ENV="local"
fi

# Set mode to production for reliability
export NODE_ENV=production
MODE="production"

echo "Environment: $ENV"
echo "Mode: $MODE"

# Use the workflow manager script in Replit
if [ "$ENV" = "replit" ]; then
  echo "Using Replit workflow manager..."
  node replit-workflow.js
else
  # For other environments, directly use the static server
  echo "🚀 Starting in production mode..."

  # Check if build is needed
  if [ ! -d "dist" ] || [ ! -d "dist/public" ]; then
    echo "📦 No build found, creating production build..."
    npm run build
    
    if [ $? -ne 0 ]; then
      echo "❌ Build failed! Please check the logs"
      exit 1
    fi
    
    echo "✅ Build completed successfully"
  fi

  # Use the static server to serve the application
  node run-static.js
fi
