/**
 * Development script to build the client and then run the server
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Set environment variables
process.env.NODE_ENV = 'development';

console.log('Building client for development...');
try {
  // Build the client first
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Client built successfully!');
  console.log('Starting server in development mode...');
  
  // Run the server with tsx
  execSync('tsx server/index.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}