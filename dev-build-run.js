/**
 * Development script to build the client and then run the server
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🛠️ Development Build & Run Tool');

// Check if client needs building
const publicPath = path.join(process.cwd(), 'server', 'public');
const needsBuild = !fs.existsSync(publicPath);

if (needsBuild) {
  console.log('🔨 Building client for development...');
  
  // Run a quick Vite build just to generate the needed files
  const buildProcess = spawn('vite', ['build', '--mode', 'development'], { 
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Development build failed');
      process.exit(1);
    }
    
    console.log('✅ Development build completed');
    
    // Create necessary directories
    if (!fs.existsSync(path.dirname(publicPath))) {
      fs.mkdirSync(path.dirname(publicPath), { recursive: true });
    }
    
    // Copy the built files to the server/public directory
    try {
      fs.cpSync(path.join(process.cwd(), 'dist', 'public'), publicPath, { recursive: true });
      console.log('🔄 Development files copied to server/public');
    } catch (error) {
      console.error('Error copying files:', error);
    }
    
    // Run the development server
    runDevServer();
  });
} else {
  console.log('✅ Development build already exists');
  runDevServer();
}

function runDevServer() {
  console.log('🚀 Starting development server...');
  
  // Start the development server
  const serverProcess = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Development server exited with code ${code}`);
    process.exit(code || 0);
  });
}
