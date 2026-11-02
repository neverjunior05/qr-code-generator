# QRForge

### Make every scan beautifully useful.

QRForge is a local-first QR generator, private reader, print-design studio, and dynamic-link manager. It pairs a precise design-tool workflow with an original **Print Studio Pixel** visual language: paper, ink, riso overprint, hard print shadows, and useful motion.

> **Independent demo and learning project.** QRForge is not affiliated with, endorsed by, or derived from any existing QR service. The QRForge name, interface, frames, presets, illustrations, and print layouts are original. Do not substitute the name, logo, or proprietary assets of another QR provider. **All seeded users, codes, scans, reports, and payment-plan changes are FICTIONAL test data.** Only reserved or fictional destinations are used in the seed.
>
> **Trademark:** QR Code is a registered trademark of Denso Wave Incorporated. This project uses no Denso Wave logo or proprietary artwork. See [Compliance](#legal-privacy-and-compliance-notes).

---

## Screenshot and demo placeholders

The application is fully implemented; the assets below are intentionally documentation placeholders rather than fabricated product screenshots.

```text
[ SCREENSHOT: Landing hero + interactive live generator — public/og-image.svg is the original social preview ]
[ GIF: Scroll-driven Create → Style → Print → Track scene ]
[ SCREENSHOT: Desktop three-pane studio with scannability gauge ]
[ SCREENSHOT: Dynamic editor + privacy analytics ]
[ GIF: Camera reader lock-on and safety explanation ]
[ SCREENSHOT: 3×8 bulk label imposition ]
```

## What works

### Instant creation and design

- Twelve payload types: URL, UTF-8 plain text, Wi-Fi, vCard 3.0, email, SMS, phone, iCalendar event, geo, app-store links, payment-style text, and hosted multi-link pages.
- Debounced live matrix rendering with an accessible text equivalent. Very dense or over-capacity payloads produce actionable errors rather than a blank canvas.
- Local scannability report for contrast, inversion, gradient variance, quiet zone, export dimensions, matrix density, dot geometry, error correction, and estimated logo coverage.
- Solid, linear-gradient, and radial-gradient inks; five module styles; independent finder-ring and finder-dot styles; L/M/Q/H error correction; 0–10 module quiet zone; 64–8192 px export controls.
- Twelve authored presets: Minimal, Neon, Sunset, Ocean, Forest, Midnight, Retro, Candy, Mono, Gold, Glass, and Print-safe.
- Ten original frames plus no-frame: Studio sticker, Event ticket, Gallery arch, Bold caption, Postage, Orbit, Speech bubble, Index tab, Pill label, and Double rule.
- PNG/JPEG/WebP logo upload with a 2 MB cap, canvas rasterization, metadata stripping, resizing, and error-correction safeguards. SVG uploads are rejected. HTTPS image URLs are supported with an export reliability warning.
- One-click **Auto-fix for print** restores black-on-white contrast, at least four quiet-zone modules, H error correction, safer dots, and bounded logo size.

### Export and print

- PNG at preset and custom sizes, true vector SVG, physical-size PDF in mm or inches with optional bleed/crop marks, clipboard PNG with SVG-text fallback, and accessible `.txt` payload equivalents.
- All generator exports are created client-side. PDF QR artwork is rasterized at 300 DPI and placed at the requested physical width; use SVG when every production element must remain vector.
- Seven individually imposed print kits: Restaurant menu, Wi-Fi sign, Business card, Event ticket, Product label, Feedback form, and fold-over Table tent.
- CSV bulk generation for up to 200 valid rows per run: validation preview, column mapping, formula-injection sanitization, duplicate-safe filenames, chunked PNG/SVG ZIP output, error CSV, and 3×8 label-sheet PDF.

### Dynamic codes and analytics

- Cryptographically random, collision-checked slugs with an optional validated custom slug.
- Destination edits, pause/archive, soft deletion, expiry, scan limits, bcrypt password protection, scheduled destination changes, iOS/Android/desktop routing, time/region rule support in the routing engine, and seeded A/B routing.
- Redirect-time destination checks are repeated because a safe destination can later become unsafe. Self-links and obvious short-link loops are stopped.
- Scan counts use an atomic increment. Analytics include total scans, daily-unique estimates, time series, device, OS, browser, country/city, referrer origin, UTC time-of-day heatmap, recent scans, CSV export, and Server-Sent Events updates.
- Do Not Track and Global Privacy Control are honored. Obvious bots, crawlers, prefetches, and link-preview clients are excluded. Owners can disable future analytics without disabling redirects.
- No raw IP addresses, full user agents, precise locations, advertising identifiers, or cross-day visitor IDs are stored.

### Accounts, library, trust, and developer tools

- Email/password sessions, bcrypt hashes, HTTP-only same-site cookies, optional real Google OAuth when configured, mock verification/reset emails logged to the server console, and user/admin roles.
- Library thumbnails, search, type/status/folder filters, tags, folder creation, duplicate, bulk pause/activate/trash/restore, selected-code SVG ZIP export, and 30-day trash restore semantics.
- Brand kit, theme and reduced-motion overrides, analytics opt-out, scoped hashed API keys with one-time display and rotation, JSON data export, and seven-day account-deletion grace period.
- Public cached/rate-limited QR image endpoint, authenticated dynamic-code CRUD and analytics APIs, and interactive curl/JavaScript/Python documentation.
- Public abuse reports, local blocklist plus heuristics, optional Google Safe Browsing with a local fallback, warning interstitials, admin moderation, plan controls, platform charts, and audit logs.
- Camera/image QR decoding entirely in the browser with readable payload parsing and suspicious-link explanations.
- Installable manifest and a service worker that caches the instant studio and runtime assets after the first online visit. Dynamic redirects and authenticated views are not represented as offline-capable.

## Tech stack

- **Application:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- **Data:** PostgreSQL, Drizzle ORM, node-postgres. The provided project foundation uses Drizzle; this implementation deliberately keeps it instead of introducing a second Prisma data layer. PostgreSQL runs locally and can move to Neon or Supabase without changing application models.
- **QR:** `qrcode` for standards-based matrix encoding, an original SVG geometry renderer, `jsQR` for local decoding.
- **Client production tools:** Papa Parse, JSZip, jsPDF, Zustand with persisted builder state and undo/redo.
- **Motion and data visualization:** Framer Motion, GSAP + ScrollTrigger and Lenis on the landing page only, Recharts.
- **Maps:** Leaflet, React Leaflet, OpenStreetMap tiles with attribution.
- **Security:** Zod, bcryptjs, Node crypto for sessions/API-key hashes/unlock signatures/salted daily analytics hashes.
- **Worker:** Node.js, `node-cron`, `tsx`.
- **Icons/fonts:** Phosphor, Space Grotesk, Inter, JetBrains Mono.

## Design system: Print Studio Pixel

Neutral paper and ink carry most surfaces. Indigo is reserved for actions. Riso colors are used for illustrations, presets, and celebrations—not behind small low-contrast text.

| Token | Light | Dark / night studio |
|---|---|---|
| Background | `#FBF9F4` | `#0D0F1E` |
| Surface | `#FFFFFF` | `#151832` |
| Elevated | `#F2EEE6` | `#1E2243` |
| Hairline | `#E2DCCF` | `#2C3160` |
| Ink / text | `#14121F` | `#F1F0FA` |
| Muted | `#6A6578` | `#9A9AC0` |

Brand: indigo `#4F46FF`, bright `#7A73FF`, deep `#2E26C9`, soft tint `#E9E8FF`. Riso accents: hot pink `#FF4FA3`, sunny yellow `#FFD23F`, aqua `#2ED6C9`, tangerine `#FF8A3D`. Status: success `#1DB97D`, warning `#F5A524`, error `#F0445A`, info `#3B8BFF`.

Typography: Space Grotesk 500/700 for display, Inter 400/500/600 for body, JetBrains Mono 500/600 for slugs, URLs, hex values, and tabular counts. Fluid display sizes use `clamp()` and reach 7rem in the hero. Panels are 14px, inputs 10px, pills 999px, QR stickers 4px. Light key cards use hard `4px 4px 0` ink shadows; dark mode uses restrained indigo glows.

## Motion design

- **Preloader:** modules spring from scattered positions into a sticker, the center mark lands, a scan line sweeps, and the backing peels away.
- **Landing:** masked headline words, interactive local QR examples, mouse-parallax riso forms, labeled demo phone viewfinder, Lenis/GSAP reveals, and a 380vh pinned Create/Style/Print/Track scene driven by real scroll position. The QR rotates/scales/reorders into a menu and then beside an analytics chart.
- **Generator:** sub-250ms SVG settling, style crossfades, spring scan gauge, preset tilt, animated logo/frame regions, and hard-shadow button presses.
- **Export/library:** progress-ring download states, first-export reduced-motion-aware confetti, staggered cards, layout exits, and a spring bulk-action bar. Bulk tiles fill a ZIP box with actual generation progress.
- **Analytics/reader:** eased Recharts drawing, diagonal heatmap fades, SSE new-scan indicator, animated camera brackets, scan line, lock-on state, and sliding result cards.
- **Performance:** animate transform/opacity, debounce matrix work, aggregate SVG module paths, dynamically import PDF/ZIP/confetti/map/landing-motion code, pause camera loops on stop/unmount, and lazy-load below-fold images.
- **Reduced motion:** OS preference plus a footer/settings override disables parallax, cursor modules, GSAP smooth scrolling, scan lines, long celebrations, and pinned transformation. Content appears in final readable layouts. Only nonessential motion is removed.

## Project structure

```text
qrforge/
├── README.md
├── docker-compose.yml
├── .env.example
├── package.json
├── public/
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── manifest.json
│   ├── sw.js
│   └── samples/bulk.csv
├── worker/
│   ├── index.ts
│   ├── simulateScans.ts
│   └── jobs/
│       ├── applySchedules.ts
│       ├── expireCodes.ts
│       ├── purgeTrash.ts
│       ├── aggregateScans.ts
│       └── deleteAccounts.ts
└── src/
    ├── app/
    │   ├── layout.tsx / page.tsx / globals.css
    │   ├── create/page.tsx and create/[type]/page.tsx
    │   ├── templates/page.tsx and templates/[slug]/page.tsx
    │   ├── scan/ · bulk/ · library/ · folders/[id]/ · analytics/
    │   ├── library/[id]/ and library/[id]/analytics/
    │   ├── q/[code]/route.ts and q/[code]/warning/page.tsx
    │   ├── p/[slug]/ · developers/ · pricing/ · settings/
    │   ├── admin/ · login/ · register/ · policies/
    │   ├── robots.ts · sitemap.ts
    │   └── api/
    │       ├── auth/ · codes/ · folders/ · analytics/ · admin/
    │       ├── api-keys/ · settings/ · reports/ · unlock/ · bulk-jobs/
    │       └── v1/qr · v1/codes · v1/analytics
    ├── components/
    │   ├── generator/ · design/ · export/ · library/ · analytics/
    │   ├── reader/ · bulk/ · templates/ · admin/ · landing/ · layout/
    │   └── providers.tsx
    ├── hooks/ (builder, reduced motion)
    ├── lib/
    │   ├── auth.ts · apiKeys.ts · analytics.ts · botFilter.ts · geo.ts
    │   ├── rateLimit.ts · redirect.ts · slug.ts · urlSafety.ts
    │   ├── validations.ts · serializers.ts · clientTypes.ts
    │   └── qr/ (types, encoders, render, export, presets, scannability,
    │              readerSafety, templateExport)
    ├── store/useBuilderStore.ts
    ├── config/ (media, plans, templates)
    └── db/ (index, schema, seed)
```

## Prerequisites and local setup

- Node.js 20 or newer (Node 22 recommended)
- npm 10+
- PostgreSQL 14+ locally, or Docker for the optional Compose file

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL, AUTH_SECRET, and ANALYTICS_SALT.

# 3a. Either start PostgreSQL with Docker
# docker compose up -d db

# 3b. Apply the Drizzle schema
npx drizzle-kit push

# 4. Start the application
npm run dev
# Open http://localhost:3000

# 5. Seed is idempotent and runs on /api/health or demo sign-in.
curl http://localhost:3000/api/health

# 6. Optional: run maintenance jobs in another terminal
npx tsx worker/index.ts

# 7. Optional: emit 30 fictional scans, one every 2.5 seconds
npx tsx worker/simulateScans.ts
```

Production validation:

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
npx vitest run
npm run start
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Drizzle and worker. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical origin for metadata, mock email links, and deployment. |
| `AUTH_SECRET` | Production yes | HMAC secret for verification/reset and short-link unlock signatures. Use 32+ random bytes. |
| `ANALYTICS_SALT` | Production yes | Secret daily visitor-hash salt. Rotating it invalidates prior hashes; the date already rotates daily. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID. Unset gives an honest local fallback message. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret, server-only. |
| `GOOGLE_SAFE_BROWSING_API_KEY` | No | Optional destination reputation check. Local checks remain active on timeout/error. |
| `SIMULATE_COUNT` | No | Fictional scans emitted by the dev simulator; default 30. |
| `SIMULATE_INTERVAL_MS` | No | Delay between fictional scans; default 2500. |

No secret is exposed through a `NEXT_PUBLIC_` variable. Never commit `.env`.

## Database overview

- `users`: identity, role, free/pro plan, brand kit, settings, verification, deletion grace timestamp.
- `sessions`: SHA-256 session-token hashes and expiry.
- `folders`: owner, name, color.
- `qr_codes`: owner/folder, typed JSON content and design, encoded payload, dynamic slug/destination, state, tags, expiry/limit/counter, password hash, schedules, routing, safety state, trash timestamp.
- `scan_events`: timestamp/day, daily visitor hash, device/OS/browser, coarse region, referrer origin, UTC hour. No raw IP column exists.
- `daily_aggregates`: per-code/day total and distinct daily hashes maintained by the worker.
- `reports`: public abuse reports and review state.
- `blocklist`: hostname/pattern and reason.
- `api_keys`: prefix, SHA-256 key hash, scopes, use/revocation timestamps. Plaintext keys are never stored.
- `bulk_jobs`: fictional/actual CSV run summaries and validation errors, not uploaded CSV contents.
- `audit_logs`: actor, sensitive/admin action, target, metadata, timestamp.
- `webhooks`: reserved boundary only. Live signed delivery is **not enabled** in this demo; see Future improvements.

Foreign keys cascade account deletion to owned codes/scans/keys. Slugs, key hashes, aggregate code/day pairs, and relevant lookup columns have unique or standard indexes.

## API guide

### Public image generation

```http
GET /api/v1/qr?data=https%3A%2F%2Fexample.com&format=svg&size=512&color=%2314121F&bg=%23FFFFFF
```

- `data`: required, 1–2000 UTF-8 bytes.
- `format`: `svg` (default) or `png`.
- `size`: 64–2048; default 512.
- `color`, `bg`: optional six-digit hex colors.
- Limits: 120 requests/minute/IP. Responses include rate headers, CORS, nosniff, and browser/CDN cache directives. Over-capacity data returns 422.

### Authenticated endpoints

| Endpoint | Scope | Behavior |
|---|---|---|
| `GET /api/v1/codes` | `codes:read` | List owned dynamic codes. |
| `POST /api/v1/codes` | `codes:write` | Create a dynamic URL code; optional slug/expiry/limit. |
| `GET /api/v1/codes/:id` | `codes:read` | Read one owned dynamic code. |
| `PATCH /api/v1/codes/:id` | `codes:write` | Rename, change destination, pause, expire, or set limit. |
| `DELETE /api/v1/codes/:id` | `codes:write` | Move to 30-day trash, not immediate permanent deletion. |
| `GET /api/v1/analytics?id=:id` | `analytics:read` | Thirty-day privacy aggregates for an owned code. |
| `POST /api/reports` | Public, rate-limited | Submit an abuse/broken-code report. |

Create a key in **Settings → API keys**. It is shown once. Use `Authorization: Bearer qf_…` or `X-API-Key`.

#### curl

```bash
curl -X POST http://localhost:3000/api/v1/codes \
  -H "Authorization: Bearer qf_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Spring poster","destination":"https://example.com/spring"}'

