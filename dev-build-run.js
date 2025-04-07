/**
 * Development script to build the client and then run the server
 */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isReplitEnv = process.env.REPL_ID && process.env.REPL_OWNER;

console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Replit Environment: ${isReplitEnv ? 'YES' : 'NO'}`);

// If in Replit and production, use our static server approach
if (isReplitEnv) {
  console.log('🔄 Running in Replit environment, using static server approach...');
  
  try {
    // Check if we need to build
    const distDir = path.join(__dirname, 'dist');
    const publicDir = path.join(distDir, 'public');
    const indexHtml = path.join(publicDir, 'index.html');
    
    if (!fs.existsSync(indexHtml)) {
      console.log('📦 Building application...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Start the static server
    console.log('🚀 Starting server in Replit environment...');
    // Use dynamic import for ES modules
    const startTime = Date.now();
    const staticServer = await import('./dist/static-server.js');
    const loadTime = Date.now() - startTime;
    console.log(`⭐ Server module loaded in ${loadTime}ms`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
} else {
  // In development mode or non-Replit environment, use the development server
  console.log('🔄 Running in development mode...');
  execSync('tsx server/index.ts', { stdio: 'inherit' });
}

// For module compatibility
export {};