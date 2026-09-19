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
    assert.match(
      html,
      /googletagmanager\.com\/gtag\/js\?id=AW-18454790985/,
    );
    assert.match(html, /AW-18454790985\/FTeFCO_n1_kcEMmG999E/);
    assert.match(html, /https:\/\/wa\.me\/46761889848/);
    assert.match(html, /Sweden: 0761889848/);
    assert.match(html, /India: 7011410689/);
  }
});
