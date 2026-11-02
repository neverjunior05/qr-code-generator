import type { QrContent, QrDesign } from "./qr/types";
import type { RoutingRules, Schedule } from "@/db/schema";

export type SavedCode = {
  id: string; userId: string; folderId: string | null; name: string; type: string; content: QrContent; design: QrDesign; encoded: string;
  dynamic: boolean; slug: string | null; destination: string | null; status: "active" | "paused" | "archived" | "trashed";
  tags: string[]; expiresAt: string | null; scanLimit: number | null; scanCount: number; schedules: Schedule[]; routing: RoutingRules;
  flagged: boolean; flagReason: string | null; trashedAt: string | null; createdAt: string; updatedAt: string;
};
export type Folder = { id: string; userId: string; name: string; color: string; createdAt: string };
export type SessionUser = { id: string; name: string; email: string; role: "user" | "admin"; plan: "free" | "pro"; verified: boolean; brandKit?: unknown; settings: Record<string, unknown> };
