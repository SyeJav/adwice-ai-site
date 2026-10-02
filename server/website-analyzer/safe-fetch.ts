import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { isIP } from "node:net";
import { Agent, request } from "undici";

const MAX_REDIRECTS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const USER_AGENT = "AdwiceWebsiteAnalyzer/1.0 (+https://myadwice.com)";

export class AnalyzerFetchError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

function ipv4Number(value: string): number {
  return value.split(".").reduce((n, part) => ((n << 8) | Number(part)) >>> 0, 0);
}

function ipv6Number(value: string): bigint | null {
  let input = value.toLowerCase().split("%", 1)[0];
  if (input.includes(".")) {
    const lastColon = input.lastIndexOf(":");
    const ipv4 = input.slice(lastColon + 1);
    if (isIP(ipv4) !== 4) return null;
    const n = ipv4Number(ipv4);
    input = `${input.slice(0, lastColon)}:${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = input.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;
  const words = [...left, ...Array.from({ length: missing }, () => "0"), ...right];
  if (words.length !== 8 || words.some((part) => !/^[a-f0-9]{1,4}$/.test(part))) return null;
  return words.reduce((n, part) => (n << BigInt(16)) | BigInt(`0x${part}`), BigInt(0));
}

export function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const n = ipv4Number(address);
    const blocked: [number, number][] = [
      [0x00000000, 8], [0x0a000000, 8], [0x64400000, 10], [0x7f000000, 8],
      [0xa9fe0000, 16], [0xac100000, 12], [0xc0000000, 24], [0xc0000200, 24],
      [0xc0a80000, 16], [0xc6120000, 15], [0xc6336400, 24], [0xcb007100, 24],
      [0xe0000000, 4], [0xf0000000, 4],
    ];
    return !blocked.some(([network, bits]) => (n >>> (32 - bits)) === (network >>> (32 - bits)));
  }
  if (version === 6) {
    const n = ipv6Number(address);
    if (n === null) return false;
    const loopback = BigInt(1);
    const mappedPrefix = BigInt("0xffff") << BigInt(32);
    if (n === BigInt(0) || n === loopback) return false;
    if ((n >> BigInt(32)) === mappedPrefix) return isPublicAddress(`${Number((n >> BigInt(24)) & BigInt(255))}.${Number((n >> BigInt(16)) & BigInt(255))}.${Number((n >> BigInt(8)) & BigInt(255))}.${Number(n & BigInt(255))}`);
    const first = Number(n >> BigInt(120));
    if ((n >> BigInt(125)) !== BigInt(1)) return false;
    if ((first & 0xfe) === 0xfc || (first === 0xfe && (Number((n >> BigInt(112)) & BigInt(255)) & 0xc0) === 0x80) || first === 0xff) return false;
    if ((n >> BigInt(96)) === BigInt("0x20010db8") || (n >> BigInt(96)) === BigInt("0x20010000")) return false;
    return true;
  }
  return false;
}

export function normalizeWebsiteUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) throw new AnalyzerFetchError("INVALID_WEBSITE_URL", "Please enter a valid public website URL.");
  let url: URL;
  try { url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`); }
  catch { throw new AnalyzerFetchError("INVALID_WEBSITE_URL", "Please enter a valid public website URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new AnalyzerFetchError("INVALID_WEBSITE_URL", "Please enter a valid public website URL.");
  if (!url.hostname || url.hostname.includes(".") === false && isIP(url.hostname) === 0)
    throw new AnalyzerFetchError("INVALID_WEBSITE_URL", "Please enter a valid public website URL.");
  url.hash = "";
  if (!url.pathname) url.pathname = "/";
  return url;
}

async function resolveSafe(host: string): Promise<string[]> {
  const normalized = host.replace(/^\[|\]$/g, "");
  if (isIP(normalized)) {
    if (!isPublicAddress(normalized)) throw new AnalyzerFetchError("PRIVATE_ADDRESS_NOT_ALLOWED", "This address is not a public website.");
    return [normalized];
  }
  const lower = normalized.toLowerCase().replace(/\.$/, "");
  if (lower === "localhost" || lower.endsWith(".localhost") || lower === "localhost.localdomain" || lower.endsWith(".local"))
    throw new AnalyzerFetchError("PRIVATE_ADDRESS_NOT_ALLOWED", "This address is not a public website.");
  let records: LookupAddress[];
  try {
    records = await new Promise<LookupAddress[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("DNS timeout")), 5000);
      lookup(normalized, { all: true, verbatim: true }).then(
        (addresses) => { clearTimeout(timer); resolve(addresses); },
        (error: unknown) => { clearTimeout(timer); reject(error); },
      );
    });
  }
  catch { throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "We could not find this website. Check the address and try again."); }
  const addresses = records.map((record) => record.address);
  if (!addresses.length || addresses.some((address) => !isPublicAddress(address)))
    throw new AnalyzerFetchError("PRIVATE_ADDRESS_NOT_ALLOWED", "This address is not a public website.");
  return addresses;
}

