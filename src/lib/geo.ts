import { createHash } from "node:crypto";

const REGIONS = [
  { country: "United States", code: "US", cities: ["Portland", "Austin", "New York"] },
  { country: "United Kingdom", code: "GB", cities: ["London", "Bristol", "Manchester"] },
  { country: "Germany", code: "DE", cities: ["Berlin", "Hamburg", "Munich"] },
  { country: "Japan", code: "JP", cities: ["Tokyo", "Osaka", "Kyoto"] },
  { country: "Australia", code: "AU", cities: ["Melbourne", "Sydney", "Fremantle"] },
  { country: "Brazil", code: "BR", cities: ["São Paulo", "Curitiba", "Recife"] },
  { country: "Canada", code: "CA", cities: ["Toronto", "Vancouver", "Montréal"] },
  { country: "India", code: "IN", cities: ["Bengaluru", "Pune", "Jaipur"] },
  { country: "France", code: "FR", cities: ["Paris", "Lyon", "Nantes"] },
  { country: "Netherlands", code: "NL", cities: ["Amsterdam", "Utrecht", "Rotterdam"] },
];

/** Offline demo geolocation: deterministic region only; input IP is never retained. */
export function lookupRegion(ip: string) {
  const digest = createHash("sha256").update(`qrforge-region:${ip || "local"}`).digest();
  const region = REGIONS[digest[0] % REGIONS.length];
  return { country: region.country, code: region.code, city: region.cities[digest[1] % region.cities.length], method: "offline-demo" };
}

export function dailyVisitorHash(ip: string, userAgent: string, day = new Date().toISOString().slice(0, 10)) {
  const salt = process.env.ANALYTICS_SALT || "qrforge-local-demo-salt-change-me";
  return createHash("sha256").update(`${salt}:${day}:${ip}:${userAgent}`).digest("hex").slice(0, 32);
}
