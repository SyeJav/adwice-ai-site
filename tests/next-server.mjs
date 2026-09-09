import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export async function startServer() {
  const port = 4100 + Math.floor(Math.random() * 500);
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: projectRoot, env: { ...process.env, PORT: String(port) } },
  );
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.status < 500) {
        return {
          baseUrl: `http://127.0.0.1:${port}`,
          close: () => child.kill("SIGTERM"),
        };
      }
    } catch {
      // The server is still starting.
    }
    await delay(250);
  }

  child.kill("SIGTERM");
  throw new Error(`Next production server did not start.\n${output}`);
}
