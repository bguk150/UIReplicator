import { spawn } from 'child_process';
import process from 'process';

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.CARTOGRAPHER_DISABLE = 'true';

console.log('Starting server in development mode...');
const server = spawn('npx', ['tsx', 'server/index.ts'], { 
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
