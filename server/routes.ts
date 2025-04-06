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
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
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
    const message = `Hi ${name}, it's Beyond Grooming✂️💈

Just a heads-up – there's 1 person ahead of you in the queue! You've got 15 minutes to arrive and secure your spot in the chair.

Don't lose your deposit – make it on time!

See you soon!`;
    
    // Format phone number (add country code if needed)
    let formattedPhone = phoneNumber.trim();
    
    // Handle various UK number formats
    // Remove all spaces, dashes, parentheses, and other non-numeric characters except +
    formattedPhone = formattedPhone.replace(/[^0-9+]/g, '');
    
    // If it already has +44, keep it as is
    if (formattedPhone.startsWith('+44')) {
      // Already in international format
    }
    // If it starts with 44, add a plus
    else if (formattedPhone.startsWith('44')) {
      formattedPhone = '+' + formattedPhone;
    }
    // If it starts with 07, convert to +44
    else if (formattedPhone.startsWith('07')) {
      formattedPhone = '+44' + formattedPhone.substring(1);
    }
    // If it doesn't have a country code but starts with 7 (omitting the leading 0)
    else if (formattedPhone.startsWith('7') && formattedPhone.length === 10) {
      formattedPhone = '+44' + formattedPhone;
    }
    
    console.log(`Formatted phone number: ${phoneNumber} → ${formattedPhone}`)
    
    const payload = {
      messages: [
        {
          body: message,
          to: formattedPhone,
          from: "Beyond Grooming"
        }
      ]
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("SMS API error:", errorData);
      return { success: false, message: "Failed to send SMS" };
    }
    
    const data = await response.json();
    console.log("SMS sent successfully:", data);
    return { success: true, message: "SMS sent successfully" };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, message: "Failed to send SMS" };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware for barber login
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'beyond-grooming-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000 // 24 hours
    })
  }));
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      next();
    } else {
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
      res.clearCookie('connect.sid');
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
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add the client to our clients array
    clients.push(ws);
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Send initial state
    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));
  });
  
  return httpServer;
}
