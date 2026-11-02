import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { applyDueSchedules } from "@/lib/redirect";
export async function applySchedules() { const codes = await db.select().from(qrCodes).where(and(eq(qrCodes.dynamic, true), eq(qrCodes.status, "active"))); let applied = 0; for (const code of codes) { if ((code.schedules || []).some((s) => !s.appliedAt && +new Date(s.at) <= Date.now())) { await applyDueSchedules(code); applied++; } } return applied; }
