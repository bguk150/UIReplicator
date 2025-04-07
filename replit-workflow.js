/**
 * This script is called by the Replit workflow
 * It determines whether to build and run the app or use the static server
 */
import { execSync } from "child_process";
import fs from 'fs';
import path from 'path';

const staticServerPath = path.join('dist', 'static-server.js');
const hasStaticServer = fs.existsSync(staticServerPath);

if (hasStaticServer) {
  console.log('Static server found, running in production mode...');
  process.env.NODE_ENV = 'production';
  execSync('node dist/static-server.js', { stdio: 'inherit' });
} else {
  console.log('Static server not found, building and running app...');
  execSync('node run-static.js', { stdio: 'inherit' });
}