import type { MetadataRoute } from "next";
import { CONTENT_TYPES } from "@/lib/qr/types";
import { PRINT_TEMPLATES } from "@/config/templates";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; const paths = ["", "/create", "/templates", "/scan", "/bulk", "/developers", "/pricing", "/policies", ...CONTENT_TYPES.map((type) => `/create/${type}`), ...PRINT_TEMPLATES.map((template) => `/templates/${template.slug}`)]; return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path.startsWith("/create") ? .9 : .7 })); }
