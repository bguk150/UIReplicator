import { Queue } from "@shared/schema";
import { queueService } from "./supabase";
import { useToast } from "@/hooks/use-toast";

// Centralize the SMS sending logic
export const smsService = {
  // Send "Almost Done" notification to customer
  async sendAlmostDoneNotification(queueItem: Queue): Promise<Queue> {
    try {
      console.log(`Sending SMS notification to ${queueItem.name} at ${queueItem.phone_number}`);
      
      // The actual SMS sending happens on the server when we mark as almost done
      const result = await queueService.markAlmostDone(queueItem.id);
      
      console.log(`SMS notification process completed for customer ID: ${queueItem.id}`);
      return result;
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
      // Still throw the error for the component to handle appropriately
      throw error;
    }
  }
};

// Hook for components to use with toast notifications
export function useSmsNotification() {
  const { toast } = useToast();
  
  return {
    sendAlmostDoneNotification: async (queueItem: Queue): Promise<Queue | null> => {
      try {
        const result = await smsService.sendAlmostDoneNotification(queueItem);
        toast({
          title: "SMS Sent",
          description: null, // No description for cleaner notification
          variant: "default",
          duration: 1000 // 1 second
        });
        return result;
      } catch (error) {
        toast({
          title: "SMS Failed",
          description: null, // No description for cleaner notification
          variant: "destructive",
          duration: 1500 // 1.5 seconds for error messages
        });
        return null;
      }
    }
  };
}
