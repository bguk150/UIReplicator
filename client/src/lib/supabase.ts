// Since we're using in-memory storage for this project, 
// this file is mostly for types and utility functions related to queue management

import { Queue, InsertQueue } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Queue service functions
export const queueService = {
  // Add a new customer to the queue
  async addToQueue(data: InsertQueue): Promise<Queue> {
    const res = await apiRequest('POST', '/api/queue', data);
    return res.json();
  },
  
  // Get all active customers in the queue
  async getQueue(): Promise<Queue[]> {
    const res = await apiRequest('GET', '/api/queue');
    return res.json();
  },
  
  // Get queue statistics
  async getQueueStats(): Promise<{ waiting: number, almostDone: number, total: number }> {
    const res = await apiRequest('GET', '/api/queue/stats');
    return res.json();
  },
  
  // Update a queue item (status, etc.)
  async updateQueueItem(id: number, updates: Partial<Queue>): Promise<Queue> {
    const res = await apiRequest('PUT', `/api/queue/${id}`, updates);
    return res.json();
  },
  
  // Verify cash payment
  async verifyCashPayment(id: number): Promise<Queue> {
    const res = await apiRequest('PUT', `/api/queue/${id}/verify-payment`);
    return res.json();
  },
  
  // Mark customer as almost done (and send SMS)
  async markAlmostDone(id: number): Promise<Queue> {
    return this.updateQueueItem(id, { status: "Almost Done" });
  },
  
  // Mark customer as served
  async markAsServed(id: number): Promise<Queue> {
    return this.updateQueueItem(id, { status: "Served" });
  }
};
