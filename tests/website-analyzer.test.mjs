import test from "node:test";
import assert from "node:assert/strict";
import { isPublicAddress, normalizeWebsiteUrl } from "../server/website-analyzer/safe-fetch.ts";
import { extractPage } from "../server/website-analyzer/crawler.ts";
import { calculateCategoryScores, calculateOverallScore } from "../server/website-analyzer/analyze.ts";

test("normalizes bare host names to an HTTPS homepage", () => {
  assert.equal(normalizeWebsiteUrl(" example.com ").href, "https://example.com/");
  assert.equal(normalizeWebsiteUrl("http://example.com/about#team").href, "http://example.com/about");
});

test("rejects unsupported schemes and addresses that are not public", () => {
  assert.throws(() => normalizeWebsiteUrl("file:///etc/passwd"), { code: "INVALID_WEBSITE_URL" });
  for (const address of ["127.0.0.1", "10.2.3.4", "172.20.1.1", "192.168.1.4", "169.254.169.254", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPublicAddress(address), false, `${address} should be blocked`);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("extracts normalized on-page SEO and contact signals", () => {
  const page = extractPage(`<!doctype html><html lang="en"><head><title>AC Repair | Blue Air</title><meta name="description" content="Same day AC repair in Austin for homes and businesses."><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>AC repair in Austin</h1><p>Fast air conditioning repair for your home and business.</p><a href="tel:+15125550123">Call now</a><a href="https://wa.me/15125550123">WhatsApp us</a><form><input type="email" required><textarea></textarea></form></main></body></html>`, "https://example.com/", 200);
  assert.equal(page.title, "AC Repair | Blue Air");
  assert.equal(page.metaDescription, "Same day AC repair in Austin for homes and businesses.");
  assert.deepEqual(page.h1, ["AC repair in Austin"]);
  assert.equal(page.viewport, "width=device-width, initial-scale=1");
  assert.equal(page.forms[0].requiredFields, 1);
  assert.ok(page.phoneNumbers.some((number) => number.includes("+15125550123")));
  assert.equal(page.whatsappLinks.length, 1);
});

test("scoring ignores checks that do not apply and uses weighted category scores", () => {
  const makeCheck = (id, category, status, score, maxScore = 1) => ({ id, category, status, score, maxScore });
  const scores = calculateCategoryScores([
    makeCheck("one", "seo", "pass", 1),
    makeCheck("two", "seo", "warning", 0.5),
    makeCheck("three", "seo", "not_applicable", 0, 0),
  ]);
  assert.equal(scores.seo, 75);
  assert.equal(calculateOverallScore({ technical: 100, ux: 100, seo: 100, googleAds: 100, conversion: 100, performance: 100, trust: 100 }), 100);
});
