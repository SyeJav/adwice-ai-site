/** Server-side defaults used when an optional non-secret setting is omitted. */
export const adwiceConfig = {
  apiBaseUrl: "http://api.adbud.test",
  accountRequestPath: "/api/adbud/register",
  email: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTls: true,
    username: "",
    address: "",
    name: "AdWice",
    recipient: "",
  },
} as const;
