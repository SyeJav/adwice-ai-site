import nextEnv from "@next/env";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { ANALYZER_QUEUE } from "../server/website-analyzer/queue";
import { buildWebsiteAnalysis } from "../server/website-analyzer/analyze";
import { getAnalysis, saveAnalysis } from "../server/website-analyzer/storage";
import { getAnalyzerRedis } from "../server/website-analyzer/redis";
import { AnalyzerFetchError } from "../server/website-analyzer/safe-fetch";
import type { AnalysisRecord } from "../server/website-analyzer/types";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.REDIS_URL) throw new Error("Set REDIS_URL in the process environment or the project's .env.local file before starting the Website Analyzer worker.");
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const worker = new Worker<{ analysisId: string }>(ANALYZER_QUEUE, async (job) => {
  const record = await getAnalysis(job.data.analysisId);
  if (!record) throw new Error("Analysis record expired before the worker started.");
  const update = async (status: AnalysisRecord["status"], progress: number, currentStep: string) => {
    const fresh = await getAnalysis(record.id) || record;
    await saveAnalysis({ ...fresh, status, progress, currentStep, updatedAt: new Date().toISOString() });
  };
  console.info(JSON.stringify({ event: "website_analysis_started", analysisId: record.id, hostname: new URL(record.normalizedUrl).hostname }));
  const startedAt = Date.now();
  try {
    const report = await buildWebsiteAnalysis(record, update);
    const fresh = await getAnalysis(record.id) || record;
    await saveAnalysis({ ...fresh, status: "completed", progress: 100, currentStep: "Your report is ready.", updatedAt: new Date().toISOString(), report });
    console.info(JSON.stringify({ event: "website_analysis_completed", analysisId: record.id, pages: report.meta.pagesCrawled, durationMs: Date.now() - startedAt }));
  } catch (error) {
    const fresh = await getAnalysis(record.id) || record;
    const message = error instanceof Error ? error.message : "The website could not be analyzed.";
    const willRetry = job.attemptsMade + 1 < Number(job.opts.attempts || 1) && !(error instanceof AnalyzerFetchError && error.code !== "WEBSITE_UNREACHABLE");
    if (willRetry) {
      await saveAnalysis({ ...fresh, status: "queued", progress: 0, currentStep: "A temporary issue came up. Retrying your analysis...", updatedAt: new Date().toISOString() });
      throw error;
    }
    const failureCode = error instanceof AnalyzerFetchError ? error.code : "ANALYSIS_FAILED";
    const userMessage = error instanceof AnalyzerFetchError ? error.message : "We could not complete the analysis. Check the URL and try again.";
    await saveAnalysis({ ...fresh, status: "failed", progress: 100, currentStep: "We could not complete this analysis.", updatedAt: new Date().toISOString(), error: { code: failureCode, message: userMessage } });
    console.error(JSON.stringify({ event: "website_analysis_failed", analysisId: record.id, durationMs: Date.now() - startedAt, reason: message.slice(0, 180) }));
    throw error;
  }
}, { connection, concurrency: 2 });
worker.on("error", (error) => console.error("Website Analyzer worker error.", error.message));
const shutdown = async () => { await worker.close(); await connection.quit(); await getAnalyzerRedis().quit(); process.exit(0); };
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
console.info("Website Analyzer worker is listening.");
