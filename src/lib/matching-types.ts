import type { Sector, Stage } from "./data";

/** Business models used across investor + startup matching. */
export type BusinessModel =
  | "B2B SaaS"
  | "B2B Marketplace"
  | "B2C / Consumer"
  | "D2C Commerce"
  | "Fintech / Lending"
  | "Deep Tech / R&D"
  | "Hardware"
  | "Services";

/** The founder profile that drives both engines. */
export interface StartupProfile {
  name: string;
  oneLiner: string;
  sector: Sector;
  stage: Stage;
  city: string;
  state: string;
  raising: number;
  arr: number;
  monthlyGrowth: number;
  team: number;
  businessModel: BusinessModel;
  dpiit: boolean;
}

export interface InvestorPreferences {
  sectors: Sector[] | "Sector agnostic";
  stages: Stage[];
  /** Indian states, or "Pan-India" / "Global". */
  geographies: string[];
  minCheque: number;
  maxCheque: number;
  businessModels: BusinessModel[] | "Model agnostic";
  /** Typical minimum ARR looked for at first cheque (0 = pre-revenue ok). */
  minArr: number;
  /** Typical minimum MoM growth expectation in %, 0 if none. */
  minMonthlyGrowth: number;
  leadPreference: "Lead" | "Follow" | "Lead or follow";
  /** Soft preference only, never a hard gate. */
  prefersDpiit: boolean;
}

export interface Investor {
  id: string;
  name: string;
  type: "VC Fund" | "Angel Network" | "Micro VC" | "Family Office" | "Accelerator";
  city: string;
  state: string;
  thesis: string;
  portfolioAreas: string[];
  notes: string[];
  preferences: InvestorPreferences;
}

export type ReasonKind = "match" | "warn" | "fail";

export interface MatchReason {
  kind: ReasonKind;
  label: string;
}

export interface ScoreComponent {
  key: string;
  label: string;
  score: number;
  max: number;
  note: string;
}

export type MatchBand = "Strong Match" | "Good Match" | "Potential Match" | "Low Match";

export interface InvestorMatchResult {
  investor: Investor;
  score: number;
  band: MatchBand;
  components: ScoreComponent[];
  reasons: MatchReason[];
  summary: string;
}

export interface Scheme {
  id: string;
  name: string;
  organization: string;
  description: string;
  support: string;
  funding_amount: string;
  /** Upper bound of support in INR, for amount filtering. */
  funding_amount_max: number;
  funding_type:
    | "Grant"
    | "Equity"
    | "Convertible Debt"
    | "Loan"
    | "Loan Guarantee"
    | "Incubation";
  sectors: Sector[] | "All";
  startup_stages: Stage[];
  /** Indian states, or "All India". */
  states: string[];
  dpiit_required: boolean;
  min_revenue: number | null;
  max_revenue: number | null;
  official_url: string;
  eligibility: string[];
  application_process: string;
  /** Conditions O cannot verify from the profile alone. */
  verification_points: string[];
  /**
   * A gating requirement O cannot judge from the profile (promoter category,
   * institutional affiliation, no direct application route). Present means the
   * score is capped and the match is always shown as needing verification.
   */
  conditional_gate?: string;
  last_verified: string;
}

export type EligibilityStatus =
  | "Potential match"
  | "Needs verification"
  | "Low match"
  | "Not currently eligible";

export interface SchemeMatchResult {
  scheme: Scheme;
  score: number;
  status: EligibilityStatus;
  components: ScoreComponent[];
  reasons: MatchReason[];
  blockers: string[];
  verification: string[];
  summary: string;
}
