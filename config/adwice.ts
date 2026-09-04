/** Server-side defaults. Production can override the base URL with ADWICE_API_BASE_URL. */
export const adwiceConfig = {
  apiBaseUrl: "https://api.adwice.in",
  accountRequestPath: "/api/adbud/register",
  ADWICE_API_TOKEN: "Eusb6y7yADJPAcTLDtCAZByxj1Jl4cfMH3rS4TKU",
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
