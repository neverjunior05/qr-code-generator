import { isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
export async function deleteAccounts() { const deleted = await db.delete(users).where(lt(users.deleteAt, new Date())).returning({ id: users.id }); return deleted.length; }