export interface SafeResponse { url: string; statusCode: number; headers: Record<string, string | string[] | undefined>; body: string }

function discardResponseBody(response: Awaited<ReturnType<typeof request>>): void {
  // Undici reports intentional cancellation as an error on the body stream.
  // Attach a listener first so redirects and rejected content types don't
  // terminate the long-lived background worker.
  response.body.on("error", () => undefined);
  response.body.destroy();
}

export async function safeFetchResource(input: URL, timeoutMs = 15_000, accepted = ["text/html", "application/xhtml+xml"]): Promise<SafeResponse> {
  let target = new URL(input.href);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    if (!["http:", "https:"].includes(target.protocol)) throw new AnalyzerFetchError("INVALID_WEBSITE_URL", "This redirect uses an unsupported address.");
    const addresses = await resolveSafe(target.hostname);
    const pinned = addresses[0];
    const family = isIP(pinned);
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [{ address: pinned, family }]);
          else callback(null, pinned, family);
        },
        servername: target.hostname.replace(/^\[|\]$/g, ""),
        timeout: 5000,
      },
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    });
    try {
      const response = await request(target, {
        dispatcher,
        method: "GET",
        maxRedirections: 0,
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9", "accept-encoding": "identity" },
        headersTimeout: timeoutMs,
        bodyTimeout: timeoutMs,
        signal: AbortSignal.timeout(timeoutMs),
      });
      const locationHeader = response.headers.location;
      const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && location) {
        discardResponseBody(response);
        if (redirect === MAX_REDIRECTS) throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "This website redirected too many times.");
        target = new URL(location, target);
        continue;
      }
      const contentType = String(response.headers["content-type"] || "").toLowerCase();
      if (!accepted.some((type) => contentType.includes(type))) {
        discardResponseBody(response);
        throw new AnalyzerFetchError("UNSUPPORTED_CONTENT_TYPE", "This address did not return a web page we can analyze.");
      }
      const length = Number(response.headers["content-length"] || 0);
      if (length > MAX_BYTES) {
        discardResponseBody(response);
        throw new AnalyzerFetchError("UNSUPPORTED_CONTENT_TYPE", "This page is too large to analyze safely.");
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of response.body) {
        const data = Buffer.from(chunk);
        size += data.length;
        if (size > MAX_BYTES) {
          response.body.on("error", () => undefined);
          response.body.destroy();
          throw new AnalyzerFetchError("UNSUPPORTED_CONTENT_TYPE", "This page is too large to analyze safely.");
        }
        chunks.push(data);
      }
      return { url: target.href, statusCode: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") };
    } catch (error) {
      if (error instanceof AnalyzerFetchError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "This website took too long to respond.");
      throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "We could not reach this website. It may be temporarily unavailable.");
    } finally { await dispatcher.close().catch(() => undefined); }
  }
  throw new AnalyzerFetchError("WEBSITE_UNREACHABLE", "This website could not be reached.");
}

export function safeFetchHtml(input: URL, timeoutMs = 15_000): Promise<SafeResponse> {
  return safeFetchResource(input, timeoutMs, ["text/html", "application/xhtml+xml"]);
}

export async function safeCheckUrl(url: URL): Promise<boolean> {
  await resolveSafe(url.hostname);
  return true;
}
