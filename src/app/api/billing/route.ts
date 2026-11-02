import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getCurrentUser, userClient } from "@/lib/auth";
import { enforceDynamicPlanLimit } from "@/lib/permissions";
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in to change the simulated plan." }, { status: 401 }); const parsed = z.object({ plan: z.enum(["free", "pro"]), confirmation: z.literal("SIMULATED") }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Confirm the simulated gateway explicitly." }, { status: 400 }); const [updated] = await db.update(users).set({ plan: parsed.data.plan }).where(eq(users.id, user.id)).returning(); const paused = await enforceDynamicPlanLimit(user.id, parsed.data.plan); await db.insert(auditLogs).values({ userId: user.id, action: "billing.simulated.plan.changed", target: user.id, meta: { plan: parsed.data.plan, cardDataCollected: false, overflowPaused: paused } }); return NextResponse.json({ user: userClient(updated), mode: "simulated", message: `Simulated ${parsed.data.plan} plan applied. No payment or card data was processed.${paused ? ` ${paused} overflow dynamic codes were paused; static codes are unchanged.` : ""}` }); }
