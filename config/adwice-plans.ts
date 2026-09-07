export const adwicePlans = [
  {
    id: "plan_01",
    label: "Search Ads",
    description: "Capture people actively searching",
    monthlyPlatformFees: { USD: 39, INR: 2999 },
    default_budget: { USD: 5, INR: 150 },
  },
  {
    id: "plan_02",
    label: "Social Ads",
    description: "Create demand on Facebook & Instagram",
    monthlyPlatformFees: { USD: 39, INR: 3999 },
    default_budget: { USD: 5, INR: 150 },
  },
  {
    id: "plan_03",
    label: "Search + Social Ads",
    description: "Capture demand and create more of it",
    monthlyPlatformFees: { USD: 69, INR: 5999 },
    default_budget: { USD: 10, INR: 300 },
  },
] as const;

export type AdwicePlanId = (typeof adwicePlans)[number]["id"];
