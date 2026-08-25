export const adwicePlans = [
  { id: "plan_01", label: "Search Ads" },
  { id: "plan_02", label: "Social Ads" },
  { id: "plan_03", label: "Search + Social Ads" },
] as const;

export type AdwicePlanId = (typeof adwicePlans)[number]["id"];
