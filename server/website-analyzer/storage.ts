import { createHash } from "node:crypto";
import { getAnalyzerRedis } from "./redis";
import type { AnalysisRecord } from "./types";

const TTL = Math.max(1, Number(process.env.WEBSITE_ANALYZER_CACHE_HOURS || 24)) * 3600;
const recordKey = (id: string) => `wa:record:${id}`;
export function analysisCacheKey(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  return `wa:cache:${createHash("sha256").update(parsed.href).digest("hex")}`;
}
export async function saveAnalysis(record: AnalysisRecord): Promise<void> {
  await getAnalyzerRedis().set(recordKey(record.id), JSON.stringify(record), "EX", TTL);
}
export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const raw = await getAnalyzerRedis().get(recordKey(id));
  if (!raw) return null;
  try { return JSON.parse(raw) as AnalysisRecord; } catch { return null; }
}
export async function getCachedAnalysis(url: string): Promise<AnalysisRecord | null> {
  const id = await getAnalyzerRedis().get(analysisCacheKey(url));
  return id ? getAnalysis(id) : null;
}
export async function cacheAnalysis(url: string, id: string): Promise<void> {
  await getAnalyzerRedis().set(analysisCacheKey(url), id, "EX", TTL);
}
export async function allowAnalysis(ip: string): Promise<boolean> {
  const limit = Math.max(1, Number(process.env.WEBSITE_ANALYZER_RATE_LIMIT || 3));
  const key = `wa:rate:${createHash("sha256").update(ip).digest("hex")}`;
  const redis = getAnalyzerRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return count <= limit;
}
