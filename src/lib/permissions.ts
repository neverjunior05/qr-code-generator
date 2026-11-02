import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { PLANS } from "@/config/plans";

/** Pause only overflow dynamic codes on downgrade; static codes are never touched. */
export async function enforceDynamicPlanLimit(userId: string, plan: "free" | "pro") {
  const codes = await db.select({ id: qrCodes.id }).from(qrCodes).where(and(eq(qrCodes.userId, userId), eq(qrCodes.dynamic, true), ne(qrCodes.status, "trashed"))).orderBy(asc(qrCodes.createdAt));
  const overflow = codes.slice(PLANS[plan].dynamicCodes).map((code) => code.id);
  if (overflow.length) await db.update(qrCodes).set({ status: "paused", flagReason: "Paused because this account exceeds its current dynamic-code plan limit.", updatedAt: new Date() }).where(inArray(qrCodes.id, overflow));
  return overflow.length;
}
