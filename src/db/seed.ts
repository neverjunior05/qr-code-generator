import { sql } from "drizzle-orm";
import { db } from "./index";
import { auditLogs, blocklist, bulkJobs, folders, qrCodes, reports, scanEvents, users } from "./schema";
import { hashPassword } from "@/lib/auth";
import { defaultContent, defaultDesign, type ContentType, type QrContent } from "@/lib/qr/types";
import { applyPreset, PRESETS } from "@/lib/qr/presets";
import { encodeContent } from "@/lib/qr/encoders";

const PEOPLE = [
  ["Maya Chen", "user@qrforge.test", "free"], ["Theo Bennett", "pro@qrforge.test", "pro"], ["Rina Patel", "admin@qrforge.test", "pro"],
  ["Jon Bell", "jon@example.com", "free"], ["Sofia Marin", "sofia@example.com", "free"], ["Emeka Okafor", "emeka@example.com", "free"],
  ["Lena Fischer", "lena@example.com", "free"], ["Haruto Sato", "haruto@example.com", "free"], ["Amara Diallo", "amara@example.com", "free"],
  ["Noah Williams", "noah@example.com", "free"], ["Ines Costa", "ines@example.com", "free"], ["Oliver Smith", "oliver@example.com", "free"],
  ["Priya Nair", "priya@example.com", "free"], ["Lucas Silva", "lucas@example.com", "free"], ["Freya Larsen", "freya@example.com", "free"],
] as const;

const NAMES: Record<ContentType, string[]> = {
  url: ["Spring supper menu", "Neighborhood feedback", "Portfolio — selected work", "Workshop resource list", "Weekend secret special"],
  text: ["Limited-edition print note", "Classroom exit ticket", "Package batch number", "Museum object caption", "Handwritten-style thank you"],
  wifi: ["Paper Plane Café guest Wi-Fi", "Workshop studio network", "Library reading room", "Guesthouse welcome card", "Night market vendor network"],
  vcard: ["Avery Stone — designer", "Maya Chen — studio lead", "Theo Bennett — developer", "Rina Patel — event producer", "Sofia Marin — photographer"],
  email: ["Menu suggestions inbox", "Scholarship questions", "Wholesale print enquiry", "Volunteer coordinator", "Exhibition guestbook reply"],
  sms: ["Table reservation text", "Event arrival check-in", "Crisis line demo message", "Parent classroom update", "Courier delivery note"],
  phone: ["Café front counter", "Community box office", "Freelance studio line", "Campus print desk", "Holiday market information"],
  event: ["Riso printing open evening", "Design educators meetup", "Neighborhood garden tour", "Analog photography walk", "Small press book fair"],
  geo: ["Studio workshop entrance", "Festival information point", "Community garden gate", "Gallery accessible entrance", "Farmers market meeting spot"],
  appstore: ["Pocket Field Notes app", "Student Study Timer", "Independent Radio Player", "Trail Sketchbook", "Pantry Meal Planner"],
  payment: ["Community zine contribution", "Workshop material fee", "Studio tip jar text", "Plant swap donation", "Print order deposit"],
  multilink: ["Avery's creative links", "Café social and menu", "Teacher resource hub", "Festival artist directory", "Freelancer project index"],
};
const TYPES = Object.keys(NAMES) as ContentType[];
const FOLDERS = ["Menus & table tents", "Wi-Fi signs", "Client work", "Spring campaign", "Workshops", "Business cards", "Product labels", "Classroom", "Events", "Feedback", "Personal", "Archive candidates"];
const COUNTRIES = [["United States", "Portland"], ["United Kingdom", "London"], ["Germany", "Berlin"], ["Japan", "Tokyo"], ["Australia", "Melbourne"], ["Brazil", "São Paulo"], ["Canada", "Toronto"], ["India", "Bengaluru"], ["France", "Lyon"], ["Netherlands", "Amsterdam"]];
const REFERRERS = ["Direct / print", "Direct / print", "Direct / print", "https://example.org/poster", "https://example.com/newsletter", "https://example.test/campaign"];

