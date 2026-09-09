# Adwice AI Advertising

Adwice is a full-stack Next.js application for planning, launching, and
reporting on Google and Meta advertising campaigns.

## Requirements

- Node.js `>=22.13.0`
- npm

## Development

```bash
npm ci
npm run dev
```

The development site runs at `http://localhost:3000`.

## Production

```bash
npm ci
npm run build
npm run start
```

The production server listens on port 3000 by default. Set `PORT` and `HOST`
when running behind Apache or another reverse proxy.

## Environment

Copy `.env.example` to `.env.local` for development or configure the same
variables in the production service environment. Keep populated environment
files out of source control.

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

## Checks

```bash
npm run lint
npm test
```