curl http://localhost:3000/api/v1/codes/CODE_UUID \
  -H "Authorization: Bearer qf_YOUR_KEY"

curl -X PATCH http://localhost:3000/api/v1/codes/CODE_UUID \
  -H "Authorization: Bearer qf_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"destination":"https://example.org/new-spring","status":"active"}'

curl "http://localhost:3000/api/v1/analytics?id=CODE_UUID" \
  -H "Authorization: Bearer qf_YOUR_ANALYTICS_KEY"
```

#### JavaScript

```js
const response = await fetch("http://localhost:3000/api/v1/codes", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.QRFORGE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Spring poster",
    destination: "https://example.com/spring",
  }),
});
if (!response.ok) throw new Error(await response.text());
const { data } = await response.json();
console.log(data.slug, data.encoded);
```

#### Python

```python
import os
import requests

response = requests.post(
    "http://localhost:3000/api/v1/codes",
    headers={"Authorization": f"Bearer {os.environ['QRFORGE_API_KEY']}"},
    json={"name": "Spring poster", "destination": "https://example.com/spring"},
    timeout=15,
)
response.raise_for_status()
print(response.json()["data"]["slug"])
```

## Exact content encoding

All payload construction is in `src/lib/qr/encoders.ts`; tests should cover any change.

| Type | Format and behavior |
|---|---|
| URL | Adds `https://` when no scheme exists, parses with `URL`, permits only HTTP(S). |
| Text | Original UTF-8 string; byte length is measured with `TextEncoder`, not JavaScript character count. Emoji/non-ASCII use the encoder's byte handling. |
| Wi-Fi | `WIFI:T:WPA;S:SSID;P:password;H:false;;`. Encryption is `WPA`, `WEP`, or `nopass`. `\`, `;`, `,`, `:`, and `"` are backslash-escaped. Open networks emit an empty `P`. Hidden networks emit `H:true`. |
| vCard 3.0 | `BEGIN:VCARD`, `VERSION:3.0`, `N`, `FN`, `ORG`, `TITLE`, `TEL;TYPE=CELL`, `EMAIL;TYPE=INTERNET`, `ADR;TYPE=WORK`, `URL`, `END:VCARD`. Backslashes/newlines/semicolons/commas are escaped; CRLF and 75-octet UTF-8 folding are used. |
| Email | `mailto:recipient?subject=encoded%20subject&body=encoded%20body`. Recipient is validated and components are URI-encoded. |
| SMS | `sms:+12025550147?body=encoded%20message`. |
| Phone | `tel:+12025550147`; display spaces and common punctuation are removed. |
| Calendar | iCalendar `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID`, `BEGIN:VEVENT`, stable payload-derived `UID`, `DTSTAMP`, UTC `DTSTART`/`DTEND` in `YYYYMMDDTHHMMSSZ`, escaped `SUMMARY`/`LOCATION`/`DESCRIPTION`, then closing lines. CRLF and 75-octet folding. End must be after start. |
| Geo | `geo:45.515200,-122.678400`; latitude −90…90, longitude −180…180. |
| App store | Static uses the iOS URL when both exist and explains why. Dynamic uses the short link and iOS/Android/desktop routing. |
| Payment text | UPI `upi://pay?pa=…&pn=…&am=…&tn=…`, or Bitcoin `bitcoin:address?amount=…&label=…`. This is unverified text, not payment processing. |
| Multi-link | Dynamic-only short link to `/q/:slug`, which records an eligible scan and forwards to hosted `/p/:slug`. Up to eight labeled HTTP(S) links. |

