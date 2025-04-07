/**
 * Enhanced static file server runner for Replit and Render
 * This script handles both build and runtime for production environments
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment
process.env.NODE_ENV = 'production';

// Check if we have a database URL
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL environment variable is not set.');
  console.warn('Database functionality will be limited or unavailable.');
}

// Check if ClickSend credentials are available
if (!process.env.CLICKSEND_USERNAME || !process.env.CLICKSEND_API_KEY) {
  console.warn('⚠️ WARNING: ClickSend credentials are not set.');
  console.warn('SMS notification functionality will be unavailable.');
}

// Paths
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(distDir, 'public');
const indexHtml = path.join(publicDir, 'index.html');
const staticServerJs = path.join(distDir, 'static-server.js');

// Check if we need to build
const needsBuild = !fs.existsSync(indexHtml) || !fs.existsSync(staticServerJs);

// Build the application if needed
if (needsBuild) {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Start the static server
console.log('🚀 Starting server in production mode...');

try {
  // Dynamically import the static server
  const startTime = Date.now();
  const staticServer = await import('./dist/static-server.js');
  const loadTime = Date.now() - startTime;
  console.log(`⭐ Server module loaded in ${loadTime}ms`);
} catch (error) {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// For module compatibility
export {};