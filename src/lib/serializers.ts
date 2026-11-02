import type { qrCodes } from "@/db/schema";
export function toClientCode(code: typeof qrCodes.$inferSelect) { const { passwordHash, ...safe } = code; return { ...safe, hasPassword: Boolean(passwordHash) }; }
