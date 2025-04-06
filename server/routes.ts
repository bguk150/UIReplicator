import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, queueFormSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend the Express Session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}
import { WebSocketServer, WebSocket } from "ws";

// Store connected WebSocket clients
const clients: WebSocket[] = [];

// Function to broadcast queue updates to all connected clients
function broadcastQueueUpdate() {
  const message = JSON.stringify({
    type: "QUEUE_UPDATE",
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasting queue update to ${clients.length} clients`);
  
  // Track connected and disconnected clients to clean up the array
  let connectedCount = 0;
  let disconnectedCount = 0;
  
  // Send to all connected clients with proper error handling
  clients.forEach((client, index) => {
    try {
      // Only send to clients that are in OPEN state
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        connectedCount++;
      } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
        // Mark closed clients for potential cleanup
        disconnectedCount++;
      }
    } catch (error) {
      console.error(`Error broadcasting to client ${index}:`, error);
      // If an error occurs during send, we should consider this client disconnected
      disconnectedCount++;
    }
  });
  
  console.log(`Broadcast complete: ${connectedCount} connected, ${disconnectedCount} disconnected`);
  
  // Periodically clean up the clients array to remove closed connections
  // This prevents memory leaks from accumulating disconnected clients
  if (disconnectedCount > 0 && clients.length > 10) {
    // Only do cleanup if we have some disconnected clients and the array is getting large
    const activeClients = clients.filter(client => 
      client.readyState !== WebSocket.CLOSED && 
      client.readyState !== WebSocket.CLOSING
    );
    
    // Update the global clients array with only active connections
    if (activeClients.length < clients.length) {
      console.log(`WebSocket cleanup: Removed ${clients.length - activeClients.length} disconnected clients`);
      // Replace the array contents without changing the reference
      clients.length = 0;
      activeClients.forEach(client => clients.push(client));
    }
  }
}

// Function to send SMS using ClickSend API
async function sendSMS(phoneNumber: string, name: string): Promise<{ success: boolean, message: string }> {
  try {
    // Use environment variables for API credentials
    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;
    
    if (!username || !apiKey) {
      console.error("Missing ClickSend API credentials");
      return { success: false, message: "Missing API credentials" };
    }
    
    const url = "https://rest.clicksend.com/v3/sms/send";
    const message = `Beyond Grooming: Hi ${name}, you're almost up! Only 1 person ahead in the queue. Please arrive within 15 minutes to keep your spot. Thank you!`;
    
    // Format phone number to always use +44 for UK numbers
    let formattedPhone = phoneNumber.trim();
    
    // Remove all spaces, dashes, parentheses, and other non-numeric characters except +
    formattedPhone = formattedPhone.replace(/[^0-9+]/g, '');
    
    // Converting all UK numbers to +44 format for SMS sending
    
    // If the number starts with 7, it's a UK number without the leading 0 or country code
    if (formattedPhone.startsWith('7') && (formattedPhone.length === 10 || formattedPhone.length === 11)) {
      formattedPhone = '+44' + formattedPhone.replace(/^0+/, '');
    } 
    // If it starts with 07, it's a UK number with the leading 0
    else if (formattedPhone.startsWith('07')) {
      formattedPhone = '+44' + formattedPhone.substring(1);
    }
    // If it starts with 44, add a plus
    else if (formattedPhone.startsWith('44')) {
      formattedPhone = '+' + formattedPhone;
    }
    // If it already has +44, keep it as is
    else if (formattedPhone.startsWith('+44')) {
      // Already correct
    } 
    // For any other format, assume it's a UK number and try to format it correctly
    else if (!formattedPhone.startsWith('+')) {
      // Remove any leading zeros
      formattedPhone = formattedPhone.replace(/^0+/, '');
      formattedPhone = '+44' + formattedPhone;
    }
    
    console.log(`Sending SMS to: ${formattedPhone}`);
    console.log(`SMS Message: ${message}`);
    
    // ClickSend's exact expected format for API request
    const payload = {
      "messages": [
        {
          "source": "nodejs",
          "body": message,
          "to": formattedPhone,
          "from": "BGrooming",
          "schedule": 0,
          "custom_string": ""
        }
      ]
    };
    
    console.log("SMS Payload:", JSON.stringify(payload));
    
    // Use proper Basic Auth format for ClickSend
    const authString = Buffer.from(`${username}:${apiKey}`).toString("base64");
    console.log("Using Auth Credentials:", username, "API key length:", apiKey?.length || 0);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log("SMS API Response Status:", response.status);
    const responseData = await response.text();
    console.log("SMS API Raw Response:", responseData);
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseData);
    } catch (e) {
      console.error("Failed to parse API response as JSON:", e);
      return { success: false, message: "Invalid API response format" };
    }
    
    // Check ClickSend's specific response format
    if (jsonData.http_code && jsonData.http_code >= 200 && jsonData.http_code < 300) {
      console.log("SMS sent successfully:", jsonData);
      return { success: true, message: "SMS sent successfully" };
    } else {
      console.error("SMS API error:", jsonData);
      return { 
        success: false, 
        message: jsonData.response_msg || "Failed to send SMS" 
      };
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, message: "Failed to send SMS" };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware for barber login
  
  // Force detection of production environment based on multiple signals
  // This ensures we pick up both NODE_ENV and Render's specific environment
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    !!process.env.RENDER || 
    !!process.env.RENDER_EXTERNAL_URL;
  
  // Special handling for Render.com deployment
  const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;
  
  console.log(`Environment detected: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}${isRender ? ' (Render)' : ''}`);
  console.log(`Node ENV: ${process.env.NODE_ENV}`);
  
  // Force use PostgreSQL session store in production
  if (isProduction && process.env.DATABASE_URL) {
    try {
      console.log('Initializing PostgreSQL session store for production');
      
      // Import the PostgreSQL session store
      const { default: connectPgSimple } = await import('connect-pg-simple');
      const PgSession = connectPgSimple(session);
      
      // Create the store with detailed options
      const pgStore = new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        tableName: 'session', // Default table name
        pruneSessionInterval: 60 * 15, // Clean up expired sessions every 15 minutes
        errorLog: (err) => console.error('Session store error:', err)
      });
      
      // Test the connection to the session store
      await new Promise<void>((resolve, reject) => {
        pgStore.pruneSessions((err) => {
          if (err) {
            console.error('Failed to initialize session store:', err);
            reject(err);
          } else {
            console.log('PostgreSQL session store initialized successfully');
            resolve();
          }
        });
      });
      
      // Configure session with the PostgreSQL store
      app.use(session({
        store: pgStore,
        secret: process.env.SESSION_SECRET || 'beyond-grooming-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction, // Use secure cookies in production
          sameSite: isProduction ? 'none' : 'lax', // Proper cross-site cookie handling
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: '/',
          httpOnly: true,
          // Render.com specific cookie settings for production security
          ...(isRender ? {
            domain: process.env.RENDER_EXTERNAL_HOSTNAME || undefined
          } : {})
        },
        name: 'beyond.sid' // Custom name to avoid the default connect.sid
      }));
      
      console.log('PostgreSQL session middleware configured');
    } catch (err) {
      console.error('Error setting up PostgreSQL session store:', err);
      // Fallback to MemoryStore only as a last resort with warning
      console.error('WARNING: Falling back to MemoryStore for sessions. This is not recommended for production!');
      setupMemoryStore();
    }
  } else {
    console.log('Using MemoryStore for development environment');
    setupMemoryStore();
  }
  
  // Helper function to set up MemoryStore (used for development or as fallback)
  function setupMemoryStore() {
    const SessionStore = MemoryStore(session);
    app.use(session({
      secret: process.env.SESSION_SECRET || 'beyond-grooming-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction, // Secure in production, non-secure in dev
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
        httpOnly: true,
        // Render.com specific cookie settings for production security
        ...(isRender ? {
          domain: process.env.RENDER_EXTERNAL_HOSTNAME || undefined
        } : {})
      },
      store: new SessionStore({
        checkPeriod: 86400000 // 24 hours
      }),
      name: 'beyond.sid' // Custom name to avoid the default connect.sid
    }));
  }
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    console.log('Auth check:', {
      hasSession: !!req.session,
      userId: req.session?.userId,
      path: req.path
    });
    
    if (req.session?.userId) {
      next();
    } else {
      console.log('Auth failed:', req.path);
      res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  // LOGIN ROUTES
  
  // Login route
  app.post('/api/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.verifyUserCredentials(data.username, data.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      return res.status(200).json({ message: "Login successful" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Logout route
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      // Clear both possible cookie names to ensure logout works
      res.clearCookie('beyond.sid');
      res.clearCookie('connect.sid'); // Keep this for backward compatibility
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Get current session user
  app.get('/api/auth/session', (req, res) => {
    if (req.session.userId) {
      return res.status(200).json({ 
        isLoggedIn: true, 
        username: req.session.username 
      });
    }
    return res.status(200).json({ isLoggedIn: false });
  });
  
  // QUEUE MANAGEMENT ROUTES
  
  // Add customer to queue
  app.post('/api/queue', async (req, res) => {
    try {
      const data = queueFormSchema.parse(req.body);
      
      // Check if phone number already exists in active queue (not served)
      const activeQueue = await storage.getQueueByStatus("Waiting");
      const almostDoneQueue = await storage.getQueueByStatus("Almost Done");
      
      // Combine both "Waiting" and "Almost Done" customers for the check
      const activeCustomers = [...activeQueue, ...almostDoneQueue];
      
      // Check if phone number already exists in active queue
      const existingCustomer = activeCustomers.find(
        customer => customer.phone_number === data.phone_number
      );
      
      if (existingCustomer) {
        return res.status(400).json({ 
          message: "This phone number is already in the queue. Please wait until your turn is complete." 
        });
      }
      
      // Check if the number has checked in 3 times today already
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      // Get all queue entries for this phone number today (including served ones)
      const todaysQueue = await storage.getAllQueueItems();
      const sameDayEntries = todaysQueue.filter(item => 
        item.phone_number === data.phone_number && 
        new Date(item.check_in_time) >= startOfDay
      );
      
      if (sameDayEntries.length >= 3) {
        return res.status(400).json({ 
          message: "You've already checked in 3 times today. Please try again tomorrow." 
        });
      }
      
      // If all checks pass, insert the queue item
      const queueItem = await storage.insertQueueItem(data);
      
      // Broadcast update to all connected clients
      broadcastQueueUpdate();
      
      return res.status(201).json(queueItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to add to queue" });
    }
  });
  
  // Get all queue items (only for authenticated barbers)
  app.get('/api/queue', isAuthenticated, async (req, res) => {
    try {
      console.log("GET /api/queue: Fetching active queue items");
      const queueItems = await storage.getAllQueueItems();
      
      console.log(`GET /api/queue: Returning ${queueItems.length} queue items`);
      
      // Log a sample of what we're returning (first item if exists)
      if (queueItems.length > 0) {
        console.log(`Sample item: ID=${queueItems[0].id}, Name=${queueItems[0].name}, Status=${queueItems[0].status}`);
      }
      
      return res.status(200).json(queueItems);
    } catch (error) {
      console.error("GET /api/queue error:", error);
      return res.status(500).json({ message: "Failed to fetch queue" });
    }
  });
  
  // Get queue stats
  app.get('/api/queue/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getQueueStats();
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Update queue item status (almost done, served, etc)
  app.put('/api/queue/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate id
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Get current queue item
      const currentItem = await storage.getQueueItemById(id);
      if (!currentItem) {
        return res.status(404).json({ message: "Queue item not found" });
      }
      
      // Update queue item
      const updatedItem = await storage.updateQueueItem(id, updates);
      
      // If status is set to "Almost Done", send SMS
      if (updates.status === "Almost Done" && currentItem.status !== "Almost Done") {
        // First update the sms_sent flag in accordance with the workflow
        await storage.updateQueueItem(id, { sms_sent: "Yes" });
        
        // Then send the actual SMS
        const smsResult = await sendSMS(currentItem.phone_number, currentItem.name);
        
        if (!smsResult.success) {
          console.error("Failed to send SMS:", smsResult.message);
          // Continue without failing the request, but log the error
        }
      }
      
      // Broadcast update to all connected clients
      broadcastQueueUpdate();
      
      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating queue item:", error);
      return res.status(500).json({ message: "Failed to update queue item" });
    }
  });
  
  // Verify cash payment
  app.put('/api/queue/:id/verify-payment', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate id
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Get current queue item
      const currentItem = await storage.getQueueItemById(id);
      if (!currentItem) {
        return res.status(404).json({ message: "Queue item not found" });
      }
      
      // Update payment verification status
      const updatedItem = await storage.updateQueueItem(id, { payment_verified: "Yes" });
      
      // Broadcast update to all connected clients
      broadcastQueueUpdate();
      
      return res.status(200).json(updatedItem);
    } catch (error) {
      return res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server with enhanced configuration
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true,
    // Handle CORS for WebSocket connections
    verifyClient: (info, callback) => {
      // Allow all connections in our case
      // You can implement custom verification logic here if needed
      callback(true);
    }
  });
  
  // Track WebSocket connections and their status
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    const clientUrl = req.url;
    console.log(`WebSocket client connected from ${clientIP}, URL: ${clientUrl}`);
    
    // Send initial connection success message
    try {
      ws.send(JSON.stringify({ 
        type: 'CONNECTED', 
        timestamp: new Date().toISOString(),
        message: 'WebSocket connection established'
      }));
    } catch (err) {
      console.error('Error sending initial connection message:', err);
    }
    
    // Handle authentication message
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type);
        
        if (message.type === 'AUTH' && message.token) {
          console.log('WebSocket client authenticated');
          // Mark this connection as authenticated if needed
          
          // Send initial queue state to the newly authenticated client
          broadcastQueueUpdate();
        } else if (message.type === 'PING') {
          // Handle heartbeat/ping messages
          ws.send(JSON.stringify({ 
            type: 'PONG', 
            timestamp: new Date().toISOString() 
          }));
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });
    
    // Add the client to our clients array
    clients.push(ws);
    
    // Handle client disconnect
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected: Code ${code}, Reason: ${reason || 'No reason provided'}`);
      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      console.log(`Total connected clients: ${clients.length}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Log the total number of connected clients
    console.log(`Total connected clients: ${clients.length}`);
  });
  
  return httpServer;
}
