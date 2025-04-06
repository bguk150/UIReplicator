import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueService } from "@/lib/supabase";
import { Queue } from "@shared/schema";
import { RefreshCw, Users, Clock, Mail, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import CustomerCard from "@/components/CustomerCard";
import { useToast } from "@/hooks/use-toast";
import { useQueueUpdates } from "@/lib/websocket";

export default function BarberDashboard() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Set up queue updates via WebSocket
  const websocket = useQueueUpdates(useCallback(() => {
    // This callback runs when WebSocket receives updates
    refetchQueue();
    refetchStats();
    
    toast({
      title: "Queue Updated",
      description: "New changes have arrived",
      duration: 10000, // 10 seconds
    });
  }, []));
  
  // Effect to monitor WebSocket connection status
  useEffect(() => {
    // Check connection status every 5 seconds
    const intervalId = setInterval(() => {
      const isConnected = websocket.socket?.readyState === WebSocket.OPEN;
      setWsConnected(isConnected);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [websocket]);
  
  // Query for fetching queue data
  const { 
    data: queueData, 
    isLoading: isQueueLoading,
    refetch: refetchQueue
  } = useQuery<Queue[]>({
    queryKey: ['/api/queue', refreshKey],
    refetchInterval: wsConnected ? false : 30000, // Only poll if WebSocket is down
    initialData: [], // Default empty array to avoid type errors
  });
  
  // Query for queue stats
  const { 
    data: statsData, 
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery<{ waiting: number, almostDone: number, total: number }>({
    queryKey: ['/api/queue/stats', refreshKey],
    refetchInterval: wsConnected ? false : 30000, // Only poll if WebSocket is down
    initialData: { waiting: 0, almostDone: 0, total: 0 }, // Default values
  });
  
  // Handle manual refresh
  const handleRefresh = async () => {
    toast({
      title: "Refreshing queue...",
      description: "Getting the latest data",
      duration: 10000, // 10 seconds
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
        duration: 10000, // 10 seconds
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
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
            <StatsCard 
              title="Total" 
              value={statsData?.total || 0} 
              icon={<Mail className="text-purple-400" />} 
              iconColor="purple"
            />
          </>
        )}
      </div>
      
      {/* Customer Queue */}
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
    </div>
  );
}
