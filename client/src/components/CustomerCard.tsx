import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { queueService } from "@/lib/supabase";
import { smsService } from "@/lib/sms";
import { Queue } from "@shared/schema";
import { format } from "date-fns";
import { CreditCard, Check, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerCardProps {
  customer: Queue;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const { toast } = useToast();
  
  // Format check-in time to HH:MM:SS
  const formattedTime = format(new Date(customer.check_in_time), "HH:mm:ss");
  
  // Mutation for verifying cash payment
  const verifyCashMutation = useMutation({
    mutationFn: () => queueService.verifyCashPayment(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
      toast({
        title: "Payment verified",
        description: `Cash payment verified for ${customer.name}`,
        duration: 10000, // 10 seconds
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify payment",
        variant: "destructive",
        duration: 10000, // 10 seconds
      });
    },
  });
  
  // Mutation for marking as almost done (sends SMS)
  const almostDoneMutation = useMutation({
    mutationFn: () => smsService.sendAlmostDoneNotification(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
      toast({
        title: "SMS sent",
        description: `Customer ${customer.name} has been notified`,
        duration: 10000, // 10 seconds
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send SMS",
        variant: "destructive",
        duration: 10000, // 10 seconds
      });
    },
  });
  
  // Mutation for marking as served
  const markServedMutation = useMutation({
    mutationFn: () => queueService.markAsServed(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
      toast({
        title: "Customer served",
        description: `${customer.name} has been marked as served`,
        duration: 10000, // 10 seconds
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as served",
        variant: "destructive",
        duration: 10000, // 10 seconds
      });
    },
  });
  
  return (
    <div className="p-5 rounded-xl shadow-lg gradient-card">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{customer.name}</h3>
          <div className="mb-3 flex items-center">
            <Clock className="text-gray-400 h-4 w-4 mr-2" />
            <span className="text-gray-300">Check-in: {formattedTime}</span>
          </div>
          <div className="flex items-center mb-2">
            {customer.payment_method === "Cash" ? (
              <>
                <CreditCard className={`h-4 w-4 mr-2 ${
                  customer.payment_verified === "Yes" ? "text-green-400" : "text-yellow-400"
                }`} />
                <span className="text-gray-300">
                  Cash {customer.payment_verified === "Yes" ? "✓" : "(Not Verified)"}
                </span>
              </>
            ) : (
              <>
                <CreditCard className="text-blue-400 h-4 w-4 mr-2" />
                <span className="text-gray-300">Card</span>
              </>
            )}
          </div>
          <div className="mb-2 text-gray-300">{customer.service_type}</div>
          <div className="text-gray-300 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            {customer.phone_number}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 md:ml-4">
          {/* Status badge */}
          {customer.status === "Almost Done" && (
            <Badge variant="secondary" className="rounded-md bg-gray-700 text-gray-300 h-9 px-3 flex items-center">
              Almost Done
            </Badge>
          )}
          
          {/* Cash verification button (only for cash payments that aren't verified) */}
          {customer.payment_method === "Cash" && customer.payment_verified === "No" && (
            <Button 
              variant="outline" 
              size="sm"
              className="btn-blue"
              onClick={() => verifyCashMutation.mutate()}
              disabled={verifyCashMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Verify Cash
            </Button>
          )}
          
          {/* Almost Done button (only if not already almost done) */}
          {customer.status !== "Almost Done" && (
            <Button 
              variant="outline" 
              size="sm"
              className="btn-yellow"
              onClick={() => almostDoneMutation.mutate()}
              disabled={almostDoneMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Almost Done
            </Button>
          )}
          
          {/* Mark as Served button */}
          <Button 
            variant="outline" 
            size="sm"
            className="btn-green"
            onClick={() => markServedMutation.mutate()}
            disabled={markServedMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Served
          </Button>
        </div>
      </div>
    </div>
  );
}
