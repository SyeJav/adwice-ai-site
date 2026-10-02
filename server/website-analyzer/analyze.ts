import { createHash } from "node:crypto";
import type { AnalysisRecord, CategoryKey, WebsiteAnalysisReport, WebsiteCheckResult, WebsiteRecommendation, SuggestedKeyword } from "./types";
import { crawlWebsite } from "./crawler";

const categories: { id: CategoryKey; name: string; weight: number }[] = [
  { id: "technical", name: "Technical", weight: .10 }, { id: "ux", name: "User Experience", weight: .15 },
  { id: "seo", name: "SEO", weight: .20 }, { id: "googleAds", name: "Google Ads", weight: .20 },
  { id: "conversion", name: "Conversions", weight: .20 }, { id: "performance", name: "Performance", weight: .10 }, { id: "trust", name: "Trust", weight: .05 },
];
const label: Record<CategoryKey, string> = { technical: "Technical", ux: "User experience", seo: "SEO", googleAds: "Google Ads", conversion: "Conversion", performance: "Performance", trust: "Trust" };
const cleanUnique = (values: string[], limit = 12) => [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);

export function calculateCategoryScores(checks: WebsiteCheckResult[]): Record<CategoryKey, number | null> {
  return Object.fromEntries(categories.map(({ id }) => {
    const selected = checks.filter((check) => check.category === id && check.maxScore > 0 && check.status !== "not_applicable");
    if (!selected.length) return [id, null];
    const score = selected.reduce((sum, check) => sum + check.score, 0) / selected.reduce((sum, check) => sum + check.maxScore, 0) * 100;
    return [id, Math.round(score)];
  })) as Record<CategoryKey, number | null>;
}
export function calculateOverallScore(scores: Record<CategoryKey, number | null>): number {
  const available = categories.filter((category) => scores[category.id] !== null);
  const totalWeight = available.reduce((sum, category) => sum + category.weight, 0);
  return Math.round(available.reduce((sum, category) => sum + (scores[category.id] || 0) * category.weight, 0) / (totalWeight || 1));
}

function rating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs Improvement";
  if (score >= 40) return "Poor";
  return "Critical";
}

async function pageSpeed(url: string): Promise<{ score?: number; lcp?: string; cls?: string; tbt?: string } | null> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) return null;
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.append("category", "performance");
  endpoint.searchParams.set("key", key);
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(18_000), headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json() as { lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, { displayValue?: string }> } };
    const audits = data.lighthouseResult?.audits || {};
    const score = data.lighthouseResult?.categories?.performance?.score;
    return { score: typeof score === "number" ? Math.round(score * 100) : undefined, lcp: audits["largest-contentful-paint"]?.displayValue, cls: audits["cumulative-layout-shift"]?.displayValue, tbt: audits["total-blocking-time"]?.displayValue };
  } catch { return null; }
}

interface SemanticFinding { title: string; quote: string; recommendation: string; }
async function semanticFindings(text: string): Promise<SemanticFinding[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.WEBSITE_ANALYZER_AI_ENABLED === "false") return [];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(12_000),
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.WEBSITE_ANALYZER_AI_MODEL || "gpt-4o-mini", temperature: 0, response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Review website copy for a small business. Never invent facts or scores. Return only actionable UX findings supported by exact quotes from the supplied text. JSON shape: {\"findings\":[{\"title\":string,\"quote\":string,\"recommendation\":string}]}. Return at most 3 findings. If copy is clear, return an empty findings array." },
          { role: "user", content: text.slice(0, 7500) },
        ] }),
    });
    if (!response.ok) return [];
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(body.choices?.[0]?.message?.content || "{}") as { findings?: SemanticFinding[] };
    return (parsed.findings || []).filter((finding) => typeof finding.title === "string" && typeof finding.quote === "string" && text.toLowerCase().includes(finding.quote.toLowerCase()) && typeof finding.recommendation === "string").slice(0, 3);
  } catch { return []; }
}

