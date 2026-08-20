import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  stage: text("stage").notNull().default("在校生"),
  target: text("target").notNull().default("产品"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviewStates = sqliteTable("review_states", {
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull(),
  quality: integer("quality").notNull().default(0),
  intervalIndex: integer("interval_index").notNull().default(0),
  dueAt: text("due_at").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.cardId] })]);

export const refreshRequests = sqliteTable("refresh_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  status: text("status").notNull().default("queued"),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint)]);

export const crawlRuns = sqliteTable("crawl_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  status: text("status").notNull(),
  discovered: integer("discovered").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  finishedAt: text("finished_at"),
});
