import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { QrContent, QrDesign } from "@/lib/qr/types";

export type RoutingRules = { ios?: string; android?: string; desktop?: string; time?: { from: string; to: string; destination: string }[]; regions?: { country: string; destination: string }[]; ab?: { destination: string; weight: number }[] };
export type Schedule = { id: string; at: string; destination: string; appliedAt?: string };
export type BrandKit = { name: string; primary: string; secondary: string; background: string; logo: string; font: string };

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), email: text("email").notNull().unique(),
  name: text("name").notNull(), passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
  plan: text("plan").$type<"free" | "pro">().notNull().default("free"),
  verified: boolean("verified").notNull().default(true), avatar: text("avatar"),
  brandKit: jsonb("brand_kit").$type<BrandKit>(), settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  deleteAt: timestamp("delete_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(), tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), color: text("color").notNull().default("#4F46FF"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const qrCodes = pgTable("qr_codes", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  name: text("name").notNull(), type: text("type").notNull(), content: jsonb("content").$type<QrContent>().notNull(),
  design: jsonb("design").$type<QrDesign>().notNull(), encoded: text("encoded").notNull(),
  dynamic: boolean("dynamic").notNull().default(false), slug: text("slug"), destination: text("destination"),
  status: text("status").$type<"active" | "paused" | "archived" | "trashed">().notNull().default("active"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]), expiresAt: timestamp("expires_at", { withTimezone: true }),
  scanLimit: integer("scan_limit"), scanCount: integer("scan_count").notNull().default(0), passwordHash: text("password_hash"),
  schedules: jsonb("schedules").$type<Schedule[]>().notNull().default([]), routing: jsonb("routing").$type<RoutingRules>().notNull().default({}),
  flagged: boolean("flagged").notNull().default(false), flagReason: text("flag_reason"),
  trashedAt: timestamp("trashed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("qr_codes_slug_unique").on(table.slug), index("qr_codes_user_idx").on(table.userId), index("qr_codes_status_idx").on(table.status)]);

export const scanEvents = pgTable("scan_events", {
  id: uuid("id").primaryKey().defaultRandom(), codeId: uuid("code_id").notNull().references(() => qrCodes.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(), day: text("day").notNull(),
  visitorHash: text("visitor_hash").notNull(), device: text("device").notNull(), os: text("os").notNull(), browser: text("browser").notNull(),
  country: text("country").notNull(), city: text("city").notNull(), referrer: text("referrer").notNull(), hour: integer("hour").notNull(),
}, (table) => [index("scan_code_time_idx").on(table.codeId, table.scannedAt), index("scan_visitor_idx").on(table.codeId, table.day, table.visitorHash)]);

export const dailyAggregates = pgTable("daily_aggregates", {
  id: uuid("id").primaryKey().defaultRandom(), codeId: uuid("code_id").notNull().references(() => qrCodes.id, { onDelete: "cascade" }),
  day: text("day").notNull(), total: integer("total").notNull().default(0), uniqueCount: integer("unique_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("daily_aggregate_code_day").on(table.codeId, table.day)]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(), codeId: uuid("code_id").references(() => qrCodes.id, { onDelete: "set null" }),
  slug: text("slug").notNull(), reason: text("reason").notNull(), details: text("details"), contact: text("contact"),
  status: text("status").$type<"open" | "reviewing" | "resolved" | "dismissed">().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blocklist = pgTable("blocklist", {
  id: uuid("id").primaryKey().defaultRandom(), pattern: text("pattern").notNull().unique(), reason: text("reason").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), prefix: text("prefix").notNull(), keyHash: text("key_hash").notNull().unique(),
  scopes: jsonb("scopes").$type<string[]>().notNull().default(["codes:read"]), lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bulkJobs = pgTable("bulk_jobs", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(), total: integer("total").notNull(), valid: integer("valid").notNull(),
  errors: jsonb("errors").$type<{ row: number; message: string }[]>().notNull().default([]), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), target: text("target").notNull(), meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(), secretHash: text("secret_hash").notNull(), active: boolean("active").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({ codes: many(qrCodes), folders: many(folders) }));
export const codeRelations = relations(qrCodes, ({ one, many }) => ({ user: one(users, { fields: [qrCodes.userId], references: [users.id] }), folder: one(folders, { fields: [qrCodes.folderId], references: [folders.id] }), scans: many(scanEvents) }));
