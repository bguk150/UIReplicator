/**
 * Development server that intelligently handles both development and production modes
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if dist/public directory exists
function distExists() {
  const distPath = path.join(__dirname, 'dist', 'public');
  return fs.existsSync(distPath);
}

// Run production server directly from dist folder
async function runProductionServer() {
  console.log('🚀 Running in production mode with built assets');
  
  // Start the production server
  const server = spawn('node', ['run-static.js'], { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
      process.exit(code || 1);
    }
  });
}

// For development, ensure server/public exists before starting dev server
function runDevelopmentServer() {
  console.log('🔧 Running in development mode');
  
  // Check if server/public directory exists
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  
  if (!fs.existsSync(serverPublicPath)) {
    console.log('Creating server/public directory...');
    
    try {
      // Create the directory
      fs.mkdirSync(serverPublicPath, { recursive: true });
      
      // Create a placeholder index.html file to prevent errors
      fs.writeFileSync(
        path.join(serverPublicPath, 'index.html'),
        '<!DOCTYPE html><html><head><title>Development Build</title></head><body><h1>Development Server</h1><p>This is a placeholder. The real content will be served by Vite.</p></body></html>'
      );
      
      console.log('✅ Created server/public directory with placeholder');
    } catch (error) {
      console.error('Error creating server/public:', error);
      process.exit(1);
    }
  }
  
  // In development mode, the workflow system will handle starting the server
  console.log('✅ Development environment is ready for the workflow');
  console.log('The workflow can now run the development server');
}

// Main function
async function main() {
  // Check environment
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production' && distExists()) {
    await runProductionServer();
  } else {
    runDevelopmentServer();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