## Scannability score and error correction

The score starts at 100 and subtracts for measured risks; it is clamped to 0–100. Labels: 85+ Excellent, 70+ Good—test print, 45+ Risky, below 45 Likely to fail.

- **Contrast:** relative luminance uses the WCAG channel formula. Minimum contrast across both gradient stops is used. Below 3:1 subtracts 42; 3–4.49:1 subtracts 18. At least 4.5:1 is recommended, with dark modules on light paper.
- **Inversion:** light modules on dark paper subtract 20 because some readers are unreliable with inverted codes.
- **Gradient imbalance:** a contrast spread greater than 5 subtracts 8.
- **Quiet zone:** under 2 modules subtracts 30; 2–3 subtracts 12; four or more is recommended.
- **Size:** default export below 256 px subtracts 12. PDF physical-size and SVG alternatives are offered.
- **Density:** matrix above 65 modules or payload above 700 bytes subtracts 24; above 45 modules/350 bytes subtracts 12.
- **Logo:** estimated area is `(logoWidthPercent / 100)^2`. Approximate recovery allowances are L 7%, M 15%, Q 25%, H 30%. Logo area above 75% of the chosen level's nominal allowance subtracts 25. A logo with L/M subtracts 10. These are conservative heuristics, not a guarantee of recoverability.
- **Fine dots:** dots on a matrix above 45 modules subtract 5.

