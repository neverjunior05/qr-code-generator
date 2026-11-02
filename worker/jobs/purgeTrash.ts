import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
export async function purgeTrash() { const cutoff = new Date(Date.now() - 30 * 86400_000); const deleted = await db.delete(qrCodes).where(and(eq(qrCodes.status, "trashed"), lt(qrCodes.trashedAt, cutoff))).returning({ id: qrCodes.id }); return deleted.length; }
