/**
 * Enhanced static file server runner for Replit and Render
 * This script handles both build and runtime for production environments
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the environment
const isRender = !!process.env.RENDER;
const isReplit = !!(process.env.REPL_ID && process.env.REPL_OWNER);
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Running in environment:
- Render: ${isRender ? 'YES' : 'NO'}
- Replit: ${isReplit ? 'YES' : 'NO'} 
- Production mode: ${isProduction ? 'YES' : 'NO'}`);

// Force production mode if on Render or Replit
if ((isRender || isReplit) && !isProduction) {
  console.log('📝 Forcing production mode for deployment environment');
  process.env.NODE_ENV = 'production';
}

// Check if build is needed
async function checkBuildNeeded() {
  const distDir = path.join(__dirname, 'dist');
  const publicDir = path.join(distDir, 'public');
  const indexHtmlPath = path.join(publicDir, 'index.html');
  const staticServerJsPath = path.join(distDir, 'static-server.js');
  
  // If dist directory or required files don't exist, build is needed
  return !fs.existsSync(distDir) || 
         !fs.existsSync(publicDir) || 
         !fs.existsSync(indexHtmlPath) ||
         !fs.existsSync(staticServerJsPath);
}

// Build the application
async function buildApplication() {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error);
    return false;
  }
}

// Start the static server
async function startStaticServer() {
  console.log('🚀 Starting static server...');
  try {
    // Use dynamic import for ES Modules compatibility
    const staticServer = await import('./dist/static-server.js');
    console.log('✅ Server started successfully');
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  // Ensure we're in production mode on Render and Replit
  if (isRender || isReplit) {
    process.env.NODE_ENV = 'production';
  }
  
  // Check if build is needed
  const buildNeeded = await checkBuildNeeded();
  
  // Build if necessary (mostly for Replit as Render will already have run the build step)
  if (buildNeeded) {
    const buildSuccess = await buildApplication();
    if (!buildSuccess) {
      console.error('❌ Cannot continue without a successful build');
      process.exit(1);
    }
  }
  
  // Start the server
  await startStaticServer();
}

// Run the main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

// For module compatibility
export {};