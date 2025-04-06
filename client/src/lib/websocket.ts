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
    
    // Reset connection attempts if manually reconnecting
    if (isManualReconnect) {
      this.connectionAttempts = 0;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
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
      
      // If we receive a queue update notification
      if (data.type === "QUEUE_UPDATE") {
        console.log("Queue update received:", data);
        
        // Invalidate queue data in the React Query cache
        queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
        queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
        
        // Notify all listeners
        this.notifyListeners();
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent) {
    console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
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
  // Connect to WebSocket when component mounts
  useEffect(() => {
    webSocketManager.connect();
    
    // Subscribe to updates if a callback is provided
    let unsubscribe: Unsubscribe | undefined;
    if (callback) {
      unsubscribe = webSocketManager.subscribe(callback);
    }
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [callback]);
  
  // Return the websocket manager for manual operations
  return webSocketManager;
}