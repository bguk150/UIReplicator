import { queue, users, type Queue, type InsertQueue, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, ne, desc, asc, and } from "drizzle-orm";

// Storage interface with CRUD methods for queue management
export interface IStorage {
  // Queue methods
  getAllQueueItems(): Promise<Queue[]>;
  getQueueByStatus(status: string): Promise<Queue[]>;
  getQueueItemById(id: number): Promise<Queue | undefined>;
  insertQueueItem(item: InsertQueue): Promise<Queue>;
  updateQueueItem(id: number, updates: Partial<Queue>): Promise<Queue | undefined>;
  
  // Customer Database methods
  getAllCustomerRecords(): Promise<Queue[]>; // New method to get all records including served customers

  // User (Barber) methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserCredentials(username: string, password: string): Promise<User | undefined>;

  // Stats methods
  getQueueStats(): Promise<{ waiting: number, almostDone: number, total: number }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with default barber account if it doesn't exist
    this.initializeDefaultBarber();
  }

  private async initializeDefaultBarber() {
    try {
      // Check for existing user
      const existingUser = await this.getUserByUsername("beyondgroominguk@gmail.com");
      
      // Create the default barber if it doesn't exist
      if (!existingUser) {
        const defaultBarber: InsertUser = {
          username: "beyondgroominguk@gmail.com",
          password: "bg_uk123", // In a real app, this would be hashed
        };
        
        await this.createUser(defaultBarber);
        console.log("Created default barber account");
      }
    } catch (error) {
      console.error("Failed to initialize default barber:", error);
    }
  }

  // Queue methods
  async getAllQueueItems(): Promise<Queue[]> {
    // Return all active queue items (not served)
    try {
      console.log("Fetching all active queue items from database");

      const items = await db.select().from(queue)
        .where(ne(queue.status, "Served"))
        .orderBy(asc(queue.check_in_time))
        .catch(err => {
          console.error("Database query error:", err);
          return [];
        });

      console.log(`Retrieved ${items.length} active queue items`);
      return items;
    } catch (error) {
      console.error("Error fetching queue items:", error);
      return []; // Return empty array on error rather than crashing
    }
  }

  async getQueueByStatus(status: string): Promise<Queue[]> {
    return db.select().from(queue)
      .where(eq(queue.status, status))
      .orderBy(asc(queue.check_in_time));
  }

  async getQueueItemById(id: number): Promise<Queue | undefined> {
    const [item] = await db.select().from(queue).where(eq(queue.id, id));
    return item || undefined;
  }

  async insertQueueItem(item: InsertQueue): Promise<Queue> {
    const now = new Date();

    const [queueItem] = await db.insert(queue).values({
      ...item,
      check_in_time: now,
      status: "Waiting",
      payment_verified: "No", // All payments require manual verification
      sms_sent: "No"
    }).returning();

    return queueItem;
  }

  async updateQueueItem(id: number, updates: Partial<Queue>): Promise<Queue | undefined> {
    const [updatedItem] = await db.update(queue)
      .set(updates)
      .where(eq(queue.id, id))
      .returning();

    return updatedItem || undefined;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(eq(users.username, username.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values({ ...insertUser, role: "barber" })
      .returning();
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

  // Customer Database methods
  async getAllCustomerRecords(): Promise<Queue[]> {
    try {
      console.log("Fetching all customer records from database (including served)");

      const items = await db.select().from(queue)
        .orderBy(desc(queue.check_in_time)) // Most recent first
        .catch(err => {
          console.error("Database query error:", err);
          return [];
        });

      console.log(`Retrieved ${items.length} total customer records`);
      return items;
    } catch (error) {
      console.error("Error fetching customer records:", error);
      return []; // Return empty array on error
    }
  }

  // Stats methods
  async getQueueStats(): Promise<{ waiting: number, almostDone: number, total: number }> {
    const waitingItems = await this.getQueueByStatus("Waiting");
    const almostDoneItems = await this.getQueueByStatus("Almost Done");
    const activeItems = await db.select().from(queue)
      .where(ne(queue.status, "Served"));

    return {
      waiting: waitingItems.length,
      almostDone: almostDoneItems.length,
      total: activeItems.length
    };
  }
}

export const storage = new DatabaseStorage();