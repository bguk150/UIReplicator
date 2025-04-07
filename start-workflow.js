/**
 * Custom workflow script for Replit
 * This script handles building and running the application in a way
 * that works with Replit's environment
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if a path exists
function exists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch (err) {
    return false;
  }
}

// Check if we need to build the application
const needsBuild = !exists('./dist') || !exists('./dist/public') || !exists('./dist/index.js');

console.log('====================');
console.log('💈 Beyond Grooming Workflow 💈');
console.log('====================');

// Set environment variables
process.env.NODE_ENV = 'production';

if (needsBuild) {
  console.log('📦 Building application...');
  // Run the build script
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  buildProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Build failed!');
      process.exit(1);
    }
    
    console.log('✅ Build complete!');
    startApplication();
  });
} else {
  console.log('✅ Using existing build');
  startApplication();
}

function startApplication() {
  console.log('🚀 Starting application in production mode...');
  
  // Use the run-static.js script to start the application
  const startProcess = spawn('node', ['run-static.js'], { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  startProcess.on('exit', (code) => {
    console.error(`❌ Application exited with code ${code}`);
    process.exit(code || 1);
  });
}
