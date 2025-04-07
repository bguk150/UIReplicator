// Database migration script to add marketing_sms and selected_extras columns
// This script should be run directly on the production database through Render shell

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a connection pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Heroku/Render PostgreSQL
  }
});

async function addColumnsIfNotExist() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if selected_extras column exists
    const checkSelectedExtras = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'queue' AND column_name = 'selected_extras'
    `);
    
    // Add selected_extras column if it doesn't exist
    if (checkSelectedExtras.rows.length === 0) {
      console.log('Adding selected_extras column...');
      await client.query(`
        ALTER TABLE queue 
        ADD COLUMN selected_extras TEXT DEFAULT ''
      `);
      console.log('Successfully added selected_extras column');
    } else {
      console.log('selected_extras column already exists');
    }
    
    // Check if marketing_sms column exists
    const checkMarketingSms = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'queue' AND column_name = 'marketing_sms'
    `);
    
    // Add marketing_sms column if it doesn't exist
    if (checkMarketingSms.rows.length === 0) {
      console.log('Adding marketing_sms column...');
      await client.query(`
        ALTER TABLE queue 
        ADD COLUMN marketing_sms TEXT DEFAULT 'No' NOT NULL
      `);
      console.log('Successfully added marketing_sms column');
    } else {
      console.log('marketing_sms column already exists');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (err) {
    // If any error occurs, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the migration
addColumnsIfNotExist().catch(err => {
  console.error('Unhandled error in migration script:', err);
});