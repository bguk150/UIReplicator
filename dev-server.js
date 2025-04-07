/**
 * Development server that intelligently handles both development and production modes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function distExists() {
  const publicDir = path.join(__dirname, 'dist', 'public');
  const staticServerJs = path.join(__dirname, 'dist', 'static-server.js');
  return fs.existsSync(publicDir) && fs.existsSync(staticServerJs);
}

async function runProductionServer() {
  console.log('🚀 Starting server in production mode...');
  
  try {
    // Use dynamic import for ES modules
    const staticServer = await import('./dist/static-server.js');
    console.log('✅ Server started successfully in production mode!');
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

function runDevelopmentServer() {
  console.log('🚀 Starting server in development mode...');
  
  const server = spawn('tsx', ['server/index.ts'], { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  server.on('error', (err) => {
    console.error('❌ Development server error:', err);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Development server exited with code ${code}`);
      process.exit(code || 1);
    }
  });
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Received SIGINT signal, shutting down...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal, shutting down...');
    server.kill('SIGTERM');
  });
}

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isReplitEnv = process.env.REPL_ID && process.env.REPL_OWNER;

console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Replit Environment: ${isReplitEnv ? 'YES' : 'NO'}`);

// In Replit, default to production mode
if (isReplitEnv && !isProduction) {
  console.log('🔄 Running in Replit environment, forcing production mode...');
  process.env.NODE_ENV = 'production';
}

// Determine whether to use production or development server
if (process.env.NODE_ENV === 'production') {
  if (!distExists()) {
    console.error('❌ Production build not found. Please run "npm run build" first.');
    process.exit(1);
  }
  runProductionServer();
} else {
  runDevelopmentServer();
}

// For module compatibility
export {};