Error correction adds redundancy but also increases version/density for the same payload. H is appropriate for many center logos, yet a large H code can be harder to print than a smaller-payload M code. Reduce payload and logo first, then increase physical size. Always test a physical proof under expected lighting, angle, distance, ink spread, and camera apps.

## Dynamic redirect lifecycle

1. `/q/:code` applies per-IP redirect rate limiting and looks up the dynamic code.
2. Removed/trashed, paused/archived, expired, and scan-limited states go to a friendly interstitial with abuse reporting.
3. Password-protected codes require an HTTP-only unlock cookie. The cookie contains an HMAC of code ID and current password hash, expires after one hour, and is invalidated by a password change.
4. Due schedules are evaluated in timestamp order. Each applied destination gets an `appliedAt`; the redirect handler and worker share the same evaluator, so either can apply it safely.
5. Non-URL dynamic types go to the hosted `/p/:slug` content page after eligible scan logging.
6. URL/app-store codes apply user-agent device overrides, optional time rules, coarse-region rules, and weighted A/B rules. User-agent routing is not fingerprinting.
7. The selected destination is normalized and checked again. Blocked destinations never continue. Caution destinations require explicit interstitial confirmation. Self-references are stopped.
8. Eligible scans are recorded and the code counter increments atomically; the redirect uses 307 and no-store/private headers.

