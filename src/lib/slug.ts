import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { RESERVED_SLUGS } from "@/config/plans";

const alphabet = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export function randomSlug(length = 9) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function validateCustomSlug(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,30}$/.test(slug)) return "Use 3–31 lowercase letters, numbers, or hyphens; start with a letter or number.";
  if (RESERVED_SLUGS.includes(slug) || slug.endsWith("-") || slug.includes("--")) return "This slug is reserved or malformed.";
  return null;
}

export async function uniqueSlug(requested?: string) {
  if (requested) {
    const normalized = requested.toLowerCase().trim();
    const error = validateCustomSlug(normalized);
    if (error) throw new Error(error);
    const existing = await db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.slug, normalized)).limit(1);
    if (existing.length) throw new Error("That custom slug is already in use.");
    return normalized;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = randomSlug();
    const existing = await db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.slug, slug)).limit(1);
    if (!existing.length) return slug;
  }
  throw new Error("Could not allocate a unique slug. Please retry.");
}
