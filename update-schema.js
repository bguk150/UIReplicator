// Script to push the updated schema to the database using Drizzle Kit

const { exec } = require('child_process');

console.log('Pushing schema changes to the database...');
exec('npm run db:push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing db:push: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`db:push stderr: ${stderr}`);
    return;
  }
  
  console.log(`Schema updated successfully:\n${stdout}`);
});