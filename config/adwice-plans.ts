export const adwicePlans = [
  { id: "plan_01", label: "Search Ads", description: "Capture people actively searching", monthlyPlatformFees: { USD: 29, INR: 2500 } },
  { id: "plan_02", label: "Social Ads", description: "Create demand on Facebook & Instagram", monthlyPlatformFees: { USD: 49, INR: 4499 } },
  { id: "plan_03", label: "Search + Social Ads", description: "Capture demand and create more of it", monthlyPlatformFees: { USD: 79, INR: 6999 } },
] as const;

export type AdwicePlanId = (typeof adwicePlans)[number]["id"];
