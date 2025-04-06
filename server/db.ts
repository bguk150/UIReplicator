
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

export const db = drizzle({ client: pool, schema });

// Connection management
let retryCount = 0;

async function connectWithRetry() {
  try {
    console.log('Attempting database connection...');
    await pool.connect();
    console.log('Database connected successfully');
    console.log('Database URL domain:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    retryCount = 0; // Reset retry count on successful connection
  } catch (err) {
    console.error('Database connection error:', err);
    retryCount++;
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.error('Max retries reached. Please check your database configuration.');
    }
  }
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (retryCount < MAX_RETRIES) {
    connectWithRetry();
  }
});

// Initial connection
connectWithRetry();
