// WebSocket client for real-time updates
import { queryClient } from "./queryClient";
import { useEffect, useRef } from "react";

// Observable interface for WebSocket event subscribers
type Listener = () => void;
type Unsubscribe = () => void;

class WebSocketManager {
  socket: WebSocket | null = null; // Made public for connection status checks
  private reconnectTimer: number | null = null;
  private listeners: Set<Listener> = new Set();
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Initialize WebSocket connection
  connect(isManualReconnect = false) {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    
    // Close any existing socket that's in a bad state
    if (this.socket) {
      // Clean up existing heartbeat timer first
      if ((this.socket as any).heartbeatTimer) {
        clearInterval((this.socket as any).heartbeatTimer);
        (this.socket as any).heartbeatTimer = null;
      }
      
      try {
        this.socket.close();
      } catch (err) {
        console.error('Error closing socket:', err);
      }
      this.socket = null;
    }

    // Reset connection attempts on manual reconnect
    if (isManualReconnect) {
      console.log('Manual reconnect triggered - resetting connection attempts');
      this.connectionAttempts = 0;
    }
    
    // Clear any pending reconnection timer
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check max attempts
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached. Using HTTP fallback.");
      // Force refresh data through HTTP as fallback
      this.refreshQueueData();
      return;
    }
    
    // Get WebSocket URL dynamically based on the current environment
    const getWebSocketUrl = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      
      // Enhanced production environment detection
      const isRender = window.location.hostname.includes('onrender.com');
      const isReplit = window.location.hostname.includes('replit.app');
      const isProduction = isRender || isReplit || window.location.hostname.includes('render.com');
      
      // Enhanced logging for all environments
      console.log('Current environment:', {
        hostname: window.location.hostname,
        isProduction,
        isRender,
        isReplit,
        protocol,
        host
      });
      
