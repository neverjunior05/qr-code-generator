import { z } from "zod";
import { CONTENT_TYPES, defaultValues, type QrContent, type QrDesign } from "./qr/types";

export const emailSchema = z.string().trim().toLowerCase().email().max(180);
export const passwordSchema = z.string().min(8).max(128);
export const contentSchema = z.object({ type: z.enum(CONTENT_TYPES), values: z.record(z.string(), z.unknown()) });
export const designSchema = z.object({
  foreground: z.string().regex(/^#[0-9a-f]{6}$/i), background: z.string().regex(/^#[0-9a-f]{6}$/i),
  gradientType: z.enum(["none", "linear", "radial"]), gradientColor: z.string().regex(/^#[0-9a-f]{6}$/i), gradientRotation: z.number().min(0).max(360),
  dotStyle: z.enum(["square", "rounded", "dots", "classy", "extra-rounded"]), cornerSquareStyle: z.enum(["square", "rounded", "extra-rounded", "dot", "classy"]), cornerDotStyle: z.enum(["square", "rounded", "extra-rounded", "dot", "classy"]),
  errorCorrection: z.enum(["L", "M", "Q", "H"]), margin: z.number().int().min(0).max(10), size: z.number().int().min(64).max(8192),
  logo: z.string().max(3_000_000).refine((v) => !v || /^data:image\/(png|jpeg|webp);base64,/i.test(v) || /^https?:\/\//i.test(v), "Logo must be a raster data URL or HTTP(S) URL"), logoSize: z.number().min(10).max(30),
  frame: z.string().max(30), frameText: z.string().max(28), frameColor: z.string().regex(/^#[0-9a-f]{6}$/i), preset: z.string().max(80),
});

export const saveCodeSchema = z.object({
  name: z.string().trim().min(1).max(100), content: contentSchema, design: designSchema, dynamic: z.boolean().default(false),
  customSlug: z.string().trim().max(31).optional(), password: z.string().min(4).max(100).optional(), folderId: z.string().uuid().nullable().optional(), tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
});

export function parseContent(input: z.infer<typeof contentSchema>): QrContent {
  const links = Array.isArray(input.values.links) ? input.values.links.slice(0, 8).map((link, i) => {
    const item = typeof link === "object" && link ? link as Record<string, unknown> : {};
    return { id: typeof item.id === "string" ? item.id.slice(0, 80) : `link-${i}`, label: String(item.label ?? "").slice(0, 100), url: String(item.url ?? "").slice(0, 2048) };
  }) : defaultValues.links;
  const values = { ...defaultValues } as Record<string, unknown>;
  for (const [key, value] of Object.entries(input.values)) if (key in defaultValues && key !== "links" && (typeof value === "string" || typeof value === "boolean")) values[key] = typeof value === "string" ? value.slice(0, 5000) : value;
  values.links = links;
  return { type: input.type, values: values as QrContent["values"] };
}

export const updateCodeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(), destination: z.string().max(2048).nullable().optional(), status: z.enum(["active", "paused", "archived", "trashed"]).optional(),
  expiresAt: z.string().datetime().nullable().optional(), scanLimit: z.number().int().min(1).max(10_000_000).nullable().optional(), password: z.string().min(4).max(100).nullable().optional(),
  folderId: z.string().uuid().nullable().optional(), tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
  schedules: z.array(z.object({ id: z.string().max(80), at: z.string().datetime(), destination: z.string().max(2048), appliedAt: z.string().datetime().optional() })).max(20).optional(),
  routing: z.record(z.string(), z.unknown()).optional(), content: contentSchema.optional(), design: designSchema.optional(),
});
export type DesignInput = z.infer<typeof designSchema> & QrDesign;
