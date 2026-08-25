import assert from "node:assert/strict";
import test from "node:test";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("adwice-test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("validates lead fields before calling Adwice", async () => {
  const response = await worker.fetch(new Request("http://localhost/api/adwice/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "", email: "bad", url: "nope", plan: "plan_01" }) }), {}, ctx);
  assert.equal(response.status, 422);
  assert.deepEqual(Object.keys((await response.json()).data).sort(), ["email", "name", "url"]);
});

test("rejects an unknown plan ID", async () => {
  const response = await worker.fetch(new Request("http://localhost/api/adwice/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Ada", email: "ada@example.com", url: "https://example.com", plan: "plan_99" }) }), {}, ctx);
  assert.equal(response.status, 422);
  assert.deepEqual((await response.json()).data.plan, ["Select a valid advertising plan."]);
});

test("forwards a normalized lead and returns success", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, init) => { forwarded = { url, init }; return Response.json({ status: "success", data: [] }); };
  try {
    const response = await worker.fetch(new Request("http://localhost/api/adwice/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: " Ada ", email: "ada@example.com", url: "https://example.com", phone: "", language: "en", plan: "plan_02" }) }), { ADWICE_API_BASE_URL: "https://api.adbud.example/" }, ctx);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "success");
    assert.equal(forwarded.url, "https://api.adbud.example/adbud/request");
    assert.deepEqual(JSON.parse(forwarded.init.body), { name: "Ada", email: "ada@example.com", url: "https://example.com", phone: null, budget: null, language: "en", plan: "plan_02", promotion: null });
  } finally { globalThis.fetch = originalFetch; }
});

test("passes through Adwice 422 field errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ status: "fail", message: "Invalid", code: 422, data: { email: ["Already used"] } }, { status: 422 });
  try {
    const response = await worker.fetch(new Request("http://localhost/api/adwice/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Ada", email: "ada@example.com", url: "https://example.com", plan: "plan_03" }) }), {}, ctx);
    assert.equal(response.status, 422);
    assert.deepEqual((await response.json()).data.email, ["Already used"]);
  } finally { globalThis.fetch = originalFetch; }
});
