import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

export async function issueApiKey(userId: string, name: string, scopes: string[]) {
  const secret = `qf_${randomBytes(30).toString("base64url")}`;
  const [row] = await db.insert(apiKeys).values({ userId, name, scopes, prefix: secret.slice(0, 11), keyHash: hashApiKey(secret) }).returning();
  return { key: secret, row };
}

export async function authenticateApiKey(request: Request, requiredScope: string) {
  const header = request.headers.get("authorization");
  const key = header?.startsWith("Bearer ") ? header.slice(7) : request.headers.get("x-api-key");
  if (!key) return null;
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, hashApiKey(key)), isNull(apiKeys.revokedAt))).limit(1);
  const record = rows[0];
  if (!record || !record.scopes.includes(requiredScope)) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, record.id));
  return record;
}
