import { Queue } from "@shared/schema";
import { queueService } from "./supabase";

// Centralize the SMS sending logic
export const smsService = {
  // Send "Almost Done" notification to customer
  async sendAlmostDoneNotification(queueItem: Queue): Promise<Queue> {
    try {
      // The actual SMS sending happens on the server when we mark as almost done
      return await queueService.markAlmostDone(queueItem.id);
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
      throw error;
    }
  }
};
