import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { queueService } from "@/lib/supabase";
import { useSmsNotification } from "@/lib/sms";
import { Queue } from "@shared/schema";
import { format } from "date-fns";
import { CreditCard, Check, Clock, Phone, MessageSquare, Scissors } from "lucide-react";
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
  
  // Mutation for verifying any payment (cash or card)
  const verifyPaymentMutation = useMutation({
    mutationFn: () => queueService.verifyCashPayment(customer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue/stats'] });
      toast({
        title: customer.payment_method === "Cash" ? "Cash Verified" : "Card Verified",
        description: null, // No description for cleaner notification
        duration: 1000, // 1 second
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: null,
        variant: "destructive",
        duration: 1500, // 1.5 seconds for error messages
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
        description: null,
        duration: 1000, // 1 second
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: null,
        variant: "destructive",
        duration: 1500, // 1.5 seconds for error messages
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
                <CreditCard className={`h-4 w-4 mr-2 ${
                  customer.payment_verified === "Yes" ? "text-green-400" : "text-blue-400"
                }`} />
                <span className="text-gray-300">
                  Card {customer.payment_verified === "Yes" ? "✓" : "(Not Verified)"}
                </span>
              </>
            )}
          </div>
          <div className="mb-2 flex flex-col">
            <div className="flex items-center">
              <Scissors className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-300">{customer.service_type}</span>
              {customer.service_price && (
                <Badge variant="outline" className="ml-2 text-secondary bg-gray-800">
                  {customer.service_price}
                </Badge>
              )}
            </div>
            {customer.service_category && (
              <div className="text-xs text-gray-400 ml-6 mt-1">
                Category: {customer.service_category}
              </div>
            )}
            {customer.selected_extras && (
              <div className="text-xs text-gray-400 ml-6 mt-1">
                Extras: {customer.selected_extras}
              </div>
            )}
          </div>
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
          
          {/* Payment verification button - always show for both payment methods */}
          <Button 
            variant="outline" 
            size="sm"
            className="btn-blue"
            onClick={() => verifyPaymentMutation.mutate()}
            disabled={verifyPaymentMutation.isPending || customer.payment_verified === "Yes"}
          >
            <Check className="h-4 w-4 mr-2" />
            Verify {customer.payment_method === "Cash" ? "Cash" : "Card"}
          </Button>
          
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
