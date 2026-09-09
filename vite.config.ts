import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// This allowlist keeps secrets out of Vite's browser environment. The values
// are injected into the server worker only via `config/adwice-env.ts`.
const adwiceEnvironmentKeys = [
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
] as const;

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  // Load all ADWICE variables, not just the public VITE_ prefix. `.env` stays
  // on the build host and is already excluded from Git by `.gitignore`.
  const loadedEnvironment = loadEnv(mode, process.cwd(), "");
  const adwiceEnvironment = Object.fromEntries(
    adwiceEnvironmentKeys.flatMap((key) =>
      loadedEnvironment[key] ? [[key, loadedEnvironment[key]]] : [],
    ),
  );

  return {
    define: {
      __ADWICE_ENV__: JSON.stringify(adwiceEnvironment),
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      // This plugin supplies the Vinext runtime and optional D1/R2 emulation;
      // it receives no Adwice credentials. Those come from the build-only
      // constant above instead of Worker bindings.
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