Dynamic codes can stop when paused, expired, limited, moderated, deleted, offline, or when the account/plan lapses. **Convert to static** exports the current final payload without the QRForge short link.

## Privacy-friendly analytics

- A transient request IP and user agent are used to derive a hash: `SHA256(secretSalt:UTCday:IP:userAgent)`, truncated to 32 hex characters. The raw values go out of scope and are never inserted.
- The date is part of every hash, preventing cross-day identity linking. “Daily unique est.” sums distinct hashes inside each day; it is not a deduplicated count of people over the whole period.
- DNT `1` and `Sec-GPC: 1` skip event creation and counter increments. Owner opt-out does the same.
- Known crawler/link-preview user agents and prefetch purpose headers are excluded. This is heuristic, not a claim to catch every bot.
- Referrers are reduced to origin; query strings are discarded.
- Country/city uses a deterministic **offline demo lookup**, not a real geolocation claim. No third-party service receives an IP. For production, use a licensed local DB-IP Lite (CC BY 4.0) or GeoLite2 database, document attribution, update it regularly, and review whether city-level data is necessary.
- CSV contains event-level coarse fields and daily hashes but no raw IP/full user agent. Chart text equivalents are available.

## URL safety, SSRF, and abuse prevention

- Zod validates API inputs and ownership always comes from the session/key, never a client-supplied user ID.
- Only HTTP(S) destinations are accepted. `javascript:`, `data:`, `file:`, and other schemes are rejected.
- Literal private, loopback, link-local, carrier-grade NAT, multicast, documentation/internal IPv4/IPv6 ranges and local/internal hostnames are blocked. URL credentials are rejected.
- Creation, update, schedule, routing selection, and redirect repeat checks. Local and admin blocklists are enforced; a Safe Browsing API is optional and has a graceful local fallback.
- Heuristics flag HTTP, raw IP hosts, nested shorteners, punycode/lookalike patterns, unusual subdomain depth, and short-link chaining. Flags produce explanations, not guarantees.
- Slugs are random by default, reserved words are blocked, custom slugs are validated/collision-checked, and self-referencing redirects are rejected.
- Creation, login, unlock, reports, redirects, API keys, and the public image endpoint have rate boundaries. Counters use atomic SQL increments.
- Logo raster uploads are size/type checked and canvas re-encoded. SVG frame text and accessible descriptions are escaped.
- Admin actions and sensitive operations create audit records. Admin can disable/restore codes, resolve reports, manage blocklist entries, and change simulated plans.

