import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import BarberDashboard from "@/components/BarberDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { isLoggedIn, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <BarberDashboard />
  );
}
