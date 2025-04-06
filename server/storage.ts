import { queue, users, type Queue, type InsertQueue, type User, type InsertUser } from "@shared/schema";

// Storage interface with CRUD methods for queue management
export interface IStorage {
  // Queue methods
  getAllQueueItems(): Promise<Queue[]>;
  getQueueByStatus(status: string): Promise<Queue[]>;
  getQueueItemById(id: number): Promise<Queue | undefined>;
  insertQueueItem(item: InsertQueue): Promise<Queue>;
  updateQueueItem(id: number, updates: Partial<Queue>): Promise<Queue | undefined>;
  
  // User (Barber) methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserCredentials(username: string, password: string): Promise<User | undefined>;
  
  // Stats methods
  getQueueStats(): Promise<{ waiting: number, almostDone: number, total: number }>;
}

export class MemStorage implements IStorage {
  private queueItems: Map<number, Queue>;
  private users: Map<number, User>;
  private queueCurrentId: number;
  private userCurrentId: number;

  constructor() {
    this.queueItems = new Map();
    this.users = new Map();
    this.queueCurrentId = 1;
    this.userCurrentId = 1;
    
    // Initialize with default barber account
    const defaultBarber: InsertUser = {
      username: "beyondgroominguk@gmail.com",
      password: "bg_uk123" // In a real app, this would be hashed
    };
    this.createUser(defaultBarber);
  }

  // Queue methods
  async getAllQueueItems(): Promise<Queue[]> {
    // Return all active queue items (not served)
    return Array.from(this.queueItems.values())
      .filter(item => item.status !== "Served")
      .sort((a, b) => {
        // Sort by check-in time (oldest first)
        const dateA = new Date(a.check_in_time).getTime();
        const dateB = new Date(b.check_in_time).getTime();
        return dateA - dateB;
      });
  }

  async getQueueByStatus(status: string): Promise<Queue[]> {
    return Array.from(this.queueItems.values())
      .filter(item => item.status === status)
      .sort((a, b) => {
        const dateA = new Date(a.check_in_time).getTime();
        const dateB = new Date(b.check_in_time).getTime();
        return dateA - dateB;
      });
  }

  async getQueueItemById(id: number): Promise<Queue | undefined> {
    return this.queueItems.get(id);
  }

  async insertQueueItem(item: InsertQueue): Promise<Queue> {
    const id = this.queueCurrentId++;
    const now = new Date();
    
    const queueItem: Queue = {
      ...item,
      id,
      check_in_time: now,
      status: "Waiting",
      payment_verified: item.payment_method === "Card" ? "Yes" : "No", // Card payments are auto-verified
      sms_sent: "No"
    };
    
    this.queueItems.set(id, queueItem);
    return queueItem;
  }

  async updateQueueItem(id: number, updates: Partial<Queue>): Promise<Queue | undefined> {
    const item = this.queueItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.queueItems.set(id, updatedItem);
    return updatedItem;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, role: "barber" };
    this.users.set(id, user);
    return user;
  }

  async verifyUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    // In a real app, this would use bcrypt.compare or similar
    if (user.password === password) {
      return user;
    }
    
    return undefined;
  }

  // Stats methods
  async getQueueStats(): Promise<{ waiting: number, almostDone: number, total: number }> {
    const allActiveItems = Array.from(this.queueItems.values())
      .filter(item => item.status !== "Served");
    
    const waiting = allActiveItems.filter(item => item.status === "Waiting").length;
    const almostDone = allActiveItems.filter(item => item.status === "Almost Done").length;
    const total = allActiveItems.length;
    
    return { waiting, almostDone, total };
  }
}

export const storage = new MemStorage();
