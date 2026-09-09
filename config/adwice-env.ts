/** Server-only values used by the Node API routes. */
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
