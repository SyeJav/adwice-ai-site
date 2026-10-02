import * as cheerio from "cheerio";
import { AnalyzerFetchError, safeFetchHtml, safeFetchResource } from "./safe-fetch";
import type { AnalyzedPage, LinkData } from "./types";

const priorities = /service|product|pricing|contact|about|location|booking|book|appointment|quote|shop|category|privacy|policy|terms|review|testimonial/i;
const clean = (value: string | undefined) => (value || "").replace(/\s+/g, " ").trim();

export function extractPage(html: string, finalUrl: string, statusCode: number): AnalyzedPage {
  const $ = cheerio.load(html);
  const scripts = $("script").toArray().flatMap((el) => {
    const src = $(el).attr("src");
    if (src) return [src];
    const code = $(el).html() || "";
    return [/gtag\(|google-analytics/i.test(code) ? ["inline Google Analytics"] : [], /fbq\(|fbevents/i.test(code) ? ["inline Meta Pixel"] : [], /clarity\(/i.test(code) ? ["inline Microsoft Clarity"] : []].flat();
  });
  $("script, style, noscript, svg, iframe, template, [hidden], [aria-hidden='true']").remove();
  const title = clean($("title").first().text()) || undefined;
  const metaDescription = clean($("meta[name='description']").attr("content")) || undefined;
  const canonical = $("link[rel='canonical']").first().attr("href");
  const base = new URL(finalUrl);
  let canonicalHref: string | undefined;
  if (canonical) { try { canonicalHref = new URL(canonical, base).href; } catch { canonicalHref = undefined; } }
  const links: LinkData[] = $("a[href]").toArray().map((element) => ({
    href: ($(element).attr("href") || "").trim(), text: clean($(element).text()) || clean($(element).attr("aria-label")),
  })).filter(({ href }) => href && !/^(mailto:|tel:|javascript:|#)/i.test(href));
  $("nav, footer, [role='navigation'], [id*='cookie' i], [class*='cookie' i]").remove();
  const resolved = links.map((link) => {
    try { return { ...link, href: new URL(link.href, base).href.split("#")[0] }; } catch { return null; }
  }).filter((link): link is LinkData => Boolean(link));
  const internalLinks = resolved.filter(({ href }) => { try { return new URL(href).hostname === base.hostname; } catch { return false; } });
  const externalLinks = resolved.filter(({ href }) => { try { return new URL(href).hostname !== base.hostname; } catch { return false; } });
  const bodyText = clean($("main").text() || $("body").text()).slice(0, 35_000);
  const paragraphs = $("main p, article p, body > p").toArray().map((el) => clean($(el).text())).filter((text) => text.length > 25).slice(0, 50);
  const images = $("img").toArray().map((el) => ({ src: $(el).attr("src") || "", alt: clean($(el).attr("alt")) })).filter((image) => image.src).slice(0, 100);
  const forms = $("form").toArray().map((form) => {
    const fields = $(form).find("input:not([type='hidden']), select, textarea");
    const types = fields.toArray().map((el) => ($(el).attr("type") || "text").toLowerCase());
    return { fields: fields.length, requiredFields: fields.filter("[required]").length, hasEmail: types.includes("email"), hasPhone: types.includes("tel"), action: $(form).attr("action") };
  });
  const buttons = $("button, input[type='submit'], [role='button']").toArray().map((el) => clean($(el).text() || $(el).attr("value") || $(el).attr("aria-label"))).filter(Boolean).slice(0, 60);
  const ctaCandidates = [...buttons, ...resolved.map(({ text }) => text)].filter((text) => /contact|call|book|buy|shop|quote|appointment|order|sign.?up|get started|free|enquir|whats.?app/i.test(text)).slice(0, 30);
  const phoneNumbers = [...new Set([...(bodyText.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map((n) => n.trim()), ...$("a[href^='tel:']").toArray().map((el) => $(el).attr("href")!.slice(4))])].slice(0, 20);
  const emailAddresses = [...new Set([...(bodyText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || []), ...$("a[href^='mailto:']").toArray().map((el) => $(el).attr("href")!.slice(7).split("?")[0])])].slice(0, 20);
  const socialLinks = externalLinks.map(({ href }) => href).filter((href) => /facebook|instagram|linkedin|youtube|x\.com|twitter|tiktok/i.test(href));
  const structuredData: unknown[] = $("script[type='application/ld+json']").toArray().flatMap((el) => {
    try { return [JSON.parse($(el).text()) as unknown]; } catch { return []; }
  });
  return {
    url: finalUrl, statusCode, title, metaDescription, canonical: canonicalHref,
    htmlLang: $("html").attr("lang"), h1: $("h1").toArray().map((el) => clean($(el).text())).filter(Boolean).slice(0, 10),
    h2: $("h2").toArray().map((el) => clean($(el).text())).filter(Boolean).slice(0, 30),
    h3: $("h3").toArray().map((el) => clean($(el).text())).filter(Boolean).slice(0, 50),
    paragraphs, wordCount: bodyText.split(/\s+/).filter(Boolean).length, internalLinks, externalLinks,
    images, forms, buttons, ctaCandidates, phoneNumbers, emailAddresses,
    whatsappLinks: resolved.map(({ href }) => href).filter((href) => /wa\.me|whatsapp\.com/i.test(href)),
    structuredData, scripts, socialLinks, viewport: $("meta[name='viewport']").attr("content"),
    robotsDirectives: [$("meta[name='robots']").attr("content"), $("meta[name='googlebot']").attr("content")].filter((value): value is string => Boolean(value)),
    openGraph: Boolean($("meta[property^='og:']").length), text: bodyText, urlLinks: internalLinks.map(({ href }) => href),
  };
}

export async function crawlWebsite(
  homeUrl: URL,
  reportProgress?: (progress: number, currentStep: string) => Promise<void>,
): Promise<{ pages: AnalyzedPage[]; robotsText: string; sitemapUrls: string[] }> {
  let robotsText = "";
  await reportProgress?.(17, "Checking website crawling guidance...");
  try {
    const response = await safeFetchResource(new URL("/robots.txt", homeUrl), 5000, ["text/plain", "application/octet-stream"]);
    if (response.statusCode >= 200 && response.statusCode < 300) robotsText = response.body.slice(0, 100_000);
  } catch { /* optional signal */ }
  await reportProgress?.(19, "Finding important pages...");
  const sitemapCandidates = [new URL("/sitemap.xml", homeUrl).href, ...(robotsText.match(/^sitemap:\s*(\S+)/gim) || []).map((row) => row.replace(/^sitemap:\s*/i, "").trim())];
  const sitemapUrls: string[] = [];
  for (const sitemap of [...new Set(sitemapCandidates)].slice(0, 3)) {
    await reportProgress?.(20, "Looking for the website’s key pages...");
    try {
      const response = await safeFetchResource(new URL(sitemap), 5000, ["xml", "text/plain", "application/octet-stream"]);
      if (response.statusCode < 200 || response.statusCode >= 300) continue;
      const $ = cheerio.load(response.body, { xmlMode: true });
      $("loc").each((_i, el) => { const raw = clean($(el).text()); try { const url = new URL(raw); if (url.hostname === homeUrl.hostname) sitemapUrls.push(url.href); } catch { /* ignore malformed entry */ } });
    } catch { /* optional signal */ }
  }
  const pages: AnalyzedPage[] = [];
  const queued = new Set<string>();
  const queue = [homeUrl.href];
  const add = (raw: string) => { try { const url = new URL(raw); url.hash = ""; if (url.hostname === homeUrl.hostname && ["http:", "https:"].includes(url.protocol) && !/\.(pdf|zip|exe|png|jpe?g|gif|webp|mp4|mov)(?:$|\?)/i.test(url.pathname) && !queued.has(url.href)) { queued.add(url.href); queue.push(url.href); } } catch { /* skip */ } };
  queued.add(homeUrl.href);
  sitemapUrls.filter((url) => priorities.test(url)).slice(0, 20).forEach(add);
  const maxPages = Math.min(10, Math.max(1, Number(process.env.WEBSITE_ANALYZER_MAX_PAGES || 5)));
  while (queue.length && pages.length < maxPages) {
    const target = queue.shift()!;
    const pageNumber = pages.length + 1;
    await reportProgress?.(21 + Math.floor((pages.length / maxPages) * 21), `Checking page ${pageNumber} of up to ${maxPages}...`);
    try {
      const response = await safeFetchHtml(new URL(target));
      const page = extractPage(response.body, response.url, response.statusCode);
      if ([401, 403].includes(response.statusCode) || /checking your browser|verify you are human|captcha|access denied|attention required/i.test(`${page.title || ""} ${page.text.slice(0, 1800)}`)) {
        throw new AnalyzerFetchError("WEBSITE_BLOCKED_ANALYZER", "Automated access to this website was blocked, so we could not complete the review.");
      }
      pages.push(page);
      await reportProgress?.(21 + Math.floor((pages.length / maxPages) * 21), `Reviewed page ${pages.length} of up to ${maxPages}...`);
      const preferred = page.internalLinks.filter(({ href, text }) => priorities.test(`${href} ${text}`)).map(({ href }) => href);
      const remaining = page.internalLinks.map(({ href }) => href);
      [...preferred, ...remaining].slice(0, 40).forEach(add);
    } catch (error) {
      if (!pages.length) {
        if (error instanceof AnalyzerFetchError) throw error;
        throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "Website did not return an accessible HTML page.");
      }
    }
  }
  await reportProgress?.(43, `Finished reviewing ${pages.length} important ${pages.length === 1 ? "page" : "pages"}...`);
  return { pages, robotsText, sitemapUrls };
}