      if (isProduction) {
        // For production, add a longer timeout and more reconnection attempts
        this.maxReconnectAttempts = 15; // Increase for more persistent reconnections in production
        
        if (isRender) {
          // For Render, always use wss:// protocol and the exact host with explicit /ws path
          // This is critical for Render's proxy system
          const renderHost = host;
          console.log('Using Render-specific WebSocket URL with explicit /ws path');
          return `wss://${renderHost}/ws`;
        } else if (isReplit) {
          // For Replit, use the host with explicit /ws path
          console.log('Using Replit-specific WebSocket URL');
          return `${protocol}//${host}/ws`;
        } else {
          // For other production environments
          console.log('Using generic production WebSocket URL');
          return `${protocol}//${host}/ws`;
        }
      } else {
        // Standard development environment
        console.log('Using development WebSocket URL');
        return `${protocol}//${host}/ws`;
      }
    };
    
    // Get the appropriate WebSocket URL for the current environment
    const wsUrl = getWebSocketUrl();
    
    console.log('Connecting to WebSocket at:', wsUrl); // Debug log
    
    try {
      // Get auth token from current session cookie (check both possible names)
      const token = document.cookie.split('; ').find(row => 
        row.startsWith('beyond.sid') || row.startsWith('connect.sid')
      )?.split('=')[1];
      
      // Create new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up a socket-specific heartbeat timer after connection establishment
      this.socket.addEventListener('open', () => {
        // Create a heartbeat timer for this specific socket
        const heartbeatTimer = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            try {
              this.socket.send(JSON.stringify({ 
                type: 'PING', 
                timestamp: new Date().toISOString() 
              }));
              console.log('Socket-specific heartbeat sent');
            } catch (error) {
              console.error('Failed to send socket heartbeat:', error);
            }
          } else {
            // If socket is no longer open, clear this timer
            clearInterval(heartbeatTimer);
          }
        }, 25000); // Every 25 seconds
        
        // Store timer for cleanup
        (this.socket as any).heartbeatTimer = heartbeatTimer;
      });
      
      // Set up authentication after connection is established
      if (token) {
        this.socket.addEventListener('open', () => {
          console.log('WebSocket open, sending auth token');
          this.socket?.send(JSON.stringify({ 
            type: 'AUTH', 
            token,
            timestamp: new Date().toISOString()
          }));
        });
      }
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
      // Force refresh data through HTTP as fallback
      this.refreshQueueData();
    }
  }
  
  // Handle WebSocket open event
  private handleOpen() {
    console.log("WebSocket connected");
    this.connectionAttempts = 0;
  }
  
  // Handle incoming WebSocket messages
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      switch (data.type) {
        case "QUEUE_UPDATE":
          console.log("Queue update received:", data);
          
          // Invalidate queue data in the React Query cache
          queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
          queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
          
          // Notify all listeners
          this.notifyListeners();
          break;
          
        case "CONNECTED":
          console.log("Connection confirmation received:", data.message || "Connected to server");
          // Reset connection attempts on successful connection
          this.connectionAttempts = 0;
          break;
          
        case "AUTH_SUCCESS":
          console.log("Authentication successful:", data.message || "Authenticated with server");
          // Mark connection as authenticated
          (this.socket as any).isAuthenticated = true;
          
          // Force refresh data since we're now authenticated
          this.refreshQueueData();
          break;
          
        case "PONG":
          // Received a pong response from the server (heartbeat response)
          console.log("Heartbeat pong received");
          // Connection is healthy, no action needed
          break;
          
        default:
          console.log("Received message of unknown type:", data.type);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent) {
    console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
    
    // Clean up heartbeat timer if it exists
    if (this.socket && (this.socket as any).heartbeatTimer) {
      clearInterval((this.socket as any).heartbeatTimer);
      (this.socket as any).heartbeatTimer = null;
    }
    
    this.socket = null;
    
    // Try to reconnect if not closed normally
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  // Handle WebSocket error
  private handleError(event: Event) {
    console.error("WebSocket error:", event);
    // The socket will close after an error, which will trigger handleClose
  }
  
  // Schedule a reconnection attempt with enhanced production capabilities
  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    
    this.connectionAttempts++;
    
    // Enhanced environment detection for specific handling
    const isRender = window.location.hostname.includes('onrender.com');
    const isReplit = window.location.hostname.includes('replit.app');
    const isProduction = isRender || isReplit || window.location.hostname.includes('render.com');
    
    // For production, we'll use a more aggressive reconnection strategy with more attempts
    // Render needs special handling for its proxy system
    const effectiveMaxAttempts = isRender ? 
      this.maxReconnectAttempts + 5 : // Give extra chances specifically for Render
      (isProduction ? this.maxReconnectAttempts + 3 : this.maxReconnectAttempts);
    
    if (this.connectionAttempts <= effectiveMaxAttempts) {
      // Exponential backoff with a maximum delay, but faster initial retries for production
      // This helps get through Render's proxy system which might temporarily break connections
      let delay;
      
      if (isRender) {
        // For Render: extremely aggressive reconnect strategy with very quick initial attempts
        // This helps overcome Render proxy issues with WebSockets
        if (this.connectionAttempts <= 5) {
          // First 5 attempts at 300ms, 600ms, 900ms, 1200ms, 1500ms
          delay = 300 * this.connectionAttempts;
          console.log(`Render-specific rapid reconnect scheduled in ${delay}ms (attempt ${this.connectionAttempts}/${effectiveMaxAttempts})`);
        } else {
          // Then slower exponential backoff
          delay = Math.min(800 * Math.pow(1.3, this.connectionAttempts - 5), 30000);
          console.log(`Render reconnect scheduled in ${delay}ms (attempt ${this.connectionAttempts}/${effectiveMaxAttempts})`);
        }
      } else if (isProduction) {
        // For other production environments: still faster than dev but not as aggressive as Render
        if (this.connectionAttempts <= 3) {
          delay = 500 * this.connectionAttempts;
        } else {
          delay = Math.min(1000 * Math.pow(1.5, this.connectionAttempts - 3), 30000);
        }
        console.log(`Production reconnect scheduled in ${delay}ms (attempt ${this.connectionAttempts}/${effectiveMaxAttempts})`);
      } else {
        // Standard exponential backoff for development
        delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 30000);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.connectionAttempts}/${effectiveMaxAttempts})`);
      }
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        
        // On Render, try a more aggressive approach after multiple failures
        if (isRender && this.connectionAttempts > 6) {
          console.log('Multiple reconnection attempts failed in Render environment');
          console.log('Attempting HTTP fallback and special Render reconnection strategy');
          
          // Force refresh data through HTTP first
          this.refreshQueueData();
          
          // Wait a bit longer before the next connection attempt on Render
          // This gives time for HTTP connections to establish and potentially 
          // "warm up" the connection between client and server
          setTimeout(() => {
            // For Render, explicitly try to reconnect with full retry reset
            this.connectionAttempts = 0;
            this.connect(true);
          }, 1500);
        } 
        // On other production environments, try a full page reload after numerous failed attempts
        else if (isProduction && this.connectionAttempts > 8) {
          console.log('Multiple reconnection attempts failed in production environment');
          console.log('Attempting HTTP fallback for data refresh');
          
          // Before giving up, try one more direct HTTP refresh
          this.refreshQueueData();
          
          // Then try a final reconnection
          this.connect();
        } else {
          // Regular reconnection attempt
          this.connect();
        }
      }, delay);
    } else {
      console.log(`Maximum reconnection attempts (${effectiveMaxAttempts}) reached. Falling back to HTTP polling.`);
      
      // Even after giving up on reconnecting, still refresh data periodically via HTTP
      this.refreshQueueData();
      
      // For Render, make one last attempt after a longer wait
      // Sometimes Render's proxy needs more time to reset connections
      if (isRender) {
        console.log('Scheduling one final reconnection attempt for Render after a longer delay');
        setTimeout(() => {
          this.connectionAttempts = 0; // Reset counter
          this.connect(true); // Try one more time with a clean slate
        }, 10000); // Wait 10 seconds
      }
    }
  }
  
  // Manually disconnect
  disconnect() {
    if (this.socket) {
      // Clean up heartbeat timer if it exists
      if ((this.socket as any).heartbeatTimer) {
        clearInterval((this.socket as any).heartbeatTimer);
        (this.socket as any).heartbeatTimer = null;
      }
      
      this.socket.close(1000, "Normal closure");
      this.socket = null;
    }
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // Subscribe to queue updates
  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  // Notify all listeners of an update
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error("Error in WebSocket listener:", err);
      }
    });
  }
  
  // Force a refresh of the queue data
  refreshQueueData() {
    queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
  }
}

// Create and export singleton instance
export const webSocketManager = new WebSocketManager();

// React hook to use WebSocket in components
export function useQueueUpdates(callback?: Listener) {
  const callbackRef = useRef(callback);
  const initialConnectionRef = useRef(false);
  
  // Update ref whenever callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Only connect once on initial mount
    if (!initialConnectionRef.current) {
      initialConnectionRef.current = true;
      webSocketManager.connect();
    }
    
    // Force an initial data refresh
    webSocketManager.refreshQueueData();
    
    // Set up a heartbeat to keep the WebSocket connection alive
    // This is crucial for production deployments that might terminate inactive connections
    const heartbeatInterval = setInterval(() => {
      if (webSocketManager.socket?.readyState === WebSocket.OPEN) {
        try {
          // Send a ping message to keep the connection alive
          webSocketManager.socket.send(JSON.stringify({ 
            type: 'PING', 
            timestamp: new Date().toISOString() 
          }));
          console.log('Heartbeat ping sent');
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
          // If sending fails, try to reconnect
          webSocketManager.connect(true);
        }
      } else if (webSocketManager.socket?.readyState === WebSocket.CLOSED || 
                 webSocketManager.socket?.readyState === WebSocket.CLOSING || 
                 !webSocketManager.socket) {
        // If socket is closed or in process of closing, try to reconnect
        console.log('WebSocket not connected during heartbeat check, attempting reconnection');
        webSocketManager.connect(true);
      }
    }, 30000); // Every 30 seconds send a heartbeat
    
    // Initial polling setup for data refresh (as backup)
    const periodicRefresh = setInterval(() => {
      // This will only be used as a fallback if WebSocket is not connected
      if (webSocketManager.socket?.readyState !== WebSocket.OPEN) {
        webSocketManager.refreshQueueData();
      }
    }, 60000); // Every 60 seconds as an emergency backup
    
    // Subscribe to updates
    const unsubscribe = webSocketManager.subscribe(() => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    });
    
    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(periodicRefresh);
      unsubscribe();
      // Don't disconnect the WebSocket on component unmount
      // This allows it to stay connected as a singleton
    };
  }, []);
  
  // Return the websocket manager for manual operations
  return webSocketManager;
}