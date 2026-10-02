import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAnalyzerQueue } from "../../../server/website-analyzer/queue";
import { allowAnalysis, cacheAnalysis, getCachedAnalysis, saveAnalysis } from "../../../server/website-analyzer/storage";
import { AnalyzerFetchError, normalizeWebsiteUrl, safeCheckUrl } from "../../../server/website-analyzer/safe-fetch";
import type { AnalysisRecord } from "../../../server/website-analyzer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const requestSchema = z.object({ url: z.string().trim().min(3).max(2048) });
const jsonError = (code: string, message: string, status: number) => Response.json({ success: false, error: { code, message } }, { status });

export async function POST(request: Request) {
  if (process.env.WEBSITE_ANALYZER_ENABLED === "false") return jsonError("ANALYZER_DISABLED", "Website analysis is temporarily unavailable.", 503);
  let raw: unknown;
  try { raw = await request.json(); } catch { return jsonError("INVALID_WEBSITE_URL", "Please enter a valid website URL.", 400); }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return jsonError("INVALID_WEBSITE_URL", "Please enter a valid website URL.", 400);
  let url: URL;
  try { url = normalizeWebsiteUrl(parsed.data.url); }
  catch (error) { const failure = error instanceof AnalyzerFetchError ? error : null; return jsonError(failure?.code || "INVALID_WEBSITE_URL", failure?.message || "Please enter a valid public website URL.", 422); }
  try { await safeCheckUrl(url); }
  catch (error) {
    const failure = error instanceof AnalyzerFetchError ? error : null;
    return jsonError(failure?.code || "WEBSITE_UNREACHABLE", failure?.message || "We could not verify this website address.", 422);
  }
  try {
    const cached = await getCachedAnalysis(url.href);
    if (cached && cached.status !== "failed" && cached.status !== "completed") {
      return Response.json({ success: true, analysisId: cached.id, status: cached.status, url: url.href, cached: true }, { status: 202 });
    }
    if (cached?.status === "completed" && cached.report) {
      const id = `wa_${randomUUID().replaceAll("-", "")}`;
      const report = { ...cached.report, id, requestedUrl: parsed.data.url, normalizedUrl: url.href, meta: { ...cached.report.meta, cached: true } };
      const record: AnalysisRecord = { id, requestedUrl: parsed.data.url, normalizedUrl: url.href, status: "completed", progress: 100, currentStep: "Your report is ready.", updatedAt: new Date().toISOString(), report };
      await saveAnalysis(record);
      return Response.json({ success: true, analysisId: id, status: "completed", url: url.href, cached: true });
    }
    // Use the last proxy-added address; the app is expected to sit behind the configured reverse proxy.
    const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
    const ip = request.headers.get("x-real-ip") || forwarded?.at(-1) || "unknown";
    if (!(await allowAnalysis(ip))) return jsonError("ANALYSIS_RATE_LIMITED", "You have reached the hourly analysis limit. Please try again later.", 429);
    const id = `wa_${randomUUID().replaceAll("-", "")}`;
    const record: AnalysisRecord = { id, requestedUrl: parsed.data.url, normalizedUrl: url.href, status: "queued", progress: 0, currentStep: "Your analysis is queued.", updatedAt: new Date().toISOString() };
    await saveAnalysis(record);
    await getAnalyzerQueue().add("analyze", { analysisId: id }, { jobId: id });
    await cacheAnalysis(url.href, id);
    return Response.json({ success: true, analysisId: id, status: "queued", url: url.href, cached: false }, { status: 202 });
  } catch (error) {
    console.error("Website Analyzer could not queue a scan.", error instanceof Error ? error.message : "unknown error");
    return jsonError("ANALYZER_UNAVAILABLE", "Website analysis is temporarily unavailable. Please try again shortly.", 503);
  }
}
