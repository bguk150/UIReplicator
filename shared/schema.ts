import { pgTable, text, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Queue Table Schema
export const queue = pgTable("queue", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone_number: varchar("phone_number", { length: 20 }).notNull(),
  service_type: text("service_type").notNull(),
  service_price: text("service_price").default(""),
  service_category: text("service_category").default(""),
  selected_extras: text("selected_extras").default(""),
  payment_method: text("payment_method").notNull(),
  check_in_time: timestamp("check_in_time").defaultNow().notNull(),
  status: text("status").default("Waiting").notNull(),
  payment_verified: text("payment_verified").default("No").notNull(),
  sms_sent: text("sms_sent").default("No").notNull(),
});

// Users Table Schema for Barber Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("barber").notNull(),
});

// Insert Schema for Queue
export const insertQueueSchema = createInsertSchema(queue)
  .omit({ id: true, check_in_time: true, status: true, payment_verified: true, sms_sent: true });

// Extended Queue Schema with Phone Number Validation
export const queueFormSchema = insertQueueSchema.extend({
  phone_number: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 characters")
    .regex(/^(07\d{9}|7\d{9})$/, "Please enter a valid UK mobile number (e.g., 7XXXXXXXXX)"),
  service_price: z.string().min(1, "Service price is required"),
  service_category: z.string().min(1, "Service category is required"),
  selected_extras: z.string().optional().default(""),
});

// Login Schema
export const loginSchema = z.object({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Insert Schema for User
export const insertUserSchema = createInsertSchema(users).omit({ id: true, role: true });

// Types
export type Queue = typeof queue.$inferSelect;
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type QueueFormData = z.infer<typeof queueFormSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