**Production hardening still required:** resolve DNS and pin validated egress addresses if the server ever fetches destinations, protect against DNS rebinding, deploy distributed rate limits, add CSRF tokens for any cross-site credential context, run security review/penetration tests, encrypt sensitive secrets, and establish moderation staffing/appeals.

## Bulk CSV format

```csv
name,url,preset
Spring menu,https://example.com/menu,Print-safe
Feedback card,https://example.com/feedback,Candy
Portfolio,https://example.com/portfolio,Minimal
```

- Header row required; column matching is case-insensitive and trimmed. `destination` can be selected instead of `url` in the mapper.
- `name` becomes a sanitized filename. `preset` is optional and defaults to Minimal.
- Maximum source file 2 MB; first 200 valid rows per run. Remaining rows are not silently exported.
- Invalid URLs, private/local destinations, local blocklist matches, empty names, and unknown presets appear per row.
- Leading `=`, `+`, `-`, or `@` cells receive a text prefix to reduce spreadsheet formula injection. Quotes are escaped in generated manifests/error CSV.
- Duplicate filenames get numeric suffixes. Work yields to animation frames every few rows, and the progress counter reflects completed items.

## Reader safety flags

The reader uses jsQR on camera frames or uploaded image pixels in the browser. It handles permission denial/no camera with image upload and reports unreadable/damaged inputs. Parsed Wi-Fi passwords are masked in the readable summary while raw content remains available deliberately.

HTTP(S)-looking results are checked locally for non-HTTPS transport, raw/private IP hosts, common shorteners, punycode/lookalike patterns, excessive subdomain depth, and the demonstration blocklist. Caution links require confirmation; blocked links have no open action. “No heuristic warnings” explicitly does **not** mean safe. Nothing is sent to a server for decoding or inspection.

## Add a content type, frame, preset, or template

### Content type

1. Add the union value and metadata in `src/lib/qr/types.ts` and any fields to `ContentValues`/`defaultValues`.
2. Add a validated encoder branch in `src/lib/qr/encoders.ts`; use exact escaping and UTF-8 byte measurement.
3. Add the corresponding form in `ContentForm.tsx` and readable reader parsing if relevant.
4. Extend the server Zod content handling without weakening validation, add seed examples, API/documentation copy, and unit tests for delimiters, Unicode, empty values, and capacity.
5. Decide whether dynamic means redirect or hosted content; never silently turn a non-HTTP payload into a redirect.

### Frame

