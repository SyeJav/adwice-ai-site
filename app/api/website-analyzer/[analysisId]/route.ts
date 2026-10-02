import { getAnalyzerQueue } from "../../../../server/website-analyzer/queue";
import { getAnalysis, saveAnalysis } from "../../../../server/website-analyzer/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const validId = /^wa_[\da-f]{32}$/i;

export async function GET(_request: Request, context: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await context.params;
  if (!validId.test(analysisId)) return Response.json({ success: false, error: { code: "ANALYSIS_NOT_FOUND", message: "This report could not be found." } }, { status: 404 });
  try {
    let analysis = await getAnalysis(analysisId);
    if (!analysis) return Response.json({ success: false, error: { code: "ANALYSIS_NOT_FOUND", message: "This report may have expired or could not be found." } }, { status: 404 });

    // BullMQ can fail a job after its worker disappears or loses its lock.
    // That failure happens outside the processor's try/catch, so reconcile
    // the public report record here instead of polling "fetching" forever.
    if (analysis.status !== "completed" && analysis.status !== "failed") {
      const job = await getAnalyzerQueue().getJob(analysisId);
      if (job && await job.getState() === "failed") {
        const stalled = job.failedReason?.includes("stalled") || job.failedReason?.includes("lock");
        analysis = {
          ...analysis,
          status: "failed",
          progress: 100,
          currentStep: "We could not complete this analysis.",
          updatedAt: new Date().toISOString(),
          error: {
            code: stalled ? "ANALYSIS_WORKER_INTERRUPTED" : "ANALYSIS_FAILED",
            message: stalled
              ? "The analysis worker stopped before finishing. Please start a new analysis."
              : "We could not complete the analysis. Please try again.",
          },
        };
        await saveAnalysis(analysis);
      }
    }
    return Response.json({ success: true, analysis });
  } catch (error) {
    console.error("Website Analyzer status lookup failed.", error instanceof Error ? error.message : "unknown error");
    return Response.json({ success: false, error: { code: "ANALYZER_UNAVAILABLE", message: "This report is temporarily unavailable." } }, { status: 503 });
  }
}
