import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queueService } from "@/lib/supabase";
import { Queue } from "@shared/schema";
import { RefreshCw, Users, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import CustomerCard from "@/components/CustomerCard";
import { useToast } from "@/hooks/use-toast";

export default function BarberDashboard() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Query for fetching queue data
  const { 
    data: queueData, 
    isLoading: isQueueLoading,
    refetch: refetchQueue
  } = useQuery({
    queryKey: ['/api/queue', refreshKey],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  
  // Query for queue stats
  const { 
    data: statsData, 
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/queue/stats', refreshKey],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  
  // Handle manual refresh
  const handleRefresh = async () => {
    toast({
      title: "Refreshing queue...",
      description: "Getting the latest data",
    });
    
    try {
      await refetchQueue();
      await refetchStats();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh queue data",
        variant: "destructive",
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
      
      <div className="flex justify-end mb-4">
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
