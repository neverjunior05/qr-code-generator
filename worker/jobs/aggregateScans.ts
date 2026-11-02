import { sql } from "drizzle-orm";
import { db } from "@/db";
export async function aggregateScans() { await db.execute(sql`insert into daily_aggregates (code_id, day, total, unique_count, updated_at) select code_id, day, count(*)::int, count(distinct visitor_hash)::int, now() from scan_events where scanned_at > now() - interval '35 days' group by code_id, day on conflict (code_id, day) do update set total = excluded.total, unique_count = excluded.unique_count, updated_at = now()`); return true; }