Add metadata to `FRAME_TEMPLATES` and an original branch in `frameWrap()` in `render.ts`. Preserve quiet zone, aspect ratio, text escaping, and SVG/PNG/PDF parity. Test long CTA text and both themes.

### Preset

Add an entry to `PRESETS` with three swatches and a partial `QrDesign`. Measure both gradient stops against the background; do not label a low-contrast preset Print-safe.

### Print template

Add an authored `PrintTemplate` in `src/config/templates.ts`, a physical branch in `templateExport.ts`, and preview adjustments in `TemplateStudio.tsx`. Include production guidance, exact dimensions, safe payload defaults using reserved domains, and fold/trim tests where applicable.

## Fictional demo accounts and codes

All use password **`demo1234`**.

| Account | Role / plan | Purpose |
|---|---|---|
| `user@qrforge.test` | user / Free | Populated library, folders, analytics; eight seeded dynamic codes, below the 10-code cap. |
| `pro@qrforge.test` | user / simulated Pro | Additional dynamic-code examples and higher cap. |
| `admin@qrforge.test` | admin / simulated Pro | Users, codes, reports, blocklist, audit, platform charts. |

Useful seeded slugs:

- `/q/menu-spring` — active URL with a small seeded A/B routing rule.
- `/q/wifi-sample` — hosted dynamic Wi-Fi content.
- `/q/multilink-sample` — hosted multi-link page through the short-link logger.
- `/q/paused-demo` — paused interstitial.
- `/q/expired-demo` — expired interstitial.
- `/q/secret-menu` — password protected; password `demo1234`.
- `/q/flagged-demo` — blocked fictional phishing destination/interstitial.
- `/q/schedule-demo` — app-store code with a destination scheduled a few minutes after seeding.
- The final seeded static code is in trash to demonstrate restore.

The seed includes 15 users, 60 codes across every type in static and dynamic forms, 12 folders, several weeks of fictional scans, six reports in different states, three brand kits, a bulk job with validation errors, and local blocklist entries. Re-seeding an existing nonempty database does not overwrite it.

## Simulated Pro plan and Stripe test-mode note

The implemented gateway is deliberately **simulated**. Pricing calls `/api/billing` with explicit `SIMULATED` confirmation and flips the demo plan. It does not load Stripe, collect a card, create a real subscription, or claim a charge occurred. Never enter a real card anywhere in QRForge.

If a future integration uses Stripe test mode, use Stripe-hosted Checkout and Stripe's documented test card **`4242 4242 4242 4242`**, any future expiry, any CVC, and any postal code **only on Stripe's test checkout**. Verify signed Stripe webhooks, reconcile subscription state server-side, and never log/store card data. That integration is not present here; the test card is documentation for future development, not a hidden working checkout.

## Deployment

### Application on Vercel

1. Import the repository and set `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, and `ANALYTICS_SALT`.
2. Use a pooled PostgreSQL connection where appropriate. Run `npx drizzle-kit push` from a controlled migration step, not on every serverless invocation.
3. Build with `npm run build`. Set Google OAuth redirect to `https://YOUR_DOMAIN/api/auth/google/callback` if enabling it.
4. Replace in-memory rate limits/SSE with shared infrastructure for multi-region production. Server-sent events require a runtime that supports long-lived responses.

### Database on Neon or Supabase

Create a PostgreSQL database, set the pooled `DATABASE_URL`, retain direct connection access for schema changes, and enable backups. Test SSL options required by the provider. Apply the Drizzle schema and run the seed only in the intended demo environment.

### Worker on Render or Railway

Use the same repository and secrets, a Node background-worker service, and start command:

```bash
npx tsx worker/index.ts
```

For production, compile the worker in the build image rather than relying on development `tsx`, use a single scheduler replica or distributed locks, and monitor failures. `/q` also applies due schedules as a resilience fallback.

## Legal, privacy, and compliance notes

**These notes are not legal advice. Requirements vary by country, audience, data flow, and deployment. Obtain qualified legal, privacy, accessibility, and security advice before any real launch.**

