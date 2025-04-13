// Turso Migration Script
// This script creates the necessary tables in Turso database

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  process.exit(1);
}

// Create Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function runMigration() {
  console.log('Starting Turso database migration...');

  try {
    // Create queue table
    console.log('Creating queue table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        service_type TEXT NOT NULL,
        service_price TEXT DEFAULT '',
        service_category TEXT DEFAULT '',
        selected_extras TEXT DEFAULT '',
        payment_method TEXT NOT NULL,
        marketing_sms TEXT DEFAULT 'No' NOT NULL,
        check_in_time TEXT NOT NULL,
        status TEXT DEFAULT 'Waiting' NOT NULL,
        payment_verified TEXT DEFAULT 'No' NOT NULL,
        sms_sent TEXT DEFAULT 'No' NOT NULL
      )
    `);

    // Create users table
    console.log('Creating users table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'barber' NOT NULL
      )
    `);

    // Insert default barber user if not exists
    console.log('Checking for default barber user...');
    const result = await client.execute({
      sql: `SELECT * FROM users WHERE username = ?`,
      args: ['beyondgroominguk@gmail.com']
    });

    if (result.rows.length === 0) {
      console.log('Creating default barber user...');
      await client.execute({
        sql: `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        args: ['beyondgroominguk@gmail.com', 'bg_uk123', 'barber']
      });
    } else {
      console.log('Default barber user already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();