# Beyond Grooming Barbershop Queue Management System

A modern barbershop queue management system that provides comprehensive service booking and management tools for barbershop owners, with intelligent features for enhancing customer experience and operational efficiency.

## Features

- Real-time queue updates with WebSocket communication
- SMS notifications for customers when they're almost up
- Barber dashboard with current queue status
- Customer check-in page with service selection
- Payment verification system (Cash/Card)
- Authentication system for barbers
- Mobile-friendly responsive design

## Technology Stack

- React frontend with Tailwind CSS and shadcn/ui components
- Express.js backend with WebSocket support
- PostgreSQL database (managed by Neon serverless)
- ClickSend SMS integration for customer notifications

## Launch Options

Due to the unique requirements of this application and Replit's workflow system, we've provided several launch options:

### 1. Quick Start (Recommended)

```bash
./start-beyond-grooming.sh
```

This script will:
- Use the existing build if available
- Start the server in production mode
- Connect to the PostgreSQL database
- Initialize the WebSocket server

### 2. Rebuild and Start

```bash
./rebuild-and-start.sh
```

Use this when you've made changes and need to rebuild the application before starting.

### 3. Manual Options

```bash
# Run the static server directly
node dist/static-server.js

# Build and run via the run-static.js script
node run-static.js

# Use the replit-workflow.js script
node replit-workflow.js
```

## Default Credentials

- Username: beyondgroominguk@gmail.com
- Password: bg_uk123

## Environment Variables

The following environment variables are required:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" for production mode
- `SESSION_SECRET`: Secret for session encryption
- `CLICKSEND_USERNAME`: ClickSend API username
- `CLICKSEND_API_KEY`: ClickSend API key

## Troubleshooting

If you encounter issues:
1. Try the rebuild script: `./rebuild-and-start.sh`
2. Check database connection in the logs
3. Verify WebSocket initialization in the logs

## Deployment

This application is designed to be deployed on Render.com or similar platforms.
A complete deployment guide is available in the `RENDER-DEPLOYMENT-GUIDE.md` file.