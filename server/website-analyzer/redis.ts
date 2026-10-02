import Redis from "ioredis";

let redis: Redis | undefined;
export function getAnalyzerRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Website Analyzer requires REDIS_URL.");
  if (!redis) redis = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true, lazyConnect: false });
  return redis;
}
