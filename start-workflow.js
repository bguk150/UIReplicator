/**
 * Custom workflow script for Replit
 * This script handles building and running the application in a way
 * that works with Replit's environment
 */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Check if we need to build the application first
const buildDir = path.join(__dirname, 'dist', 'public');
const buildNeeded = !fs.existsSync(buildDir) || 
                   process.argv.includes('--force-build');

// Build the application if needed
if (buildNeeded) {
  console.log('📦 Building application...');
  try {
    // Build the frontend
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Start the server
console.log('🚀 Starting server in production mode...');

try {
  // Use dynamic import for ES modules
  const staticServer = await import('./dist/static-server.js');
  console.log('⭐ Server started successfully!');
} catch (error) {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}

// Export for ES modules
export {};