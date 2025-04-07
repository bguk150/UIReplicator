/**
 * This script is called by the Replit workflow
 * It determines whether to build and run the app or use the static server
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('💈 Beyond Grooming Workflow 💈');

// Set production environment
process.env.NODE_ENV = 'production';

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(distDir, 'public');
const shouldBuild = !fs.existsSync(publicDir) || process.argv.includes('--rebuild');

// Build the app if necessary
if (shouldBuild) {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Start the static server
console.log('🚀 Starting server...');
try {
  // Use dynamic import for ES modules
  const staticServer = await import('./dist/static-server.js');
} catch (error) {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}

// Export for dynamic imports
export {};