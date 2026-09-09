import type { AdwiceEnv } from "../../config/adwice-env";

const envKeys: readonly (keyof AdwiceEnv)[] = [
  "ADWICE_API_BASE_URL",
  "ADWICE_API_TOKEN",
  "ADWICE_ACCOUNT_REQUEST_PATH",
  "ADWICE_INR_API_URL",
  "ADWICE_INR_API_TOKEN",
  "ADWICE_USD_API_URL",
  "ADWICE_USD_API_TOKEN",
  "ADWICE_EUR_API_URL",
  "ADWICE_EUR_API_TOKEN",
  "ADWICE_SMTP_HOST",
  "ADWICE_SMTP_PORT",
  "ADWICE_SMTP_SECURE",
  "ADWICE_SMTP_REQUIRE_TLS",
  "ADWICE_SMTP_USERNAME",
  "ADWICE_SMTP_PASSWORD",
  "ADWICE_SMTP_FROM_ADDRESS",
  "ADWICE_SMTP_FROM_NAME",
  "ADWICE_SMTP_RECIPIENT",
];

/** Read secrets at request time for the self-hosted Node runtime. */
export function getNodeAdwiceEnv(): AdwiceEnv {
  return Object.fromEntries(
    envKeys.flatMap((key) => {
      const value = process.env[key];
      return value ? [[key, value]] : [];
    }),
  ) as AdwiceEnv;
}
