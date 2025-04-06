import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Attempting database connection...');
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});
export const db = drizzle({ client: pool, schema });

// Test the connection
pool.connect()
  .then(() => {
    console.log('Database connected successfully');
    console.log('Database URL domain:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    // Attempt reconnection after delay in production
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => pool.connect(), 5000);
    }
  });