function contentFor(type: ContentType, n: number): QrContent {
  const values = structuredClone(defaultContent.values);
  values.url = `https://example.com/${["spring-menu", "feedback", "portfolio", "workshop", "weekend-special"][n] || `resource-${n + 1}`}`;
  values.text = ["Edition 24 of 100 — thank you for supporting independent print.", "Exit ticket: one idea I learned, one question I still have.", `BATCH PP-2026-${String(n + 14).padStart(3, "0")} · printed on recycled stock`, "This object was made using a two-color risograph process.", "Thank you — your purchase keeps our tiny studio humming."][n];
  values.ssid = ["PaperPlane_Guest", "Workshop_Studio", "ReadingRoom", "Guesthouse_Welcome", "NightMarket_Vendor"][n];
  values.password = ["paper;plane:26", "ink&paper,123", "quiet:reading", "welcome;home", "market,after-dark"][n];
  values.firstName = ["Avery", "Maya", "Theo", "Rina", "Sofia"][n]; values.lastName = ["Stone", "Chen", "Bennett", "Patel", "Marin"][n];
  values.email = `${values.firstName.toLowerCase()}@example.com`; values.to = ["suggestions@example.com", "scholarship@example.com", "wholesale@example.com", "volunteer@example.com", "guestbook@example.com"][n];
  values.subject = type === "event" ? ["Riso printing open evening", "Design educators meetup", "Neighborhood garden tour", "Analog photography walk", "Small press book fair"][n] : ["Menu suggestion", "Scholarship question", "Wholesale enquiry", "Volunteer signup", "Guestbook hello"][n];
  values.start = `2026-0${8 + (n % 2)}-${String(10 + n).padStart(2, "0")}T18:00`; values.end = `2026-0${8 + (n % 2)}-${String(10 + n).padStart(2, "0")}T20:00`;
  values.latitude = String(45.5152 + n * 0.012); values.longitude = String(-122.6784 + n * 0.015);
  values.links = [{ id: `a${n}`, label: "Portfolio", url: "https://example.com/portfolio" }, { id: `b${n}`, label: "Latest project", url: "https://example.org/project" }, { id: `c${n}`, label: "Email me", url: "https://example.com/contact" }];
  return { type, values };
}

let seedPromise: Promise<void> | null = null;
export async function ensureSeed() {
  if (!seedPromise) seedPromise = seed().catch((error) => { seedPromise = null; throw error; });
  return seedPromise;
}

