import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { queueService } from "@/lib/supabase";
import { useSmsNotification } from "@/lib/sms";
import { Queue } from "@shared/schema";
import { format } from "date-fns";
import { CreditCard, Check, Clock, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerCardProps {
  customer: Queue;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const { toast } = useToast();
  const { sendAlmostDoneNotification } = useSmsNotification();
  
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
        description: `Cash verified for ${customer.name}`,
        duration: 2000, // 2 seconds
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
        duration: 2000, // 2 seconds
      });
    },
  });
  
  // Mutation for marking as almost done and sending SMS
  const almostDoneMutation = useMutation({
    mutationFn: () => sendAlmostDoneNotification(customer),
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
        queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
        // Toast is already handled by the useSmsNotification hook
      }
    }
  });
  
  // Mutation for marking as served
  const markServedMutation = useMutation({
    mutationFn: () => queueService.markAsServed(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
      toast({
        title: "Served",
        description: `${customer.name} marked as served`,
        duration: 2000, // 2 seconds
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark as served",
        variant: "destructive",
        duration: 2000, // 2 seconds
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
            {/* Display original phone number format */}
            {customer.phone_number}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 md:ml-4">
          {/* Status badges */}
          {customer.status === "Almost Done" && (
            <Badge variant="secondary" className="rounded-md bg-gray-700 text-gray-300 h-9 px-3 flex items-center">
              Almost Done
            </Badge>
          )}
          
          {/* SMS status badge */}
          {customer.sms_sent === "Yes" && (
            <Badge variant="outline" className="rounded-md bg-blue-900 text-blue-300 h-9 px-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Sent
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
              <MessageSquare className="h-4 w-4 mr-2" />
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
