export const adwicePlans = [
  {
    id: "plan_01",
    label: "Search Ads",
    description: "Capture people actively searching",
    monthlyPlatformFees: { USD: 29, EUR: 29, INR: 2999 },
    default_budget: { USD: 5, EUR: 5, INR: 150 },
  },
  {
    id: "plan_02",
    label: "Social Ads",
    description: "Create demand on Facebook & Instagram",
    monthlyPlatformFees: { USD: 39, EUR: 39, INR: 3999 },
    default_budget: { USD: 5, EUR: 5, INR: 150 },
  },
  {
    id: "plan_03",
    label: "Pro",
    description:
      "Capture demand on Search and Social Market. Get full access to GBP and Social Media",
    monthlyPlatformFees: { USD: 79, EUR: 79, INR: 6999 },
    default_budget: { USD: 10, EUR: 10, INR: 300 },
  },
  {
    id: "plan_04",
    label: "Social Media Plus",
    description: "We manage your Social Media and free Meta Ads for 5 days",
    monthlyPlatformFees: { USD: 49, EUR: 49, INR: 4999 },
    default_budget: { USD: 0, EUR: 0, INR: 0 },
  },
] as const;

export type AdwicePlanId = (typeof adwicePlans)[number]["id"];
