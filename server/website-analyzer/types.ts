export type AnalysisStatus =
  | "queued" | "validating" | "fetching" | "crawling" | "extracting"
  | "performance_analysis" | "technical_analysis" | "seo_analysis"
  | "ux_analysis" | "ads_analysis" | "conversion_analysis"
  | "ai_analysis" | "scoring" | "completed" | "failed";

export type CategoryKey = "technical" | "ux" | "seo" | "googleAds" | "conversion" | "performance" | "trust";
export type CheckStatus = "pass" | "warning" | "fail" | "info" | "not_applicable";

export interface LinkData { href: string; text: string }
export interface AnalyzedPage {
  url: string; statusCode: number; title?: string; metaDescription?: string;
  canonical?: string; htmlLang?: string; h1: string[]; h2: string[]; h3: string[];
  paragraphs: string[]; wordCount: number; internalLinks: LinkData[];
  externalLinks: LinkData[]; images: { src: string; alt: string }[];
  forms: { fields: number; requiredFields: number; hasEmail: boolean; hasPhone: boolean; action?: string }[];
  buttons: string[]; ctaCandidates: string[]; phoneNumbers: string[];
  emailAddresses: string[]; whatsappLinks: string[]; structuredData: unknown[];
  scripts: string[]; socialLinks: string[]; viewport?: string;
  robotsDirectives: string[]; openGraph: boolean; text: string; urlLinks: string[];
}

export interface WebsiteCheckResult {
  id: string; category: CategoryKey; name: string; description: string;
  status: CheckStatus; score: number; maxScore: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  confidence: number; evidence?: Record<string, unknown>;
  whyItMatters: string; recommendation?: string;
  source: "crawler" | "dom" | "pagespeed" | "ai" | "combined";
}

export interface SuggestedKeyword {
  keyword: string; intent: "informational" | "commercial" | "transactional" | "navigational";
  relevance: number; evidence: string[]; bestLandingPage?: string;
  landingPageScore?: number; issues?: string[]; recommendation?: string;
}

export interface WebsiteRecommendation {
  id: string; title: string; priority: "critical" | "high" | "medium" | "low";
  impact: "high" | "medium" | "low"; effort: "low" | "medium" | "high";
  categories: CategoryKey[]; problem: string; evidence: Record<string, unknown>;
  recommendation: string; expectedBenefit: string; relatedChecks: string[];
}

export interface WebsiteAnalysisReport {
  id: string; requestedUrl: string; normalizedUrl: string; status: "completed";
  analyzedAt: string;
  website: {
    businessName?: string; businessCategory?: string; businessDescription?: string;
    primaryServices: string[]; products: string[]; locations: string[];
    targetCustomer?: string; primaryOffer?: string; primaryCTA?: string;
    secondaryCTAs: string[]; likelyCustomerIntent: string[]; importantTopics: string[];
    suggestedKeywords: SuggestedKeyword[]; ecommerce: boolean; technologies: string[];
  };
  summary: { overallScore: number; rating: string; message: string; checksTotal: number; passed: number; warnings: number; failed: number };
  categoryScores: Record<CategoryKey, number | null>;
  categories: { id: CategoryKey; name: string; score: number | null; status: string; issueCount: number; checks: WebsiteCheckResult[] }[];
  googleAdsReadiness: { score: number; usableServices: string[]; usableBenefits: string[]; usableLocations: string[]; usableOffers: string[]; missingInformation: string[]; keywordOpportunities: SuggestedKeyword[] };
  conversionReadiness: { score: number; detectedActions: string[]; missingSignals: string[]; ecommerce: boolean };
  keywordIntelligence: SuggestedKeyword[];
  topRecommendations: WebsiteRecommendation[];
  recommendations: WebsiteRecommendation[];
  pagesAnalyzed: { url: string; title?: string; statusCode: number; wordCount: number }[];
  meta: { pagesCrawled: number; analysisVersion: string; aiUsed: boolean; performanceProvider?: string; cached: boolean };
}

export interface AnalysisRecord {
  id: string; requestedUrl: string; normalizedUrl: string; status: AnalysisStatus;
  progress: number; currentStep: string; updatedAt: string;
  error?: { code: string; message: string }; report?: WebsiteAnalysisReport;
}
