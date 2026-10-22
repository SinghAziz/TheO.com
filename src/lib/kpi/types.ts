/** Status vocabulary used everywhere KPI data is displayed. */
export type KPIStatus = "strong" | "healthy" | "attention" | "critical";

export const STATUS_LABEL: Record<KPIStatus, string> = {
  strong: "Strong",
  healthy: "Healthy",
  attention: "Attention",
  critical: "Critical",
};

/**
 * Raw, founder-entered KPI inputs. Nothing here is derived — every value is
 * typed in by the founder. `undefined` means "not provided" and must never be
 * treated as zero.
 */
export interface KPIInput {
  monthlyRevenue?: number;
  previousMonthRevenue?: number;
  cashBalance?: number;
  monthlyBurn?: number;
  totalCustomers?: number;
  cac?: number;
  averageRevenuePerCustomer?: number;
  grossMargin?: number;
  monthlyChurn?: number;
  nrr?: number;
}

/** Metrics calculated by O from the raw inputs. `null` = cannot be derived. */
export interface KPIMetrics {
  mrr: number | null;
  arr: number | null;
  momGrowth: number | null;
  runway: number | null;
  arpc: number | null;
  ltv: number | null;
  ltvCac: number | null;
  cacPayback: number | null;
  burnMultiple: number | null;
}

export interface KPIScoreBreakdown {
  growth: number;
  unitEconomics: number;
  retention: number;
  financialHealth: number;
  overall: number;
}

export type KPICategoryKey = "growth" | "financialHealth" | "unitEconomics" | "retention";

export interface KPICategory {
  key: KPICategoryKey;
  label: string;
  score: number;
  weight: number;
  status: KPIStatus;
  /** True when no input backing this category was provided. */
  provisional: boolean;
}

export interface KPIMetricRow {
  key: string;
  label: string;
  category: KPICategoryKey;
  /** "input" = typed by the founder, "derived" = calculated by O. */
  source: "input" | "derived";
  value: number | null;
  display: string;
  status: KPIStatus | null;
  note: string;
}

export interface KPICoverage {
  provided: number;
  total: number;
  percent: number;
  missing: string[];
}

export interface KPIProfile {
  input: KPIInput;
  metrics: KPIMetrics;
  scores: KPIScoreBreakdown;
  categories: KPICategory[];
  rows: KPIMetricRow[];
  status: KPIStatus;
  /** True when key inputs are missing — the overall score is then indicative. */
  provisional: boolean;
  coverage: KPICoverage;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}
