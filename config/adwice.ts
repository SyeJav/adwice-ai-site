/** Server-side defaults. Production can override the base URL with ADWICE_API_BASE_URL. */
export const adwiceConfig = {
  apiBaseUrl: "http://api.adbud.test",
  apiToken: "", // Set the registration API bearer token here.
  accountRequestPath: "/adbud/request",
  email: {
    host: "smtp.gmail.com",
    port: 587,
    username: "myadwice@gmail.com",
    passwordEnv: "ADWICE_SMTP_PASSWORD",
    address: "care@myadwice.com",
    name: "AdWice",
    recipient: "care@myadwice.com",
  },
} as const;
