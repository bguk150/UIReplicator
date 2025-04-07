#!/bin/bash

# Workflow starter script for Replit
# This script prepares the environment and starts the app in the Replit workflow

echo "🚀 Starting Beyond Grooming application in Replit workflow"

# First, make sure we have the server/public directory
if [ ! -d "server/public" ]; then
  echo "📁 Creating server/public directory..."
  mkdir -p server/public
  
  # Create a placeholder index.html
  echo '<!DOCTYPE html><html><head><title>Development Server</title></head><body><div id="root"></div></body></html>' > server/public/index.html
  
  echo "✅ Created server/public directory with placeholder"
fi

# Check database connection
echo "🔍 Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ Warning: DATABASE_URL environment variable is not set"
  echo "The application might not be able to connect to the database"
else
  echo "✅ DATABASE_URL is set"
fi

# Start the application in development mode
echo "🚀 Starting development server..."
exec node --experimental-specifier-resolution=node --es-module-specifier-resolution=node ./server/index.ts
