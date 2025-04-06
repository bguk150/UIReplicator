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
    
    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    
    // For render.com deployments, we need to ensure we're using the right domain
    // Render uses .onrender.com domains and WebSockets need to connect to the same domain
    const wsUrl = `${protocol}//${host}/ws`;
    
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
  
  // Schedule a reconnection attempt
  private scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    
    this.connectionAttempts++;
    
    if (this.connectionAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 30000);
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.connectionAttempts})`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    } else {
      console.log("Maximum reconnection attempts reached. Giving up.");
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