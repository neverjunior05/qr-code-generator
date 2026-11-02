import cron from "node-cron";
import { ensureSeed } from "@/db/seed";
import { applySchedules } from "./jobs/applySchedules";
import { expireCodes } from "./jobs/expireCodes";
import { purgeTrash } from "./jobs/purgeTrash";
import { aggregateScans } from "./jobs/aggregateScans";
import { deleteAccounts } from "./jobs/deleteAccounts";

async function run(name: string, job: () => Promise<unknown>) { try { const result = await job(); console.info(`[QRForge worker] ${name}`, result); } catch (error) { console.error(`[QRForge worker] ${name} failed`, error); } }
await ensureSeed(); console.info("[QRForge worker] Started. Ctrl+C to stop.");
cron.schedule("* * * * *", () => { void run("applySchedules", applySchedules); void run("expireCodes", expireCodes); });
cron.schedule("*/5 * * * *", () => void run("aggregateScans", aggregateScans));
cron.schedule("17 * * * *", () => { void run("purgeTrash", purgeTrash); void run("deleteAccounts", deleteAccounts); });
void run("initial-schedules", applySchedules); void run("initial-aggregation", aggregateScans);
