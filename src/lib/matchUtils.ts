import type { Sector, Stage } from "./data";
import { STAGES } from "./data";
import type { MatchBand } from "./matching-types";

/** Sectors that read as neighbouring theses to a rule-based engine. */
const ADJACENT: Record<Sector, Sector[]> = {
  "AI/ML": ["SaaS", "DeepTech & Hardware", "Fintech", "HealthTech"],
  SaaS: ["AI/ML", "Fintech", "EdTech"],
  Fintech: ["SaaS", "AI/ML", "D2C"],
  D2C: ["Fintech", "HealthTech", "AgriTech"],
  AgriTech: ["Climate", "D2C", "DeepTech & Hardware"],
  HealthTech: ["Biotechnology", "AI/ML", "D2C"],
  Biotechnology: ["HealthTech", "DeepTech & Hardware", "AgriTech"],
  "DeepTech & Hardware": ["AI/ML", "EV & Mobility", "Climate", "Biotechnology"],
  "EV & Mobility": ["Climate", "DeepTech & Hardware"],
  EdTech: ["SaaS", "AI/ML"],
  Climate: ["EV & Mobility", "AgriTech", "DeepTech & Hardware"],
};

export function isAdjacentSector(a: Sector, b: Sector) {
  return ADJACENT[a]?.includes(b) ?? false;
}

/** Distance in stage steps, e.g. Seed vs Pre-seed = 1. */
export function stageDistance(a: Stage, b: Stage) {
  return Math.abs(STAGES.indexOf(a) - STAGES.indexOf(b));
}

export function nearestStageDistance(stage: Stage, stages: Stage[]) {
  if (stages.length === 0) return 99;
  return Math.min(...stages.map((s) => stageDistance(stage, s)));
}

const REGIONS: Record<string, string[]> = {
  North: ["Punjab", "Haryana", "Chandigarh", "Delhi", "Uttar Pradesh", "Himachal Pradesh", "Rajasthan", "Uttarakhand"],
  West: ["Maharashtra", "Gujarat", "Goa", "Madhya Pradesh"],
  South: ["Karnataka", "Tamil Nadu", "Telangana", "Kerala", "Andhra Pradesh"],
  East: ["West Bengal", "Odisha", "Bihar", "Jharkhand", "Assam"],
};

export function sameRegion(a: string, b: string) {
  return Object.values(REGIONS).some((r) => r.includes(a) && r.includes(b));
}

export function band(score: number): MatchBand {
  if (score >= 85) return "Strong Match";
  if (score >= 70) return "Good Match";
  if (score >= 50) return "Potential Match";
  return "Low Match";
}

export const inrShort = (v: number) => {
  if (v >= 10000000) return `₹${Number((v / 10000000).toFixed(2))} Cr`;
  if (v >= 100000) return `₹${Number((v / 100000).toFixed(1))} L`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
