import express from "express";
import path from "path";
import { createServer } from "http";
import { log } from "./vite";
import { registerRoutes } from "./routes";
import cors from 'cors';

const app = express();

// Enhanced CORS configuration for WebSocket and cross-origin requests
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'Connection', 'Upgrade']
}));

// WebSocket debugging middleware
app.use((req, res, next) => {
  // Enhanced WebSocket debugging for all environments
  if (req.headers.upgrade?.toLowerCase() === 'websocket') {
    console.log('WebSocket upgrade request detected:');
    console.log('- Headers:', JSON.stringify(req.headers));
    console.log('- Path:', req.path);
    console.log('- Environment:', process.env.NODE_ENV || 'development');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API logging
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

// Set up static file serving from the correct build directory
const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
console.log(`Serving static files from: ${distPath}`);

app.use(express.static(distPath));

// Set up API routes
(async () => {
  const server = await registerRoutes(app);

  // Error handling
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Catch-all route for SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Static server started in ${process.env.NODE_ENV || 'development'} mode`);
    log(`Listening on port ${port}`);
    log(`WebSocket server enabled and listening`);
    log(`Serving frontend from ${distPath}`);
  });
})();