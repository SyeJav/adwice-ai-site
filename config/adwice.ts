/** Server-side defaults. Production can override the base URL with ADWICE_API_BASE_URL. */
export const adwiceConfig = {
  apiBaseUrl: "http://api.adbud.test",
  apiToken: "4FSj5rgDjy1d6c2YPKdXGMMsZgJa6P", // Set the registration API bearer token here.
  accountRequestPath: "/api/adbud/register",
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
