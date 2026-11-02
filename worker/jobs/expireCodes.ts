import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
/** Expiry is deliberately enforced at redirect time; this job reports due codes without changing them to a misleading paused state. */
export async function expireCodes() { const expired = await db.select({ id: qrCodes.id }).from(qrCodes).where(and(eq(qrCodes.status, "active"), lt(qrCodes.expiresAt, new Date()))); return { enforcedAtRedirect: expired.length }; }