async function seed() {
  await db.execute(sql`select pg_advisory_xact_lock(846211)`).catch(() => undefined);
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;
  const passwordHash = await hashPassword("demo1234");
  const insertedUsers = await db.insert(users).values(PEOPLE.map(([name, email, plan], i) => ({
    name, email, passwordHash, plan, role: i === 2 ? "admin" as const : "user" as const,
    avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`,
    brandKit: i < 3 ? { name: `${name.split(" ")[0]}'s studio`, primary: ["#4F46FF", "#B72B68", "#174C3B"][i], secondary: ["#FF4FA3", "#FFD23F", "#2ED6C9"][i], background: "#FFFFFF", logo: "", font: "Space Grotesk" } : undefined,
  }))).returning();
  const owner = insertedUsers[0];
  const insertedFolders = await db.insert(folders).values(FOLDERS.map((name, i) => ({ userId: owner.id, name, color: ["#4F46FF", "#FF4FA3", "#2ED6C9", "#FF8A3D"][i % 4] }))).returning();
  const rows: (typeof qrCodes.$inferInsert)[] = [];
  for (const type of TYPES) {
    for (let n = 0; n < 5; n++) {
      const index = TYPES.indexOf(type) * 5 + n; const content = contentFor(type, n);
      const dynamic = type === "url" || n === 0 || n === 1;
      const slug = dynamic ? (type === "url" ? ["menu-spring", "flagged-demo", "paused-demo", "expired-demo", "secret-menu"][n] : n === 0 ? `${type}-sample` : type === "appstore" ? "schedule-demo" : `${type}-dynamic`) : null;
      const design = { ...applyPreset(PRESETS[index % PRESETS.length].id), size: 1024 };
      let destination: string | null = dynamic ? content.values.url : null;
      if (type === "appstore") destination = content.values.iosUrl;
      let status: "active" | "paused" | "archived" | "trashed" = "active";
      let flagged = false; let flagReason: string | null = null; let expiresAt: Date | null = null; let password: string | null = null; let scanLimit: number | null = null;
      if (slug === "flagged-demo") { destination = "http://phishing-example.test/verify"; flagged = true; flagReason = "Local blocklist and non-HTTPS destination"; }
      if (slug === "paused-demo") status = "paused";
      if (slug === "expired-demo") { expiresAt = new Date(Date.now() - 86400_000); scanLimit = 100; }
      if (slug === "secret-menu") password = passwordHash;
      if (index === 59) { status = "trashed"; }
      const encoded = dynamic ? `https://qrforge.test/q/${slug}` : encodeContent(content).text;
      const demoDynamic = ["menu-spring", "flagged-demo", "wifi-sample", "vcard-sample", "email-sample", "event-sample", "geo-sample", "multilink-sample"].includes(slug || "");
      rows.push({
        userId: dynamic ? (demoDynamic ? owner.id : insertedUsers[1].id) : (index < 48 ? owner.id : insertedUsers[2 + (index % (insertedUsers.length - 2))].id),
        folderId: index < 36 ? insertedFolders[index % insertedFolders.length].id : null,
        name: NAMES[type][n], type, content, design, encoded, dynamic, slug, destination, status,
        tags: [FOLDERS[index % FOLDERS.length].split(" ")[0].toLowerCase(), type, index % 3 === 0 ? "print" : "campaign"],
        expiresAt, scanLimit, passwordHash: password, flagged, flagReason,
        schedules: slug === "schedule-demo" ? [{ id: "demo-schedule", at: new Date(Date.now() + 4 * 60_000).toISOString(), destination: "https://example.org/app-release" }] : [],
        routing: type === "appstore" ? { ios: content.values.iosUrl, android: content.values.androidUrl, desktop: "https://example.com/app" } : slug === "menu-spring" ? { ab: [{ destination: "https://example.org/spring-menu-b", weight: 20 }] } : {},
        trashedAt: status === "trashed" ? new Date() : null,
        createdAt: new Date(Date.now() - (index + 2) * 86400_000), updatedAt: new Date(Date.now() - n * 3600_000),
      });
    }
  }
  const codes = await db.insert(qrCodes).values(rows).returning();
  const dynamicCodes = codes.filter((c) => c.dynamic);
  const events: (typeof scanEvents.$inferInsert)[] = [];
  const counts = new Map<string, number>();
  for (const code of dynamicCodes) {
    const count = 18 + (code.name.length % 14);
    counts.set(code.id, count);
    for (let j = 0; j < count; j++) {
      const scannedAt = new Date(Date.now() - ((j * 37 + code.name.length * 11) % (35 * 24)) * 3600_000);
      const region = COUNTRIES[(j + code.name.length) % COUNTRIES.length];
      const device = j % 7 === 0 ? "Tablet" : j % 4 === 0 ? "Desktop" : "Mobile";
      const os = device === "Desktop" ? (j % 2 ? "macOS" : "Windows") : (j % 3 ? "iOS" : "Android");
      events.push({ codeId: code.id, scannedAt, day: scannedAt.toISOString().slice(0, 10), visitorHash: `fictional-${code.id.slice(0, 6)}-${j % Math.max(5, count - 5)}`, device, os, browser: j % 4 === 0 ? "Safari" : j % 4 === 1 ? "Chrome" : j % 4 === 2 ? "Firefox" : "Edge", country: region[0], city: region[1], referrer: REFERRERS[j % REFERRERS.length], hour: scannedAt.getHours() });
    }
  }
  await db.insert(scanEvents).values(events);
  for (const [codeId, scanCount] of counts) await db.update(qrCodes).set({ scanCount }).where(sql`${qrCodes.id} = ${codeId}`);
  const reportCodes = ["flagged-demo", "menu-spring", "wifi-sample", "event-sample", "payment-sample", "multilink-sample"];
  await db.insert(reports).values(reportCodes.map((slug, i) => ({ codeId: codes.find((c) => c.slug === slug)?.id, slug, reason: ["Suspicious destination", "Broken destination", "Unexpected content", "Possible impersonation", "Spam", "Other"][i], details: ["Fictional report: destination asks for credentials.", "Fictional report: the printed code led to an old page.", "Fictional report: content differed from the poster.", "Fictional report: branding appears impersonated.", "Fictional report: unsolicited campaign link.", "Fictional report used to demonstrate the review queue."][i], status: (["open", "reviewing", "resolved", "dismissed", "open", "reviewing"] as const)[i] })));
  await db.insert(blocklist).values([{ pattern: "phishing-example.test", reason: "Fictional credential-harvesting example" }, { pattern: "malware.test", reason: "Fictional malware destination" }, { pattern: "blocked.example", reason: "Reserved domain blocklist demo" }]);
  await db.insert(bulkJobs).values({ userId: owner.id, filename: "spring-table-tents.csv", total: 8, valid: 5, errors: [{ row: 3, message: "URL is missing" }, { row: 6, message: "Unknown preset: Holo" }, { row: 8, message: "Formula-injection prefix removed from file name" }] });
  await db.insert(auditLogs).values([{ userId: insertedUsers[2].id, action: "report.resolved", target: "Spring campaign", meta: { fictional: true } }, { userId: insertedUsers[2].id, action: "blocklist.created", target: "phishing-example.test", meta: { fictional: true } }, { userId: owner.id, action: "brandkit.updated", target: "Maya's studio", meta: { fictional: true } }]);
  // Advisory lock is session-scoped when no transaction is active; release defensively.
  await db.execute(sql`select pg_advisory_unlock(846211)`).catch(() => undefined);
}
