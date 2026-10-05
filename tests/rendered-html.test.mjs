import assert from "node:assert/strict";
import test from "node:test";
import { startServer } from "./next-server.mjs";

test("renders the homepage", async (t) => {
  const server = await startServer();
  t.after(server.close);
  const response = await fetch(server.baseUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Turn your budget into/);
});

test("includes the Google Ads tag on every page", async (t) => {
  const server = await startServer();
  t.after(server.close);

  for (const path of ["/", "/platform", "/privacy-policy"]) {
    const response = await fetch(`${server.baseUrl}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /googletagmanager\.com\/gtag\/js\?id=AW-18454790985/);
    assert.match(html, /AW-18454790985\/FTeFCO_n1_kcEMmG999E/);
    assert.match(html, /https:\/\/wa\.me\/917011410689/);
    assert.match(html, /Sweden: 0761889848/);
    assert.match(html, /India: 7011410689/);
  }
});

test("includes the Meta Pixel on every page", async (t) => {
  const server = await startServer();
  t.after(server.close);

  for (const path of ["/", "/platform", "/privacy-policy"]) {
    const response = await fetch(`${server.baseUrl}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /connect\.facebook\.net\/en_US\/fbevents\.js/);
    assert.match(html, /fbq\('init', '2015224922626516'\)/);
    assert.match(html, /adwice:consent/);
  }
});

test("includes LeadProof and click-to-call links on every page", async (t) => {
  const server = await startServer();
  t.after(server.close);

  for (const path of ["/", "/platform", "/privacy-policy"]) {
    const response = await fetch(`${server.baseUrl}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /(?:leadproof\.myadwice\.com|localhost:5173)\/tracker\.js/);
    assert.match(html, /lp_site_9eb6bbc90d33ee8e232c3488d267d61e/);
    assert.match(html, /tel:\+46761889848/);
    assert.match(html, /tel:\+917011410689/);
    assert.match(html, /Cookie settings/);
  }
});
