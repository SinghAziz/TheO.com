import type { StartupProfile } from "./matching-types";
import { clamp } from "./matchUtils";

/** The six deterministic evaluation dimensions of the O Score. */
export interface EvaluationScore {
  key: "team" | "market" | "product" | "traction" | "financials" | "growth";
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface Evaluation {
  scores: EvaluationScore[];
  overall: number;
  band: string;
  tone: "positive" | "warning" | "negative";
  strengths: string[];
  weaknesses: string[];
}

const STAGE_INDEX: Record<string, number> = {
  Idea: 0,
  "Pre-seed": 1,
  Seed: 2,
  "Pre-Series A": 3,
  "Series A": 4,
};

/** Rough revenue expectation (INR ARR) by stage, used only as a prototype bar. */
const STAGE_ARR_BAR = [0, 500000, 4000000, 15000000, 40000000];

/** Prototype market-opportunity view of each sector in the Indian context. */
const SECTOR_MARKET: Record<string, number> = {
  "AI/ML": 88,
  SaaS: 84,
  Fintech: 86,
  D2C: 72,
  AgriTech: 74,
  HealthTech: 80,
  Biotechnology: 76,
  "DeepTech & Hardware": 78,
  "EV & Mobility": 79,
  EdTech: 66,
  Climate: 77,
};

const MODEL_PRODUCT: Record<string, number> = {
  "B2B SaaS": 82,
  "B2B Marketplace": 74,
  "B2C / Consumer": 70,
  "D2C Commerce": 68,
  "Fintech / Lending": 74,
  "Deep Tech / R&D": 76,
  Hardware: 66,
  Services: 58,
};

export function evaluate(s: StartupProfile): Evaluation {
  const stageIdx = STAGE_INDEX[s.stage] ?? 1;
  const bar = STAGE_ARR_BAR[stageIdx] ?? 0;

  /* Team — headcount relative to stage, plus formalisation signal. */
  const expectedTeam = [2, 3, 6, 12, 20][stageIdx] ?? 6;
  const teamScore = clamp(
    Math.round(40 + (s.team / expectedTeam) * 35 + (s.dpiit ? 8 : 0)),
    0,
    100,
  );

  /* Market — sector view, slightly widened by a national footprint stage. */
  const marketScore = clamp(
    Math.round((SECTOR_MARKET[s.sector] ?? 70) - 6 + stageIdx * 2),
    0,
    100,
  );

  /* Product — model plus how far the company has been shipped into the market. */
  const productScore = clamp(
    Math.round((MODEL_PRODUCT[s.businessModel] ?? 70) - 10 + stageIdx * 6),
    0,
    100,
  );

  /* Traction — revenue against the typical bar for the stage. */
  const tractionScore =
    bar === 0
      ? clamp(Math.round(45 + Math.min(30, s.arr / 100000)), 0, 100)
      : clamp(Math.round((s.arr / bar) * 72), 0, 100);

  /* Financials — how much revenue backs the size of the ask. */
  const askRatio = s.raising > 0 ? s.arr / s.raising : 0;
  const financialsScore = clamp(
    Math.round(38 + askRatio * 120 + (s.dpiit ? 5 : 0)),
    0,
    100,
  );

  /* Growth — MoM growth against a 10% reference. */
  const growthScore = clamp(Math.round((s.monthlyGrowth / 10) * 70), 0, 100);

  const scores: EvaluationScore[] = [
    { key: "team", label: "Team", score: teamScore, weight: 15, note: `${s.team} people at ${s.stage} stage` },
    { key: "market", label: "Market", score: marketScore, weight: 20, note: `${s.sector} opportunity view` },
    { key: "product", label: "Product", score: productScore, weight: 15, note: `${s.businessModel} maturity for ${s.stage}` },
    { key: "traction", label: "Traction", score: tractionScore, weight: 20, note: bar === 0 ? "Pre-revenue expectations" : `Revenue vs a typical ${s.stage} bar` },
    { key: "financials", label: "Financials", score: financialsScore, weight: 15, note: "Revenue backing the size of the raise" },
    { key: "growth", label: "Growth", score: growthScore, weight: 15, note: `${s.monthlyGrowth}% MoM vs a 10% reference` },
  ];

  const totalWeight = scores.reduce((a, c) => a + c.weight, 0);
  const overall = Math.round(
    scores.reduce((a, c) => a + c.score * c.weight, 0) / totalWeight,
  );

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2).map((c) => `${c.label} — ${c.note} (${c.score}/100)`);
  const weaknesses = sorted
    .slice(-2)
    .reverse()
    .map((c) => `${c.label} — ${c.note} (${c.score}/100)`);

  const band =
    overall >= 80 ? "Investment ready" : overall >= 60 ? "Near ready" : "Early";
  const tone: Evaluation["tone"] =
    overall >= 80 ? "positive" : overall >= 60 ? "warning" : "negative";

  return { scores, overall, band, tone, strengths, weaknesses };
}
