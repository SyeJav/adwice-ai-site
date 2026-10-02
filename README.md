# Adwice AI Advertising

Adwice is a full-stack Next.js application for planning, launching, and
reporting on Google and Meta advertising campaigns.

## Requirements

- Node.js `>=22.13.0`
- npm

## Development

Use Node.js `>=22.13.0`, install dependencies, and make sure local environment
configuration is present. Preserve the existing `.env.local` values and add the
analyzer settings shown below; don't replace the file if it already contains
your Adwice API or SMTP configuration.

```bash
npm ci
```

Start local Redis (Docker example):

```bash
docker run --name adwice-redis -p 127.0.0.1:6379:6379 -d redis:7-alpine
```

Add this to `.env.local`:

```env
REDIS_URL=redis://127.0.0.1:6379
WEBSITE_ANALYZER_ENABLED=true
```

Run the web app and worker in separate terminals:

```bash
npm run dev
```

```bash
npm run website-analyzer:worker
```

The development site runs at `http://localhost:3000`. Keep Redis running while
using the analyzer. If the container already exists, start it with
`docker start adwice-redis`.

## Production

```bash
npm ci
npm run build
npm run start
```

The production web server listens on port 3000 by default. Set `PORT` and
`HOST` when running behind Apache or another reverse proxy. The production web
server and analyzer worker must remain running as separate managed processes.

## Environment

Set required variables in `.env.local` for development or configure them in the
production service environment. Keep populated environment files out of source
control.

Each market uses its selected currency's complete request URL and matching
Bearer token:

- `ADWICE_INR_API_URL` and `ADWICE_INR_API_TOKEN`
- `ADWICE_USD_API_URL` and `ADWICE_USD_API_TOKEN`
- `ADWICE_EUR_API_URL` and `ADWICE_EUR_API_TOKEN`

The URL should include the registration path, for example
`https://api.example.com/api/adbud/register`. The optional
`ADWICE_API_BASE_URL`, `ADWICE_API_TOKEN`, and
`ADWICE_ACCOUNT_REQUEST_PATH` values provide a fallback for markets without a
dedicated configuration.

Agency-demo requests use the `ADWICE_SMTP_*` variables to send a notification
email. For Gmail, use an App Password rather than an account password.

## Website Analyzer

The public analyzer is available at `/website-analyzer`. It queues scans in
BullMQ and stores progress and reports in Redis. Configure the same `REDIS_URL`
for the web application and worker. Use a private managed Redis service or a
Redis instance on a private network; don't expose Redis directly to the public
internet. For a hosted Redis service, use its TLS URL (`rediss://`) when
provided.

Install and build the app once during deployment:

```bash
npm ci
npm run build
```

Run these as separate systemd, PM2, or equivalent supervised processes:

```bash
npm run start
```

```bash
npm run website-analyzer:worker
```

Set `REDIS_URL` in the environment of **both** processes. If the web app and
worker run on different hosts, set it to the private Redis endpoint reachable
from both; `127.0.0.1` only works when Redis is on the same host. Restart both
processes after changing environment variables. Route public web traffic to
the Next.js process through the existing reverse proxy; the worker does not
serve HTTP traffic.

The worker requires Node.js `>=22.13.0`. Redis is required for queued analysis,
report retention, URL caching, and rate limiting. Completed reports and URL
cache entries expire after `WEBSITE_ANALYZER_CACHE_HOURS` (24 hours by default).
Fresh scans are limited to `WEBSITE_ANALYZER_RATE_LIMIT` per IP per hour
(3 by default). `WEBSITE_ANALYZER_MAX_PAGES` defaults to 5 and is capped at 10.

Google PageSpeed Insights and semantic copy review are optional. Set
`GOOGLE_PAGESPEED_API_KEY` to include mobile lab performance data. Set
`OPENAI_API_KEY` to enable evidence-checked UX copy suggestions; the AI model
can be selected with `WEBSITE_ANALYZER_AI_MODEL`. Neither provider assigns
scores: deterministic checks calculate category scores and the weighted overall
score. Provider failures leave the rest of the report available.

The API consists of `POST /api/website-analyzer` and
`GET /api/website-analyzer/{analysisId}`. To add a finding, add a typed check
in `server/website-analyzer/analyze.ts` and assign it to one of the seven
categories. Category weights are defined near the top of that file and sum to
100%.

## Checks

```bash
npm run lint
npm test
```