- **QR trademark:** QR Code is a registered trademark of Denso Wave Incorporated. Do not imply endorsement or reuse another provider's name/logo/assets.
- **Privacy notice and consent:** publish actual controller/contact details, purposes, lawful bases, retention, processors, international transfers, cookies/SDK behavior, and user rights. Assess consent requirements for analytics; privacy-friendly design does not automatically create a lawful basis or eliminate GDPR/ePrivacy duties.
- **GDPR/data rights:** test access, portability, correction, objection, restriction, erasure, retention, breach response, DPIA thresholds, child-data rules, and processor contracts. Hashes can still be personal data in context.
- **Abuse and quishing:** maintain acceptable-use terms, easy reports, timely review, destination rechecks, emergency disable, evidence handling, appeals, and cooperation processes. QR phishing can cause serious harm; heuristics are not enough.
- **Terms and continuity:** disclose static/dynamic differences, plan-lapse and deletion behavior, availability limits, export options, acceptable use, refunds, and liability terms without deceptive urgency or hidden paywalls.
- **DMCA/copyright:** provide notice-and-takedown and repeat-infringement processes where applicable. Users must have rights to uploaded logos and template content.
- **vCards/personal data:** minimize encoded personal data, warn about public Wi-Fi passwords and sensitive event/contact fields, and provide deletion/export paths.
- **Payments:** payment text is not recipient verification or financial processing. A real payment feature needs separate regulatory/security review.
- **Tracking limits:** no advertising profiles, cross-day identifiers, fingerprinting, or precise location should be added without a new legal/ethical review. Country/city collection may be unnecessary; collect less where possible.
- **Accessibility:** WCAG conformance requires ongoing manual keyboard, screen-reader, zoom, contrast, physical-print, and mobile testing. Automated UI contrast does not certify QR readability.

## Media and data credits

All configurable sources and fallbacks are grouped in `src/config/media.ts`.

| Source | Use | License / note |
|---|---|---|
| OpenStreetMap | Geo-picker tiles and attribution | ODbL 1.0; https://www.openstreetmap.org/copyright |
| Unsplash contributors | Four use-case photographs | Unsplash License; https://unsplash.com/license. Paper-gradient fallback included. |
| Space Grotesk, Inter, JetBrains Mono | Interface and print text | Google Fonts, SIL Open Font License 1.1. Exports use local/system fallbacks unless fonts are installed. |
| Phosphor Icons | Interface icons | MIT; https://phosphoricons.com |
| DiceBear Shapes | Seeded avatar URLs | See current DiceBear style/license terms; fictional seeds only. |
| Offline region data | Deterministic fictional demo region | Original mock lookup; no external IP API. Production DB-IP Lite is CC BY 4.0; MaxMind GeoLite2 has its own license/attribution. |
| Denso Wave | Trademark acknowledgment only | No logo or proprietary assets used. |
| Lottie/audio | Not bundled | No animation or audio is hotlinked or autoplayed. Optional future CC0 sound must remain off by default. |

Print mockups, QR frames, presets, social artwork, and favicon are original CSS/SVG work in this repository.

## Future improvements

- Production-tested Vitest coverage in CI for every encoder/folding edge, DNS-rebinding defenses, distributed rate limits, and end-to-end physical scan suites.
- Durable HMAC-signed webhook deliveries with encrypted secrets, raw-body timestamps, SSRF-safe egress, retries/backoff, and delivery UI. Current webhook schema/docs do not claim active delivery.
- Real licensed offline geo database with a documented update process, or country-only collection.
- Team workspaces with granular roles and shared folders; database models would need explicit membership and authorization invariants.
- Real Stripe-hosted test/production billing, subscription reconciliation, and signed webhooks.
- Additional offline packaging for fully reproducible builds and locally self-hosted fonts/tiles.
- More languages, optional rule-based style-description assistant, and a clearly labeled bookmarklet. None is presented as active in this version.

## Verification checklist

1. Create every content type; inspect exact payload text and Unicode/Wi-Fi/vCard/iCalendar escaping.
2. Change every preset, dot/corner style, gradient, quiet zone, EC level, logo, and all frames; watch scan-score explanations.
3. Export PNG/SVG/PDF/copy/text equivalent; open the files and verify physical PDF dimensions/bleed.
4. Save static and dynamic codes; edit, schedule, pause, expire, password-protect, route, convert to static, trash, and restore.
5. Test safe, caution, blocked, private-IP, self-loop, removed, and bot/DNT redirect paths.
6. Generate and export a CSV with malformed rows, duplicate names, formula prefixes, and 200+ rows.
7. Export each print template and inspect its unique layout.
8. Scan with camera and images, deny permission, try damaged codes, and inspect every safety flag.
9. Sign in with all three demo accounts; verify plan caps, key scopes/rotation, data export, mock emails, and deletion cancellation.
10. Review admin moderation/audit views and run worker jobs plus fictional scan simulation.
11. Toggle light/dark and reduced motion; test keyboard shortcuts, mobile bottom tabs, 320px width, tablet panes, and desktop studio.

## License

Source code is provided for learning and demonstration under the **MIT License**. Third-party libraries, fonts, icons, photography, and map data retain their respective licenses. No rights to third-party trademarks are granted.
