
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "@shared/schema";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set. Did you forget to provide the Turso credentials?");
}

// Log the detected environment
const isProduction = process.env.NODE_ENV === 'production' || 
                    !!process.env.RENDER || 
                    !!process.env.RENDER_EXTERNAL_URL;
console.log(`Database configuration for: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Create Turso client
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Drizzle ORM instance
export const db = drizzle(tursoClient, { schema });

// Initial connection check
async function checkConnection() {
  try {
    console.log('Checking Turso database connection...');
    
    // Simple test query
    const result = await tursoClient.execute('SELECT 1 as test');
    
    if (result.rows && result.rows.length > 0) {
      console.log('Turso database connected successfully!');
      console.log('Database URL:', process.env.TURSO_DATABASE_URL);
    } else {
      console.error('Turso database connection check returned an unexpected result');
    }
  } catch (error) {
    console.error('Turso database connection error:', error);
  }
}

// Run initial connection check
checkConnection();

// Clean up on process exit
process.on('exit', () => {
  // Turso client doesn't have an explicit close method like PostgreSQL pools
  console.log('Exiting application, database connections will be automatically closed');
});

// Handle other termination signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received, exiting...`);
    process.exit(0);
  });
});
