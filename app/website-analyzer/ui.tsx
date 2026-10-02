"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AnalysisRecord, CategoryKey, WebsiteAnalysisReport, WebsiteCheckResult, WebsiteRecommendation } from "../../server/website-analyzer/types";

export function AnalyzerForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/website-analyzer", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ url }) });
      const result = await response.json() as { analysisId?: string; error?: { message?: string } };
      if (!response.ok || !result.analysisId) throw new Error(result.error?.message || "We couldn’t start the analysis. Please try again.");
      router.push(`/website-analyzer/report/${result.analysisId}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "We couldn’t start the analysis. Please try again."); setBusy(false); }
  }
  return <form className="analyzerForm" onSubmit={submit}>
    <div className="analyzerFormTop"><span className="analyzerFormIcon">↗</span><div><p>Start with your website</p><small>We’ll take a closer look at the pages customers see.</small></div></div>
    <label htmlFor="analyzer-url">Website address</label>
    <div className="analyzerInputWrap"><span aria-hidden="true">https://</span><input id="analyzer-url" name="url" type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" value={url} onChange={(event) => setUrl(event.target.value)} required minLength={3} maxLength={2048} disabled={busy} /></div>
    <button className="analyzerSubmit" type="submit" disabled={busy || !url.trim()}>{busy ? <><i className="buttonSpinner" /> Starting your review…</> : <>Analyze my website <b>↗</b></>}</button>
    {error && <p className="analyzerError" role="alert">{error}</p>}
    <p className="analyzerPrivacy">Public pages only. We don’t need a login or website access.</p>
  </form>;
}

const steps = ["Checking website availability...", "Analyzing important pages...", "Checking search visibility...", "Evaluating Google Ads readiness...", "Reviewing customer actions...", "Preparing recommendations..."];
const progressStep: Record<AnalysisRecord["status"], number> = { queued: 0, validating: 0, fetching: 0, crawling: 1, extracting: 1, performance_analysis: 2, technical_analysis: 1, seo_analysis: 2, ux_analysis: 2, ads_analysis: 3, conversion_analysis: 4, ai_analysis: 5, scoring: 5, completed: 5, failed: 5 };
const categoryNames: Record<CategoryKey, string> = { technical: "Technical", ux: "User experience", seo: "SEO", googleAds: "Google Ads", conversion: "Conversions", performance: "Performance", trust: "Trust" };
const checkSymbol: Record<WebsiteCheckResult["status"], string> = { pass: "✓", warning: "!", fail: "×", info: "i", not_applicable: "–" };

export function AnalyzerReport({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allChecksOpen, setAllChecksOpen] = useState(false);
  const inFlight = useRef(false);
  const hasReportRecord = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const response = await fetch(`/api/website-analyzer/${analysisId}`, { cache: "no-store" });
        const result = await response.json() as { analysis?: AnalysisRecord; error?: { message?: string } };
        if (!response.ok || !result.analysis) throw new Error(result.error?.message || "This report could not be loaded.");
        if (!active) return;
        setAnalysis(result.analysis); setError(""); hasReportRecord.current = true;
        if (result.analysis.status !== "completed" && result.analysis.status !== "failed") timer = setTimeout(poll, 2400);
      } catch (failure) {
        if (!active) return;
        setError(failure instanceof Error ? failure.message : "This report could not be loaded.");
        if (hasReportRecord.current) timer = setTimeout(poll, 2400);
      } finally { inFlight.current = false; }
    }
    void poll();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [analysisId]);

  if (error && !analysis) return <section className="reportMessage"><span>!</span><h1>We couldn’t open this report.</h1><p>{error}</p><Link className="analyzerSubmit" href="/website-analyzer">Try another website</Link></section>;
  if (!analysis || (analysis.status !== "completed" && analysis.status !== "failed")) {
    const message = analysis?.currentStep || "Preparing your analysis...";
    const activeStep = analysis ? progressStep[analysis.status] : 0;
    return <section className="reportLoading"><div className="loadingOrbit"><span>W</span><i /></div><p className="sectionTag">A closer look at your website</p><h1>Finding your <em>next opportunity.</em></h1><p className="loadingMessage">{message}</p><div className="progressTrack"><span style={{ width: `${analysis?.progress || 7}%` }} /></div><div className="progressMeta"><span>{analysis?.progress || 7}% complete</span><span>{analysis?.normalizedUrl || "Checking your website"}</span></div><div className="loadingSteps">{steps.map((step, index) => <div key={step} className={index <= activeStep ? "active" : ""}><i>{index < activeStep ? "✓" : `0${index + 1}`}</i>{step.replaceAll("...", "")}</div>)}</div></section>;
  }
  if (analysis.status === "failed" || !analysis.report) return <section className="reportMessage"><span>×</span><h1>The analysis didn’t finish.</h1><p>{analysis.error?.message || "The website may block automated requests or be temporarily unavailable."}</p><Link className="analyzerSubmit" href="/website-analyzer">Try another website</Link></section>;
  return <Report report={analysis.report} expanded={expanded} setExpanded={setExpanded} allChecksOpen={allChecksOpen} setAllChecksOpen={setAllChecksOpen} />;
}

function Report({ report, expanded, setExpanded, allChecksOpen, setAllChecksOpen }: { report: WebsiteAnalysisReport; expanded: string | null; setExpanded: (value: string | null) => void; allChecksOpen: boolean; setAllChecksOpen: (value: boolean) => void }) {
  const arc = Math.round((report.summary.overallScore / 100) * 282);
  return <main className="reportPage">
    <header className="reportTop shell"><Link href="/website-analyzer">← Website Analyzer</Link><span>REPORT <b>·</b> {new Date(report.analyzedAt).toLocaleDateString()}</span><Link href="/website-analyzer">Analyze another website ↗</Link></header>
    <section className="reportHero shell">
      <div className="reportHeroCopy"><p className="sectionTag"><span className="analyzerPulse" /> YOUR WEBSITE REVIEW</p><h1>{report.website.businessName || new URL(report.normalizedUrl).hostname}</h1><a className="reportUrl" href={report.normalizedUrl} target="_blank" rel="noopener noreferrer">{new URL(report.normalizedUrl).hostname} ↗</a><p>{report.summary.message}</p><div className="reportCounters"><span><b>{report.summary.checksTotal}</b> checks reviewed</span><span><b>{report.meta.pagesCrawled}</b> pages analyzed</span><span><b>{report.summary.warnings + report.summary.failed}</b> opportunities</span></div></div>
      <div className="scoreBadge"><svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="45" /><circle className="scoreArc" cx="52" cy="52" r="45" style={{ strokeDasharray: `${arc} 282` }} /></svg><div><strong>{report.summary.overallScore}</strong><span>out of 100</span></div><b className="scoreRating">{report.summary.rating}</b></div>
    </section>
    <section className="reportContent shell">
      <div className="reportSectionHeading"><div><p className="sectionTag">The overview</p><h2>How your website is doing</h2></div><p>Each category is based on specific signals found on your website.</p></div>
      <div className="scoreGrid">{report.categories.map((category) => <article className="scoreCard" key={category.id}><div><span>{categoryNames[category.id]}</span><i className={category.issueCount ? "hasIssues" : ""}>{category.score === null ? "—" : category.issueCount || "✓"}</i></div><strong>{category.score ?? "—"}<small>{category.score === null ? "not measured" : "/100"}</small></strong><div className="scoreTrack"><span style={{ width: `${category.score ?? 0}%` }} /></div><p>{category.status} <b>·</b> {category.score === null ? "Provider unavailable" : category.issueCount ? `${category.issueCount} to review` : "Looking good"}</p></article>)}</div>
      <div className="reportSectionHeading prioritiesHeading"><div><p className="sectionTag">Your first moves</p><h2>Top priorities</h2></div><p>Start with changes that make your offer and next step easier to understand.</p></div>
      <div className="recommendationList">{report.topRecommendations.length ? report.topRecommendations.map((item, index) => <RecommendationCard key={item.id} item={item} number={index + 1} expanded={expanded === item.id} onToggle={() => setExpanded(expanded === item.id ? null : item.id)} />) : <div className="emptyRecommendations">Your main website signals look healthy. Keep your service information clear and your contact options up to date.</div>}</div>
      <section className="readinessGrid"><article className="readinessCard adsReadiness"><div className="readinessHead"><div><p className="sectionTag">Paid search</p><h2>Google Ads readiness</h2></div><b>{report.googleAdsReadiness.score}<small>/100</small></b></div><p>A quick view of how well your pages support paid search visitors.</p><div className="readinessList">{report.categories.find((item) => item.id === "googleAds")?.checks.map((check) => <CheckRow key={check.id} check={check} expanded={expanded === check.id} onToggle={() => setExpanded(expanded === check.id ? null : check.id)} />)}</div>{report.keywordIntelligence.length > 0 && <div className="keywordArea"><h3>Searches your pages may support</h3>{report.keywordIntelligence.map((keyword) => <div className="keywordRow" key={keyword.keyword}><span><b>{keyword.keyword}</b><small>{keyword.bestLandingPage ? new URL(keyword.bestLandingPage).pathname || "/" : "/"}</small></span><strong>{keyword.landingPageScore}<small>/100 match</small></strong></div>)}</div>}<div className="missingInfo"><b>Opportunity to strengthen</b><p>{report.googleAdsReadiness.missingInformation.length ? report.googleAdsReadiness.missingInformation.join(" · ") : "Keep your service and location details consistent across the relevant pages."}</p></div></article>
        <article className="readinessCard conversionReadiness"><div className="readinessHead"><div><p className="sectionTag">Make it easy</p><h2>Visitor to customer</h2></div><b>{report.conversionReadiness.score}<small>/100</small></b></div><p>Contact and purchase paths detected on the pages we reviewed.</p><div className="actionPills">{report.conversionReadiness.detectedActions.length ? report.conversionReadiness.detectedActions.map((action) => <span key={action}><i>✓</i>{action}</span>) : <span className="notFound"><i>!</i>No clear contact action detected</span>}</div><div className="missingInfo"><b>Not clearly detected</b><p>{report.conversionReadiness.missingSignals.length ? report.conversionReadiness.missingSignals.join(" · ") : "Your key contact paths are visible. Confirm that successful actions are measured."}</p></div><div className="conversionFoot"><span>{report.website.ecommerce ? "Online store signals found" : "Service business review"}</span><span>{report.meta.aiUsed ? "Copy reviewed" : "Evidence-led review"}</span></div></article></section>
      <section className="allChecksSection"><div className="allChecksHeader"><div><p className="sectionTag">The detail</p><h2>Website checks</h2></div><button type="button" onClick={() => setAllChecksOpen(!allChecksOpen)}>{allChecksOpen ? "Collapse checks" : `View all ${report.summary.checksTotal} checks`} <b>{allChecksOpen ? "−" : "+"}</b></button></div>{allChecksOpen && <div className="checkGroups">{report.categories.map((category) => <section key={category.id}><div className="checkGroupTitle"><h3>{category.name}</h3><b>{category.score}/100</b></div>{category.checks.map((check) => <CheckRow key={check.id} check={check} expanded={expanded === check.id} onToggle={() => setExpanded(expanded === check.id ? null : check.id)} />)}</section>)}</div>}</section>
      <section className="reportCta"><div><p className="sectionTag">Put your next step to work</p><h2>Ready to advertise your business?</h2><p>Use Adwice to plan a Google and Meta campaign around the customers you want to reach.</p></div><Link className="analyzerSubmit" href="/#planner">Plan my campaign <b>↗</b></Link></section>
      <p className="reportFinePrint">This report is an automated review of publicly available pages. Website content and external performance measurements can change over time.</p>
    </section>
  </main>;
}

function RecommendationCard({ item, number, expanded, onToggle }: { item: WebsiteRecommendation; number: number; expanded: boolean; onToggle: () => void }) {
  return <article className={`recommendationCard ${expanded ? "expanded" : ""}`}><button type="button" className="recommendationTrigger" onClick={onToggle} aria-expanded={expanded}><span className="recommendationNumber">0{number}</span><span className="recommendationText"><small>{item.priority} priority <b>·</b> {item.impact} impact</small><strong>{item.title}</strong><em>{item.problem}</em></span><span className="recommendationToggle">{expanded ? "−" : "+"}</span></button>{expanded && <div className="recommendationDetail"><p><b>What we found</b><span>{Object.entries(item.evidence).slice(0, 3).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join(" · ") || item.problem}</span></p><p><b>Try this</b><span>{item.recommendation}</span></p><p><b>Why it helps</b><span>{item.expectedBenefit}</span></p></div>}</article>;
}

function CheckRow({ check, expanded, onToggle }: { check: WebsiteCheckResult; expanded: boolean; onToggle: () => void }) {
  return <article className={`checkRow check-${check.status}`}><button type="button" onClick={onToggle} aria-expanded={expanded}><i>{checkSymbol[check.status]}</i><span>{check.name}</span><b>{check.status.replaceAll("_", " ")}</b><em>{expanded ? "−" : "+"}</em></button>{expanded && <div className="checkDetail"><p>{check.description}</p><p><b>What we found:</b> {Object.entries(check.evidence || {}).slice(0, 3).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join(" · ") || "No additional evidence available."}</p><p><b>Why it matters:</b> {check.whyItMatters}</p>{check.recommendation && <p><b>Recommendation:</b> {check.recommendation}</p>}</div>}</article>;
}
