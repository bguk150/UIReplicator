# Render Deployment Guide for Beyond Grooming

This guide outlines the steps required to deploy the Beyond Grooming application on Render.com.

## Prerequisites

Before deploying to Render, make sure you have:

1. A Render.com account
2. A Neon PostgreSQL database (or any PostgreSQL database)
3. ClickSend API credentials (if using SMS notifications)
4. Your GitHub repository with the application code

## Environment Variables

Set the following environment variables in your Render dashboard:

| Variable | Description | Example |
|---------|-------------|---------|
| `NODE_ENV` | Environment setting | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:password@host:port/database` |
| `CLICKSEND_USERNAME` | ClickSend username | `your_username` |
| `CLICKSEND_API_KEY` | ClickSend API key | `your_api_key` |
| `SESSION_SECRET` | Secret for session cookies | `random_string_here` |

## Deployment Steps

1. **Login to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in to your account

2. **Create a New Web Service**
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your Beyond Grooming application

3. **Configure Deployment Settings**
   - Name: `beyond-grooming` (or your preferred name)
   - Region: Choose the region closest to your users
   - Branch: `main` (or your default branch)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `node run-static.js`
   - Plan: Select an appropriate plan (Starter or higher recommended)

4. **Add Environment Variables**
   - Add all the environment variables listed above
   - Make sure `NODE_ENV` is set to `production`

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will start deploying your application

## Verifying Deployment

After deployment is complete:

1. Check the logs for any errors
2. Visit your Render URL (e.g., `https://beyond-grooming.onrender.com`)
3. Verify that:
   - The login page loads correctly
   - You can log in with your credentials
   - The barber dashboard loads with queue data
   - WebSocket connections are working (real-time updates)
   - Database operations are functioning

## Troubleshooting

If you encounter issues:

1. **Database Connection Problems**
   - Verify the `DATABASE_URL` is correct
   - Check that the database is accessible from Render's IP ranges
   - Confirm your database has the necessary tables (run migrations if needed)

2. **WebSocket Connection Issues**
   - Ensure the application is using the correct WebSocket URL
   - Check browser console for WebSocket connection errors

3. **Static File Serving Issues**
   - Verify that the build process completed successfully
   - Check that the `dist/public` directory contains all frontend assets

4. **SMS Notification Problems**
   - Verify your ClickSend credentials
   - Check the logs for API call errors

## Support

If you need assistance with your deployment, please contact:
- Render Support: https://render.com/docs
- Or reach out to your development team for application-specific issues