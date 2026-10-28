import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

// Push Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Push send events history (success + failure) — used to keep diagnostics
// across server restarts so the health panel can reflect real recent activity.
export const pushSendEvents = pgTable("push_send_events", {
  id: serial("id").primaryKey(),
  at: timestamp("at").notNull().defaultNow(),
  status: text("status").notNull(), // 'success' | 'failure'
  kind: text("kind"), // 'auth' | 'gone' | 'other' (null for success)
  statusCode: integer("status_code"),
  endpointPreview: text("endpoint_preview").notNull(),
  message: text("message"),
});

export type PushSendEvent = typeof pushSendEvents.$inferSelect;
