#!/bin/bash

# Start script for Beyond Grooming
# This will be called by npm run dev through the Replit workflow

echo "🚀 Starting Beyond Grooming application"

# First, ensure server/public directory exists
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

# Start the application based on NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
  echo "🏭 Running in production mode"
  node run-static.js
else
  echo "🔧 Running in development mode"
  # Use the original npm run dev command's behavior
  vite
fi