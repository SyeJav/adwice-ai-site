import { Queue } from "bullmq";
import { getAnalyzerRedis } from "./redis";

export const ANALYZER_QUEUE = "website-analyzer";
let queue: Queue | undefined;
export function getAnalyzerQueue(): Queue {
  if (!queue) queue = new Queue(ANALYZER_QUEUE, { connection: getAnalyzerRedis(), defaultJobOptions: { attempts: 2, backoff: { type: "exponential", delay: 3000 }, removeOnComplete: { age: 3600 }, removeOnFail: { age: 86400 } } });
  return queue;
}
