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
