import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueService } from "@/lib/supabase";
import { Queue } from "@shared/schema";
import { RefreshCw, Users, Clock, Wifi, WifiOff, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CustomerCard from "@/components/CustomerCard";
import CustomerDatabase from "@/components/CustomerDatabase";
import { useToast } from "@/hooks/use-toast";
import { useQueueUpdates } from "@/lib/websocket";

export default function BarberDashboard() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");

  // Set up queue updates via WebSocket
  const websocket = useQueueUpdates(useCallback(() => {
    // This callback runs when WebSocket receives updates
    refetchQueue();
    refetchStats();

    toast({
      title: "Queue Updated",
      description: null, // Removing description for cleaner notification
      duration: 1000, // 1 second
    });
  }, []));

  // Effect to monitor WebSocket connection status with improved handling
  useEffect(() => {
    // Function to check connection and update state
    const checkConnection = () => {
      const isConnected = websocket.socket?.readyState === WebSocket.OPEN;
      
      // Only update state if connection status has changed
      // This prevents unnecessary re-renders
      if (isConnected !== wsConnected) {
        setWsConnected(isConnected);
        
        // Log status change for debugging
        console.log(`WebSocket connection status changed to: ${isConnected ? 'connected' : 'disconnected'}`);
        
        // If we've just detected disconnection, try to reconnect
        if (!isConnected && websocket.socket) {
          console.log('Attempting to reconnect WebSocket...');
          websocket.connect(true); // Force reconnection
        }
      }
    };
    
    // Initial check
    checkConnection();
    
    // Check connection status every 3 seconds
    const intervalId = setInterval(checkConnection, 3000);

    return () => clearInterval(intervalId);
  }, [websocket, wsConnected]);

  // Query for fetching queue data
  const { 
    data: queueData, 
    isLoading: isQueueLoading,
    refetch: refetchQueue
  } = useQuery<Queue[]>({
    queryKey: ['/api/queue', refreshKey],
    refetchInterval: wsConnected ? false : 30000, // Only poll if WebSocket is down
    staleTime: 5000, // Reduced stale time for more frequent updates
    initialData: [], // Default empty array to avoid type errors
    retry: 5, // Increased retries
    refetchOnWindowFocus: true, // Refresh when user focuses the window
    refetchOnMount: true, // Refresh when component mounts
    // Remove unsupported onError option and use global error handler
  });

  // Query for queue stats
  const { 
    data: statsData, 
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery<{ waiting: number, almostDone: number, total: number }>({
    queryKey: ['/api/queue/stats', refreshKey],
    refetchInterval: 30000, // Poll every 30 seconds regardless of WebSocket
    staleTime: 10000, // Keep data fresh for at least 10 seconds
    initialData: { waiting: 0, almostDone: 0, total: 0 }, // Default values
    retry: 3, // Retry failed requests 3 times
    refetchOnWindowFocus: true, // Refresh when user focuses the window
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    toast({
      title: "Refreshing queue...",
      description: null,
      duration: 1000, // 1 second
    });

    try {
      await refetchQueue();
      await refetchStats();
      setRefreshKey(prev => prev + 1);

      // Also try to reconnect WebSocket if it's down
      if (!wsConnected) {
        websocket.connect(true); // true indicates manual reconnection
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh queue data",
        variant: "destructive",
        duration: 1500, // 1.5 seconds - slightly longer for error messages
      });
    }
  };

  // Format the queue data to display active customers first
  const sortedQueue = queueData ? [...queueData].sort((a, b) => {
    // First, sort by status (Waiting first, then Almost Done)
    if (a.status === "Waiting" && b.status !== "Waiting") return -1;
    if (a.status !== "Waiting" && b.status === "Waiting") return 1;

    // Then by check-in time (oldest first)
    return new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime();
  }) : [];

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">Barber Dashboard</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {wsConnected ? (
            <div className="flex items-center text-green-500">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="text-sm">Live updates</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-500">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-sm">Auto-refresh every 30s</span>
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <StatsCard 
              title="Waiting" 
              value={statsData?.waiting || 0} 
              icon={<Users className="text-blue-400" />} 
              iconColor="blue"
            />
            <StatsCard 
              title="Almost Done" 
              value={statsData?.almostDone || 0} 
              icon={<Clock className="text-yellow-400" />} 
              iconColor="yellow"
            />
          </>
        )}
      </div>

      {/* Shadcn Tabs Component */}
      <Tabs 
        defaultValue="queue" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4 justify-center">
          <TabsTrigger value="queue" className="flex items-center justify-center gap-2 py-2">
            <Users className="h-4 w-4" />
            Active Queue
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center justify-center gap-2 py-2">
            <ClipboardList className="h-4 w-4" />
            Customer Database
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="border p-4 rounded-lg bg-gray-800 mt-2">
          <h2 className="text-xl font-bold mb-4">Active Queue</h2>
          <div className="space-y-5">
            {isQueueLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : sortedQueue.length > 0 ? (
              sortedQueue.map((customer: Queue) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))
            ) : (
              <div className="p-5 rounded-xl shadow-lg gradient-card text-center">
                <p className="text-lg text-gray-300">No customers in the queue</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="database" className="border p-4 rounded-lg bg-gray-800 mt-2">
          <CustomerDatabase />
        </TabsContent>
      </Tabs>
    </div>
  );
}