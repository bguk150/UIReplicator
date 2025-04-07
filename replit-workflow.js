/**
 * This script is called by the Replit workflow
 * It determines whether to build and run the app or use the static server
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if static server should be used
function useStaticServer() {
  try {
    const env = process.env.NODE_ENV || 'development';
    return env === 'production';
  } catch (error) {
    return false;
  }
}

// Main function to start the app
async function startApp() {
  console.log('♦️ Beyond Grooming Workflow Manager ♦️');
  
  // In production mode, use the static server
  if (useStaticServer()) {
    console.log('Starting in production mode...');
    
    // Start the static server (run-static.js)
    const staticServer = spawn('node', ['run-static.js'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    staticServer.on('exit', (code) => {
      console.error(`Static server exited with code ${code}`);
      process.exit(code || 1);
    });
  } else {
    console.log('Starting in development mode...');
    
    // Start development server (server/index.ts)
    const devServer = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit' 
    });
    
    devServer.on('exit', (code) => {
      console.error(`Development server exited with code ${code}`);
      process.exit(code || 1);
    });
  }
}

// Start the application
startApp().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
