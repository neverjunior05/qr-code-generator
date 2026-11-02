export const PLANS = {
  free: { name: "Free", dynamicCodes: 10, bulkPerRun: 200, apiRequestsPerMinute: 60, analyticsDays: 30, price: 0, features: ["Unlimited static codes", "10 active dynamic codes", "200 bulk codes per run", "30-day privacy analytics", "PNG, SVG and PDF exports"] },
  pro: { name: "Pro (simulated)", dynamicCodes: 500, bulkPerRun: 200, apiRequestsPerMinute: 300, analyticsDays: 365, price: 12, features: ["500 active dynamic codes", "Custom slugs and routing", "12-month analytics", "Brand kits and scheduled links", "Simulated billing — no card stored"] },
} as const;

export const RESERVED_SLUGS = ["api", "admin", "login", "register", "create", "library", "settings", "developers", "pricing", "scan", "bulk", "templates", "warning", "q", "p", "health", "robots.txt", "sitemap.xml"];
