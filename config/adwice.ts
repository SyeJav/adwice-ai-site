/**
 * Server-side defaults. Configure each market's URL and token as Worker secrets;
 * see README.md. ADWICE_API_BASE_URL remains a legacy fallback for local use.
 */
export const adwiceConfig = {
  apiBaseUrl: "http://api.adbud.test",
  accountRequestPath: "/api/adbud/register",
  email: {
    host: "smtp.gmail.com",
    port: 587,
    username: "myadwice@gmail.com",
    passwordEnv: "ADWICE_SMTP_PASSWORD",
    // Gmail only permits a different From address when it is a verified alias.
    // Use the authenticated mailbox so delivery does not depend on that setup.
    address: "myadwice@gmail.com",
    name: "AdWice",
    recipient: "care@myadwice.com",
  },
} as const;
