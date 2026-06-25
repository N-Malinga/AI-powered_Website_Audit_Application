// Mirrors the backend AuditResult contract (camelCase JSON).

export type Severity = "Ok" | "Minor" | "Warning" | "Critical";
export type Priority = "Low" | "Medium" | "High";

export type InsightCategory =
  | "seoStructure"
  | "messagingClarity"
  | "ctaUsage"
  | "contentDepth"
  | "uxStructural";

export interface PageMetrics {
  wordCount: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  ctaCount: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesMissingAltCount: number;
  imagesMissingAltPercent: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface Insight {
  category: string;
  observation: string;
  severity: Severity;
  evidence: string[];
}

export interface Recommendation {
  priority: Priority;
  title: string;
  action: string;
  reasoning: string;
  relatedMetrics: string[];
}

export interface PromptLog {
  systemPrompt: string;
  userPrompt: string;
  structuredInput: string;
  rawOutput: string;
}

export interface GroundingResult {
  passed: boolean;
  distinctMetricsReferenced: number;
  required: number;
  retried: boolean;
}

export interface AuditResult {
  metrics: PageMetrics;
  insights: Insight[];
  recommendations: Recommendation[];
  promptLog: PromptLog | null;
  grounding: GroundingResult;
}