export async function buildWebsiteAnalysis(record: AnalysisRecord, update: (status: AnalysisRecord["status"], progress: number, currentStep: string) => Promise<void>): Promise<WebsiteAnalysisReport> {
  await update("validating", 8, "Checking the website address...");
  await update("fetching", 15, "Checking website availability...");
  const crawl = await crawlWebsite(new URL(record.normalizedUrl), (progress, currentStep) => update("crawling", progress, currentStep));
  if (!crawl.pages.length) throw new Error("Website did not return an accessible page.");
  await update("extracting", 43, "Reviewing your website content...");
  const pages = crawl.pages;
  const home = pages[0];
  const allText = pages.map((page) => page.text).join(" ").slice(0, 40_000);
  const checks: WebsiteCheckResult[] = [];
  const add = (id: string, category: CategoryKey, name: string, status: WebsiteCheckResult["status"], evidence: Record<string, unknown>, recommendation: string, whyItMatters: string, source: WebsiteCheckResult["source"] = "dom", severity: WebsiteCheckResult["severity"] = status === "fail" ? "high" : status === "warning" ? "medium" : "info") => {
    checks.push({ id, category, name, description: `${name} was checked on the analyzed pages.`, status, score: status === "pass" || status === "info" ? 1 : status === "warning" ? .5 : 0, maxScore: status === "not_applicable" ? 0 : 1, severity, confidence: .94, evidence, whyItMatters, recommendation: status === "pass" || status === "not_applicable" ? undefined : recommendation, source });
  };
  await update("technical_analysis", 50, "Checking website health...");
  add("website-reachable", "technical", "Website availability", home.statusCode >= 200 && home.statusCode < 400 ? "pass" : "fail", { statusCode: home.statusCode }, "Restore the homepage so visitors can reach your business.", "Customers and advertising traffic need a working destination.", "crawler", "critical");
  const isHttps = new URL(home.url).protocol === "https:";
  add("https", "technical", "Secure connection", isHttps ? "pass" : "warning", { url: home.url }, "Set up HTTPS and redirect visitors to the secure version.", "HTTPS protects visitor connections and is expected on modern websites.");
  add("html-page", "technical", "HTML page returned", "pass", { pages: pages.length }, "Ensure the main address returns a standard web page.", "The analyzer needs an HTML page to inspect your customer experience.");
  add("mobile-viewport", "technical", "Mobile viewport", home.viewport ? "pass" : "fail", { viewport: home.viewport || null }, "Add a responsive viewport meta tag to the page.", "A mobile viewport helps the page fit phone screens correctly.");
  add("robots", "technical", "robots.txt", crawl.robotsText ? "pass" : "warning", { found: Boolean(crawl.robotsText) }, "Consider adding a robots.txt file to guide search crawlers.", "A robots file can clarify which parts of a site search engines may visit.");
  add("sitemap", "technical", "XML sitemap", crawl.sitemapUrls.length ? "pass" : "warning", { pagesFound: crawl.sitemapUrls.length }, "Publish an XML sitemap with your important public pages.", "A sitemap can help search engines discover important pages.");
  add("html-language", "technical", "Page language", home.htmlLang ? "pass" : "warning", { language: home.htmlLang || null }, "Set the page language on the HTML element.", "Language information helps browsers and assistive technology present content correctly.");
  const unsafeLinks = pages.flatMap((page) => page.internalLinks.filter(({ href }) => href.startsWith("http:") && isHttps).map(({ href }) => href));
  add("mixed-content", "technical", "Secure internal links", unsafeLinks.length ? "warning" : "pass", { insecureLinks: cleanUnique(unsafeLinks, 5) }, "Update internal links to use HTTPS.", "Secure links avoid browser warnings and help visitors stay on the protected version.");
  const allTitles = pages.map((page) => page.title).filter(Boolean);
  add("duplicate-title", "seo", "Unique page titles", new Set(allTitles).size === allTitles.length ? "pass" : "warning", { titles: allTitles }, "Give each important page a distinct title that describes its content.", "Distinct titles make pages easier to understand in search results.");
  await update("seo_analysis", 58, "Checking search visibility...");
  add("title", "seo", "Page title", home.title && home.title.length >= 15 && home.title.length <= 65 ? "pass" : home.title ? "warning" : "fail", { title: home.title || null, characters: home.title?.length || 0 }, "Write a specific title that names your main service or product.", "The title helps people and search engines understand what the page offers.");
  add("meta-description", "seo", "Search description", home.metaDescription && home.metaDescription.length >= 60 ? "pass" : home.metaDescription ? "warning" : "fail", { description: home.metaDescription || null, characters: home.metaDescription?.length || 0 }, "Add a concise description of your service, location, and customer benefit.", "A useful search description can help people decide whether to visit your page.");
  add("h1", "seo", "Main page heading", home.h1.length === 1 ? "pass" : home.h1.length ? "warning" : "fail", { headings: home.h1 }, "Use one clear main heading to describe the page's primary purpose.", "The main heading gives visitors a quick starting point and structures the page.");
  add("heading-structure", "seo", "Heading structure", home.h2.length > 0 ? "pass" : "warning", { h2Count: home.h2.length, h3Count: home.h3.length }, "Organize longer content with descriptive section headings.", "Headings make information easier to scan and understand.");
  add("canonical", "seo", "Canonical page address", home.canonical ? "pass" : "warning", { canonical: home.canonical || null }, "Add a canonical address when the same page can load at multiple URLs.", "A canonical tag helps search engines recognize the preferred version of a page.");
  const noindex = home.robotsDirectives.some((directive) => /noindex/i.test(directive));
  add("indexability", "seo", "Search indexing access", noindex ? "fail" : "pass", { directives: home.robotsDirectives }, "Remove the noindex directive if this public page should appear in search.", "A noindex instruction can keep a page out of search results.");
  const noAlt = pages.flatMap((page) => page.images).filter((image) => !image.alt).length;
  const imageCount = pages.reduce((sum, page) => sum + page.images.length, 0);
  add("image-alt", "seo", "Image descriptions", !imageCount ? "not_applicable" : noAlt === 0 ? "pass" : noAlt / imageCount > .5 ? "fail" : "warning", { images: imageCount, missingAlt: noAlt }, "Add concise alt text to meaningful images; leave decorative images with empty alt text.", "Image descriptions improve accessibility and give search engines context.");
  add("structured-data", "seo", "Structured business information", pages.some((page) => page.structuredData.length) ? "pass" : "info", { detected: pages.reduce((sum, page) => sum + page.structuredData.length, 0) }, "Consider adding relevant structured data for your business and services.", "Structured data can help search engines interpret business information.");
  const ogTags = pages.filter((page) => page.openGraph).length;
  add("social-preview", "seo", "Social sharing details", ogTags ? "pass" : "warning", { pagesWithOpenGraph: ogTags }, "Add Open Graph title, description, and image metadata for link previews.", "Clear link previews make shared pages easier to recognize.");
  const serviceLines = cleanUnique(pages.flatMap((page) => [...page.h1, ...page.h2, ...page.h3]).filter((text) => text.length > 3 && text.length < 90), 30);
  const services = serviceLines.filter((text) => /service|repair|clean|install|consult|design|care|therapy|clinic|law|plumb|electric|market|shop|product|solution|booking|travel|restaurant|salon|agency|training|course|delivery|construction/i.test(`${text} ${allText.slice(0, 5000)}`)).slice(0, 12);
  const primaryServices = cleanUnique(services.length ? services : home.h1.concat(home.h2).slice(0, 5), 10);
  const locations = cleanUnique([...allText.matchAll(/\b(?:in|near|serving|across)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})\b/g)].map((match) => match[1]), 8);
  const businessName = home.structuredData.flatMap((item) => item && typeof item === "object" && "name" in item && typeof item.name === "string" ? [item.name] : [])[0] || home.title?.split(/[|–—-]/)[0].trim();
  const primaryCTA = home.ctaCandidates[0];
  const commerce = /add to cart|shopping cart|checkout|woocommerce|shopify|product price/i.test(allText + " " + pages.flatMap((page) => page.scripts).join(" "));
  const technologies = cleanUnique([...( /wp-content|wordpress/i.test(allText) ? ["WordPress"] : []), ...( /shopify/i.test(allText + pages.flatMap((p) => p.scripts).join(" ")) ? ["Shopify"] : []), ...( /wix\.com|wixsite/i.test(allText + pages.flatMap((p) => p.scripts).join(" ")) ? ["Wix"] : []), ...( /squarespace/i.test(allText + pages.flatMap((p) => p.scripts).join(" ")) ? ["Squarespace"] : []), ...( /webflow/i.test(allText + pages.flatMap((p) => p.scripts).join(" ")) ? ["Webflow"] : []), ...( /_next\/|next\.js/i.test(pages.flatMap((p) => p.scripts).join(" ")) ? ["Next.js"] : [])], 8);

  await update("ux_analysis", 67, "Reviewing the customer experience...");
  add("service-clarity", "ux", "Service clarity", (home.h1.join(" ") + " " + home.title).length > 12 ? "pass" : "warning", { title: home.title, h1: home.h1 }, "Use a direct headline that names what you do and who you help.", "Visitors should quickly understand whether they are in the right place.");
  add("primary-action", "ux", "Clear next step", home.ctaCandidates.length ? "pass" : "warning", { candidates: home.ctaCandidates.slice(0, 5) }, "Make the main action visible near the top of the page.", "A clear action helps interested visitors know what to do next.");
  add("contact-access", "ux", "Easy contact access", home.phoneNumbers.length || home.emailAddresses.length || home.whatsappLinks.length ? "pass" : "warning", { phone: home.phoneNumbers.length > 0, email: home.emailAddresses.length > 0, whatsapp: home.whatsappLinks.length > 0 }, "Make a preferred contact method easy to find.", "Accessible contact details can reduce friction for potential customers.");
  add("content-scan", "ux", "Scannable page content", home.h2.length && home.paragraphs.length ? "pass" : "warning", { sectionHeadings: home.h2.length, paragraphs: home.paragraphs.length }, "Break key information into short sections with helpful headings.", "Scannable content helps busy visitors find the information they need.");
  add("form-usability", "ux", "Contact form usability", home.forms.length ? (home.forms.some((form) => form.requiredFields > 7) ? "warning" : "pass") : "not_applicable", { forms: home.forms.map((form) => ({ fields: form.fields, requiredFields: form.requiredFields })) }, "Ask only for the information needed to start a conversation.", "Shorter forms can make it easier for customers to get in touch.");
  await update("ai_analysis", 69, "Reviewing how clearly the page explains its offer...");
  const semantic = await semanticFindings(allText);
  semantic.forEach((finding, index) => add(`semantic-ux-${index + 1}`, "ux", finding.title, "warning", { quote: finding.quote }, finding.recommendation, "Clear, specific copy helps a first-time visitor understand the offer.", "ai"));

  await update("ads_analysis", 74, "Evaluating Google Ads readiness...");
  const clearService = primaryServices.length > 0 && Boolean(home.h1[0] || home.title);
  add("ad-service-relevance", "googleAds", "Service relevance", clearService ? "pass" : "warning", { services: primaryServices.slice(0, 5) }, "Create a landing page that names the specific service advertised.", "Ad and page relevance helps visitors continue smoothly from a search.");
  add("ad-location", "googleAds", "Location relevance", locations.length ? "pass" : "warning", { locations }, "Name your service area on relevant pages if you serve local customers.", "Location details help local customers know whether you can serve them.");
  add("ad-offer", "googleAds", "Offer and benefits", /free|same.day|24.?7|warranty|guarantee|from\s+[$€₹\d]|discount|save|consultation/i.test(allText) ? "pass" : "warning", { offerSignals: [...allText.matchAll(/.{0,35}(?:free|same.day|24.?7|warranty|guarantee|discount|consultation).{0,45}/gi)].slice(0, 4).map((match) => match[0]) }, "State a useful benefit, offer, or reason to choose the business.", "Specific page content gives search visitors a reason to take the next step.");
  add("ad-contact", "googleAds", "Contact option for ad visitors", home.ctaCandidates.length || home.forms.length || home.phoneNumbers.length ? "pass" : "fail", { ctas: home.ctaCandidates.slice(0, 5), forms: home.forms.length, phone: home.phoneNumbers.length > 0 }, "Provide an easy way to call, book, request a quote, or send an inquiry.", "Paid visitors need a clear way to become a lead or customer.");
  const priorityPages = pages.filter((page) => /service|product|pricing|contact|book|quote/i.test(page.url));
  add("service-pages", "googleAds", "Dedicated service pages", primaryServices.length > 1 ? (priorityPages.length ? "pass" : "warning") : "not_applicable", { pages: priorityPages.map((page) => page.url) }, "Build focused pages for your most important advertised services.", "A focused page can give each ad topic a more relevant destination.");

  await update("conversion_analysis", 82, "Checking ways visitors can become customers...");
  const actions = cleanUnique([...(home.phoneNumbers.length ? ["Phone calls"] : []), ...(home.emailAddresses.length ? ["Email"] : []), ...(home.forms.length ? ["Contact form"] : []), ...(home.whatsappLinks.length ? ["WhatsApp"] : []), ...(commerce ? ["Purchase and checkout"] : []), ...(home.ctaCandidates.some((cta) => /book|appointment/i.test(cta)) ? ["Booking"] : []), ...(home.ctaCandidates.some((cta) => /quote/i.test(cta)) ? ["Quote request"] : [])], 10);
  add("conversion-action", "conversion", "Conversion action", actions.length ? "pass" : "fail", { detectedActions: actions }, "Add a clear path to contact, book, request a quote, or purchase.", "A conversion action gives visitors a practical next step.");
  add("click-to-call", "conversion", "Click-to-call", home.phoneNumbers.length ? "pass" : "warning", { phoneNumbers: home.phoneNumbers.slice(0, 5), telLinks: home.urlLinks.filter((url) => url.startsWith("tel:")).length }, "Add a tap-to-call phone link if calls are important to your business.", "Phone links make it easier for mobile visitors to call.");
  add("lead-form", "conversion", "Lead form", home.forms.length ? "pass" : "warning", { forms: home.forms.length }, "Offer a short inquiry form for visitors who are not ready to call.", "Forms let potential customers contact you when a call is inconvenient.");
  add("whatsapp", "conversion", "WhatsApp contact", home.whatsappLinks.length ? "pass" : "info", { links: home.whatsappLinks.slice(0, 3) }, "Consider WhatsApp if it is a convenient channel for your customers.", "Familiar contact channels can reduce effort for some visitors.");
  const scripts = pages.flatMap((page) => page.scripts).join(" ");
  const tracking = /googletagmanager|google-analytics|gtag\(|fbq\(|facebook\.net\/.*fbevents|hotjar|clarity\.ms|segment\.com/i.test(scripts + allText);
  add("tracking-signals", "conversion", "Measurement signals", tracking ? "pass" : "warning", { detected: tracking }, "Confirm that lead, call, booking, or purchase completions are measured in your analytics and ad accounts.", "Measurement helps you understand which campaigns produce business outcomes.");
  add("privacy-page", "trust", "Privacy information", pages.some((page) => /privacy/i.test(page.url) || /privacy policy/i.test(page.text)) ? "pass" : "warning", { found: pages.some((page) => /privacy/i.test(page.url) || /privacy policy/i.test(page.text)) }, "Publish a privacy policy that explains how visitor information is used.", "Visitors should be able to understand how their information is handled.");
  add("about-page", "trust", "About the business", pages.some((page) => /about/i.test(page.url) || /about us/i.test(page.text)) ? "pass" : "warning", { found: pages.some((page) => /about/i.test(page.url) || /about us/i.test(page.text)) }, "Add a concise introduction to the business and the people behind it.", "Business context can help new customers feel confident about contacting you.");
  add("social-proof", "trust", "Customer proof", /reviews?|testimonials?|rated\s+[4-5]|\b\d+\.\d+\s*\/\s*5|trusted by/i.test(allText) ? "pass" : "warning", { detected: /reviews?|testimonials?|rated\s+[4-5]|trusted by/i.test(allText) }, "Show genuine reviews, customer stories, or relevant credentials.", "Specific proof points help visitors assess credibility.");
  add("contact-details", "trust", "Business contact details", home.phoneNumbers.length || home.emailAddresses.length ? "pass" : "warning", { phone: home.phoneNumbers.length > 0, email: home.emailAddresses.length > 0 }, "Make a working business contact method visible.", "Clear contact details help customers and support business legitimacy.");

  await update("performance_analysis", 87, "Checking mobile performance...");
  const psi = await pageSpeed(home.url);
  if (psi?.score !== undefined) {
    add("mobile-performance", "performance", "Mobile page speed", psi.score >= 75 ? "pass" : psi.score >= 50 ? "warning" : "fail", { score: psi.score, lcp: psi.lcp || null, cls: psi.cls || null, tbt: psi.tbt || null }, "Review large images, unused scripts, and slow page elements on mobile.", "Faster pages provide a smoother experience for visitors on mobile connections.", "pagespeed", psi.score < 50 ? "high" : "medium");
  } else {
    checks.push({ id: "mobile-performance", category: "performance", name: "Mobile page speed", description: "Optional mobile performance analysis was unavailable.", status: "not_applicable", score: 0, maxScore: 0, severity: "info", confidence: .5, evidence: { configured: Boolean(process.env.GOOGLE_PAGESPEED_API_KEY) }, whyItMatters: "Mobile speed affects usability, but an external measurement provider was not available for this scan.", source: "pagespeed" });
  }
  await update("scoring", 94, "Preparing recommendations...");
  const keywords: SuggestedKeyword[] = [];
  for (const service of primaryServices.slice(0, 5)) {
    const route = priorityPages.find((page) => page.text.toLowerCase().includes(service.toLowerCase().split(" ")[0])) || home;
    const relevance = route === home && !home.text.toLowerCase().includes(service.toLowerCase()) ? .48 : .82;
    const keyword = locations.length ? `${service.toLowerCase()} ${locations[0].toLowerCase()}` : service.toLowerCase();
    keywords.push({ keyword, intent: "transactional", relevance, evidence: [service, ...(locations.length ? [locations[0]] : [])], bestLandingPage: route.url, landingPageScore: Math.round(relevance * 100), issues: relevance < .6 ? ["The homepage is the closest discovered match for this service."] : [], recommendation: relevance < .6 ? `Create a focused page about ${service}.` : undefined });
  }
  const categoryScores = calculateCategoryScores(checks);
  const overallScore = calculateOverallScore(categoryScores);
  const recommendations = buildRecommendations(checks, keywords);
  const failed = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warning").length;
  const passed = checks.filter((check) => check.status === "pass").length;
  const openIssues = checks.filter((check) => check.status === "fail" || check.status === "warning");
  const summaryMessage = overallScore >= 75
    ? "Your website is in good shape. A few focused improvements can make it even clearer and easier for customers to use."
    : `Your website has a useful foundation, with opportunities to improve ${openIssues.slice(0, 2).map((check) => check.name.toLowerCase()).join(" and ") || "the customer experience"}. Review the priorities below before increasing advertising spend.`;
  const version = process.env.WEBSITE_ANALYZER_VERSION || "1.0";
  const categoryReports = categories.map(({ id, name }) => {
    const categoryChecks = checks.filter((check) => check.category === id);
    const score = categoryScores[id];
    return { id, name, score, status: score === null ? "Not measured" : score >= 75 ? "Good" : score >= 50 ? "Needs attention" : "Priority to improve", issueCount: categoryChecks.filter((check) => check.status === "fail" || check.status === "warning").length, checks: categoryChecks };
  });
  const report: WebsiteAnalysisReport = {
    id: record.id, requestedUrl: record.requestedUrl, normalizedUrl: record.normalizedUrl, status: "completed", analyzedAt: new Date().toISOString(),
    website: { businessName, businessCategory: services.length ? services[0] : undefined, businessDescription: home.metaDescription, primaryServices, products: commerce ? primaryServices.slice(0, 4) : [], locations, primaryCTA, secondaryCTAs: home.ctaCandidates.slice(1, 6), likelyCustomerIntent: ["Compare providers", "Understand services", "Contact or request a quote"], importantTopics: cleanUnique([...primaryServices, ...locations], 12), suggestedKeywords: keywords, ecommerce: commerce, technologies },
    summary: { overallScore, rating: rating(overallScore), message: summaryMessage, checksTotal: checks.length, passed, warnings, failed },
    categoryScores, categories: categoryReports,
    googleAdsReadiness: { score: categoryScores.googleAds ?? 0, usableServices: primaryServices, usableBenefits: cleanUnique([...allText.matchAll(/.{0,18}(?:free|same.day|24.?7|warranty|guarantee|save|discount|trusted).{0,45}/gi)].map((match) => match[0]), 8), usableLocations: locations, usableOffers: [], missingInformation: cleanUnique([...(locations.length ? [] : ["Service areas"]) ,...(home.forms.length || home.phoneNumbers.length ? [] : ["A clear lead action"]),...(primaryServices.length < 2 ? ["Service-specific landing page"] : [])], 8), keywordOpportunities: keywords },
    conversionReadiness: { score: categoryScores.conversion ?? 0, detectedActions: actions, missingSignals: cleanUnique([...(tracking ? [] : ["Conversion tracking could not be detected from page source"]), ...(home.forms.length ? [] : ["Lead form"]), ...(home.phoneNumbers.length ? [] : ["Phone number"])], 8), ecommerce: commerce },
    keywordIntelligence: keywords, topRecommendations: recommendations.slice(0, 5), recommendations,
    pagesAnalyzed: pages.map((page) => ({ url: page.url, title: page.title, statusCode: page.statusCode, wordCount: page.wordCount })),
    meta: { pagesCrawled: pages.length, analysisVersion: version, aiUsed: semantic.length > 0, performanceProvider: psi ? "Google PageSpeed Insights" : undefined, cached: false },
  };
  await update("scoring", 96, "Finishing your report...");
  return report;
}

function buildRecommendations(checks: WebsiteCheckResult[], keywords: SuggestedKeyword[]): WebsiteRecommendation[] {
  const issues = checks.filter((check) => (check.status === "fail" || check.status === "warning") && check.recommendation);
  return issues.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 12).map((check): WebsiteRecommendation => {
    const priority: WebsiteRecommendation["priority"] = check.severity === "critical" ? "critical" : check.severity === "high" ? "high" : check.severity === "medium" ? "medium" : "low";
    const impact: WebsiteRecommendation["impact"] = ["conversion", "googleAds"].includes(check.category) ? "high" : "medium";
    const effort: WebsiteRecommendation["effort"] = check.id.includes("tracking") || check.id.includes("title") ? "low" : "medium";
    return { id: createHash("sha1").update(check.id).digest("hex").slice(0, 10), title: check.name, priority, impact, effort, categories: [check.category], problem: check.description, evidence: check.evidence || {}, recommendation: check.recommendation!, expectedBenefit: `This can improve ${label[check.category].toLowerCase()} readiness and make the next step clearer for customers.`, relatedChecks: [check.id] };
  }).concat(keywords.filter((item) => (item.landingPageScore || 100) < 60).slice(0, 2).map((item): WebsiteRecommendation => ({ id: `keyword-${createHash("sha1").update(item.keyword).digest("hex").slice(0, 8)}`, title: `Create a focused ${item.keyword} page`, priority: "high", impact: "high", effort: "high", categories: ["googleAds", "seo"], problem: `The closest discovered landing page is a weak match for “${item.keyword}”.`, evidence: { keyword: item.keyword, landingPage: item.bestLandingPage, score: item.landingPageScore }, recommendation: item.recommendation || `Create a focused page that explains ${item.keyword}.`, expectedBenefit: "This can improve message clarity and ad-to-page relevance.", relatedChecks: ["service-pages", "ad-service-relevance"] })));
}
function severityRank(severity: WebsiteCheckResult["severity"]): number { return ({ critical: 5, high: 4, medium: 3, low: 2, info: 1 })[severity]; }
