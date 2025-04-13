
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Optimize pool settings for Neon serverless in production
const isProduction = process.env.NODE_ENV === 'production' || 
                    !!process.env.RENDER || 
                    !!process.env.RENDER_EXTERNAL_URL;

// Special handling for Render.com - they have specific requirements for proper connection pooling
const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;

// Log the detected environment
console.log(`Database configuration for: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}${isRender ? ' (Render)' : ''}`);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always use SSL with Neon
  // Render-specific optimizations for Neon serverless
  max: isRender ? 5 : (isProduction ? 10 : 20), // Very conservative pool size for Render
  idleTimeoutMillis: isRender ? 5000 : (isProduction ? 10000 : 30000), // Very aggressive timeout for Render
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection couldn't be established
  allowExitOnIdle: true, // Allow idle clients to be closed automatically
});

export const db = drizzle({ client: pool, schema });

// Connection management with enhanced error handling and reconnect logic
let retryCount = 0;
let connectionCheckInterval: NodeJS.Timeout | null = null;

async function connectWithRetry() {
  try {
    console.log('Attempting database connection...');
    const client = await pool.connect();
    
    console.log('Database connected successfully');
    console.log('Database URL domain:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    
    // Release the test connection but keep the pool active
    client.release(true);
    
    // Reset retry count on successful connection
    retryCount = 0;
    
    // Set up a periodic connection check for production
    if (process.env.NODE_ENV === 'production' && !connectionCheckInterval) {
      connectionCheckInterval = setInterval(async () => {
        try {
          // Ping database to keep the connection alive and verify health
          const pingClient = await pool.connect();
          await pingClient.query('SELECT 1');
          pingClient.release(true);
        } catch (pingError) {
          console.error('Connection check failed:', pingError);
          // If ping fails, trigger reconnect logic but with a different path
          if (retryCount < MAX_RETRIES) {
            // Clear the interval to prevent multiple concurrent reconnection attempts
            if (connectionCheckInterval) {
              clearInterval(connectionCheckInterval);
              connectionCheckInterval = null;
            }
            connectWithRetry();
          }
        }
      }, 60000); // Check every minute
    }
  } catch (err: any) {
    // Enhanced error reporting with code detection
    if (err.code === '57P01') {
      console.error('Database connection terminated by administrator. This is often caused by connection pooling issues or server maintenance.');
    } else {
      console.error('Database connection error:', err);
    }
    
    retryCount++;
    
    // Exponential backoff for retries
    const delay = Math.min(RETRY_DELAY * Math.pow(1.5, retryCount-1), 30000); // Max 30 second delay
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${delay/1000} seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectWithRetry, delay);
    } else {
      console.error('Max retries reached. Please check your database configuration.');
      // Reset retry count after a longer delay to eventually try again
      setTimeout(() => {
        retryCount = 0;
        connectWithRetry();
      }, 60000); // Wait a minute before starting fresh
    }
  }
}

// Handle pool errors with improved detection and recovery
pool.on('error', (err: any) => {
  console.error('Unexpected database error:', err);
  
  // Special handling for common Neon error codes
  if (err.code === '57P01') {
    console.log('Detected connection terminated by admin error (57P01). Reconnecting...');
  } else if (err.code === '08006' || err.code === '08001' || err.code === '08004') {
    console.log('Detected connection failure. Reconnecting...');
  } else if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.log('Detected network error. Reconnecting...');
  }
  
  // Prevent reconnection storm by checking retry count
  if (retryCount < MAX_RETRIES) {
    // Clear any existing connection check interval
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
    
    // Delay slightly before reconnecting to prevent rapid reconnection attempts
    setTimeout(connectWithRetry, 1000);
  }
});

// Clean up on process exit
process.on('exit', () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  pool.end();
});

// Handle other termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
    pool.end();
    process.exit(0);
  });
});

// Initial connection
connectWithRetry();
