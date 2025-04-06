# Render Deployment Guide for Beyond Grooming

This guide explains how to successfully deploy the Beyond Grooming application to Render.com.

## Issue With Default Deployment Process

The application requires dev dependencies for the build process, but Render's default behavior is to run `npm install --production`, which skips these dependencies.

## Solution: Manual Build Command Configuration

When creating your Render service, follow these steps:

1. Create a new **Web Service** on Render
2. Connect your GitHub repository 
3. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `node dist/index.js`

## Required Environment Variables

Configure these environment variables in your Render service:

- `NODE_ENV`: Set to `production`
- `SESSION_SECRET`: Create a secure random string (for session encryption)
- `RENDER_EXTERNAL_HOSTNAME`: Your Render app URL (e.g., `beyondgrooming.onrender.com`)
- `DATABASE_URL`: Your PostgreSQL connection string (uses Neon PostgreSQL serverless)
- `CLICKSEND_API_KEY`: Your ClickSend API key (for SMS notifications)
- `CLICKSEND_USERNAME`: Your ClickSend username (email address)

## Troubleshooting Common Issues

### "Command not found" During Build

If you see errors like `vite: command not found` during build:

1. Go to your Render dashboard
2. Select your service
3. Click on **Manual Deploy**
4. Choose **Clear build cache & deploy**

### Database Connection Issues

If you see database connection errors:

1. Ensure your `DATABASE_URL` is correct and points to a Neon serverless PostgreSQL database
2. Check that the database is not paused (if using Neon's free tier)
3. Verify the IP of your Render service is allowed in Neon's connection settings

### Missing SMS Notifications

If SMS notifications aren't working:

1. Double-check that both `CLICKSEND_API_KEY` and `CLICKSEND_USERNAME` environment variables are set
2. Verify the values match your ClickSend account
3. Ensure you have credit available in your ClickSend account