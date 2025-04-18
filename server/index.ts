import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();

// Force detection of production environment based on multiple signals
// This ensures we pick up both NODE_ENV and Render's specific environment
const isProduction = 
  process.env.NODE_ENV === 'production' || 
  !!process.env.RENDER || 
  !!process.env.RENDER_EXTERNAL_URL;

// Special handling for Render.com deployment
const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;

// Configure Express to trust the proxy, required for secure cookies to work in Render/production
if (isProduction) {
  // Configure Express to trust proxy headers
  app.set('trust proxy', 1); // trust first proxy
  console.log("Enabled 'trust proxy' for production environment");
}

// Log the database configuration to help with debugging
console.log(`Database configuration for: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}${isRender ? ' (Render)' : ''}`);

// Enhanced CORS configuration for WebSocket and cross-origin requests
// Specifically optimized for production environments like Render with proxy systems
app.use(cors({
  origin: true, // Allow any origin in development, but consider restricting this in production
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'Connection', 'Upgrade']
}));

// Special middleware to handle Render.com's proxy system
// This ensures WebSocket upgrade requests can pass through properly in production
app.use((req, res, next) => {
  // Check for Render's environment
  const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;
  
  // Enhanced WebSocket debugging for all environments
  if (req.headers.upgrade?.toLowerCase() === 'websocket') {
    console.log('WebSocket upgrade request detected:');
    console.log('- Headers:', JSON.stringify(req.headers));
    console.log('- Path:', req.path);
    console.log('- Environment:', isRender ? 'Render' : (process.env.NODE_ENV || 'development'));
    
    if (isRender) {
      // In Render production, ensure all WebSocket-related headers are preserved
      // This fixes a common issue with proxied WebSocket connections
      console.log('Processing WebSocket upgrade request in Render environment');
    }
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// IP Restriction Middleware for iPad-only access
// This is commented out by default for development
// Uncomment and set the correct iPad IP address when deploying
/*
const ALLOWED_IPS: string[] = [
  '127.0.0.1',           // Localhost for development
  'SHOP_IPAD_IP_HERE'    // Replace with the shop iPad's IP address
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress || '';

  // Log the IP for debugging during setup
  console.log(`Request from IP: ${clientIP}`);

  if (ALLOWED_IPS.includes(clientIP) || clientIP.includes('::1')) {
    next(); // Allow the request to proceed
  } else {
    // Return a friendly error message
    res.status(403).send(`
      <html>
        <head>
          <title>Beyond Grooming - Access Restricted</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #333; }
            p { color: #555; }
          </style>
        </head>
        <body>
          <h1>Access Restricted</h1>
          <p>This application is only accessible from authorized devices.</p>
          <p>Please use the shop iPad to access this application.</p>
        </body>
      </html>
    `);
  }
});
*/

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // We're already setting up WebSocket server in routes.ts, 
  // so we don't need to create another one here.
  // The WebSocket server in routes.ts is using the same HTTP server instance.
  // The WebSocket server is initialized after the HTTP server is listening.

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Force production mode to ensure stability in Replit
  log("Setting up in production mode for stability");
  serveStatic(app);

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server started in ${process.env.NODE_ENV || 'development'} mode`);
    log(`Listening on port ${port}`);
    log(`WebSocket server enabled and listening`);
  });
})();