import assert from "node:assert/strict";
import test from "node:test";
import { startServer } from "./next-server.mjs";

async function post(server, body) {
  return fetch(`${server.baseUrl}/api/adwice/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("validates lead fields before contacting the API", async (t) => {
  const server = await startServer();
  t.after(server.close);
  const response = await post(server, {
    name: "",
    email: "bad",
    url: "nope",
    plan: "plan_01",
    currency: "INR",
  });
  assert.equal(response.status, 422);
  assert.deepEqual(Object.keys((await response.json()).data).sort(), [
    "email",
    "name",
    "url",
  ]);
});

test("rejects unsupported currencies", async (t) => {
  const server = await startServer();
  t.after(server.close);
  const response = await post(server, {
    name: "Ada",
    email: "ada@example.com",
    url: "https://example.com",
    plan: "plan_01",
    currency: "GBP",
  });
  assert.equal(response.status, 422);
  assert.deepEqual((await response.json()).data.currency, [
    "Select a valid currency.",
  ]);
});
