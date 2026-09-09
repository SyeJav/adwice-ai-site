/**
 * Values in this object are read from `.env*` by Vite while building the
 * server worker. It is intentionally imported only from worker code: never
 * add this module to a client component.
 */
export interface AdwiceEnv {
  ADWICE_API_BASE_URL?: string;
  ADWICE_API_TOKEN?: string;
  ADWICE_ACCOUNT_REQUEST_PATH?: string;
  ADWICE_INR_API_URL?: string;
  ADWICE_INR_API_TOKEN?: string;
  ADWICE_USD_API_URL?: string;
  ADWICE_USD_API_TOKEN?: string;
  ADWICE_EUR_API_URL?: string;
  ADWICE_EUR_API_TOKEN?: string;
  ADWICE_SMTP_HOST?: string;
  ADWICE_SMTP_PORT?: string;
  ADWICE_SMTP_SECURE?: string;
  ADWICE_SMTP_REQUIRE_TLS?: string;
  ADWICE_SMTP_USERNAME?: string;
  ADWICE_SMTP_PASSWORD?: string;
  ADWICE_SMTP_FROM_ADDRESS?: string;
  ADWICE_SMTP_FROM_NAME?: string;
  ADWICE_SMTP_RECIPIENT?: string;
}

declare const __ADWICE_ENV__: AdwiceEnv;

// Vite replaces this constant with the selected, server-only `.env` values.
const buildEnvironment = __ADWICE_ENV__;

/**
 * Accepting bindings as an override keeps request handlers easy to test and
 * remains compatible with hosts that explicitly provide runtime variables.
 * A `.env` file is sufficient; no Worker secret is required.
 */
export function resolveAdwiceEnv(bindings: AdwiceEnv = {}): AdwiceEnv {
  return { ...buildEnvironment, ...bindings };
}
