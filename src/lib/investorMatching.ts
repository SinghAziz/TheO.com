import { INVESTORS } from "@/data/investors";
import type {
  Investor,
  InvestorMatchResult,
  MatchReason,
  ScoreComponent,
  StartupProfile,
} from "./matching-types";
import {
  band,
  clamp,
  inrShort,
  isAdjacentSector,
  nearestStageDistance,
  sameRegion,
} from "./matchUtils";

export const INVESTOR_WEIGHTS = {
  sector: 30,
  stage: 20,
  cheque: 20,
  geography: 10,
  model: 10,
  traction: 10,
} as const;

function sectorScore(s: StartupProfile, i: Investor) {
  const p = i.preferences;
  if (p.sectors === "Sector agnostic")
    return { score: 24, note: "Sector-agnostic mandate", kind: "match" as const,
      label: `Invests across sectors, including ${s.sector}` };
  if (p.sectors.includes(s.sector))
    return { score: 30, note: `${s.sector} is an active focus area`, kind: "match" as const,
      label: `${s.sector} is a stated focus sector` };
  const adjacent = p.sectors.find((x) => isAdjacentSector(s.sector, x));
  if (adjacent)
    return { score: 17, note: `Adjacent to ${adjacent}`, kind: "warn" as const,
      label: `No direct ${s.sector} mandate, but invests in adjacent ${adjacent}` };
  return { score: 3, note: `Focus is ${p.sectors.slice(0, 3).join(", ")}`, kind: "fail" as const,
    label: `Focus is ${p.sectors.slice(0, 3).join(", ")}, not ${s.sector}` };
}

function stageScore(s: StartupProfile, i: Investor) {
  const d = nearestStageDistance(s.stage, i.preferences.stages);
  if (d === 0)
    return { score: 20, note: `${s.stage} is in the mandate`, kind: "match" as const,
      label: `${s.stage}-stage focus` };
  if (d === 1)
    return { score: 12, note: "One stage away", kind: "warn" as const,
      label: `Usually invests at ${i.preferences.stages.join(" / ")}, one step from your ${s.stage} round` };
  return { score: d === 2 ? 5 : 0, note: `${d} stages away`, kind: "fail" as const,
    label: `Invests at ${i.preferences.stages.join(" / ")} — far from your ${s.stage} stage` };
}

function chequeScore(s: StartupProfile, i: Investor) {
  const { minCheque, maxCheque } = i.preferences;
  const range = `${inrShort(minCheque)}–${inrShort(maxCheque)}`;
  if (s.raising >= minCheque && s.raising <= maxCheque)
    return { score: 20, note: `Typical cheque ${range}`, kind: "match" as const,
      label: `Typical cheque ${range} fits your ${inrShort(s.raising)} requirement` };
  if (s.raising > maxCheque) {
    const ratio = maxCheque / s.raising;
    if (ratio >= 0.4)
      return { score: 12, note: `Can anchor part of the round`, kind: "warn" as const,
        label: `Max cheque ${inrShort(maxCheque)} covers only part of your ${inrShort(s.raising)} round` };
    return { score: 4, note: `Cheque much smaller than your round`, kind: "fail" as const,
      label: `Cheque size ${range} is well below your ${inrShort(s.raising)} requirement` };
  }
  const ratio = s.raising / minCheque;
  if (ratio >= 0.5)
    return { score: 11, note: "Slightly below their minimum", kind: "warn" as const,
      label: `Your ${inrShort(s.raising)} round is below their usual minimum of ${inrShort(minCheque)}` };
  return { score: 3, note: "Round far below their minimum", kind: "fail" as const,
    label: `Minimum cheque ${inrShort(minCheque)} is far above your ${inrShort(s.raising)} round` };
}

function geographyScore(s: StartupProfile, i: Investor) {
  const g = i.preferences.geographies;
  if (g.includes("Pan-India") || g.includes("Global"))
    return { score: 10, note: "Invests across India", kind: "match" as const,
      label: "Invests across India" };
  if (g.includes(s.state))
    return { score: 10, note: `Active in ${s.state}`, kind: "match" as const,
      label: `Actively invests in ${s.state}` };
  if (g.some((x) => sameRegion(x, s.state)))
    return { score: 6, note: "Same region", kind: "warn" as const,
      label: `Focus is ${g.slice(0, 3).join(", ")} — same region as ${s.state}, not the state itself` };
  return { score: 2, note: `Focus is ${g.slice(0, 3).join(", ")}`, kind: "fail" as const,
    label: `Geography focus is ${g.slice(0, 3).join(", ")}, not ${s.state}` };
}

function modelScore(s: StartupProfile, i: Investor) {
  const m = i.preferences.businessModels;
  if (m === "Model agnostic")
    return { score: 7, note: "No fixed model preference", kind: "match" as const,
      label: "No fixed business-model preference" };
  if (m.includes(s.businessModel))
    return { score: 10, note: `${s.businessModel} is in scope`, kind: "match" as const,
      label: `Backs ${s.businessModel} companies` };
  return { score: 2, note: `Prefers ${m.slice(0, 2).join(", ")}`, kind: "warn" as const,
    label: `Usually backs ${m.slice(0, 2).join(", ")} rather than ${s.businessModel}` };
}

function tractionScore(s: StartupProfile, i: Investor) {
  const { minArr, minMonthlyGrowth } = i.preferences;
  let score = 5;
  const reasons: MatchReason[] = [];
  if (minArr > 0) {
    if (s.arr >= minArr) {
      reasons.push({ kind: "match", label: `Your ${inrShort(s.arr)} ARR clears their typical ${inrShort(minArr)} bar` });
    } else if (s.arr >= minArr * 0.5) {
      score -= 2;
      reasons.push({ kind: "warn", label: `Your ARR (${inrShort(s.arr)}) is below their typical ${inrShort(minArr)} range` });
    } else {
      score -= 3;
      reasons.push({ kind: "warn", label: `Your ARR (${inrShort(s.arr)}) is well below their typical ${inrShort(minArr)} range` });
    }
  } else {
    reasons.push({ kind: "match", label: "Comfortable with pre-revenue companies" });
  }
  if (minMonthlyGrowth > 0 && s.monthlyGrowth < minMonthlyGrowth) {
    score -= 1;
    reasons.push({ kind: "warn", label: `${s.monthlyGrowth}% MoM growth is under the ~${minMonthlyGrowth}% they usually look for` });
  } else if (minMonthlyGrowth > 0) {
    reasons.push({ kind: "match", label: `${s.monthlyGrowth}% MoM growth is in line with their expectations` });
  }
  return { score: clamp(score, 0, 5), reasons };
}

function otherScore(s: StartupProfile, i: Investor) {
  let score = 2;
  const reasons: MatchReason[] = [];
  if (i.preferences.leadPreference === "Lead" || i.preferences.leadPreference === "Lead or follow") {
    score += 2;
    reasons.push({ kind: "match", label: `Can ${i.preferences.leadPreference === "Lead" ? "lead" : "lead or follow"} your round` });
  } else {
    reasons.push({ kind: "warn", label: "Typically follows — you will still need a lead investor" });
  }
  if (i.preferences.prefersDpiit) {
    if (s.dpiit) {
      score += 1;
      reasons.push({ kind: "match", label: "DPIIT recognition helps with their process" });
    } else {
      reasons.push({ kind: "warn", label: "Prefers DPIIT-recognised startups" });
    }
  } else if (s.team >= 3) {
    score += 1;
    reasons.push({ kind: "match", label: `Team of ${s.team} is workable for their diligence` });
  }
  return { score: clamp(score, 0, 5), reasons };
}

export function scoreInvestor(startup: StartupProfile, investor: Investor): InvestorMatchResult {
  const sec = sectorScore(startup, investor);
  const st = stageScore(startup, investor);
  const ch = chequeScore(startup, investor);
  const geo = geographyScore(startup, investor);
  const bm = modelScore(startup, investor);
  const tr = tractionScore(startup, investor);
  const ot = otherScore(startup, investor);

  const components: ScoreComponent[] = [
    { key: "sector", label: "Sector", score: sec.score, max: INVESTOR_WEIGHTS.sector, note: sec.note },
    { key: "stage", label: "Stage", score: st.score, max: INVESTOR_WEIGHTS.stage, note: st.note },
    { key: "cheque", label: "Cheque size", score: ch.score, max: INVESTOR_WEIGHTS.cheque, note: ch.note },
    { key: "geography", label: "Geography", score: geo.score, max: INVESTOR_WEIGHTS.geography, note: geo.note },
    { key: "model", label: "Business model", score: bm.score, max: INVESTOR_WEIGHTS.model, note: bm.note },
    { key: "traction", label: "Traction", score: tr.score * 2, max: INVESTOR_WEIGHTS.traction, note: "ARR and growth vs their usual bar" },
  ];

  const score = Math.round(components.reduce((a, c) => a + c.score, 0));
  const reasons: MatchReason[] = [
    { kind: sec.kind, label: sec.label },
    { kind: st.kind, label: st.label },
    { kind: ch.kind, label: ch.label },
    { kind: geo.kind, label: geo.label },
    { kind: bm.kind, label: bm.label },
    ...tr.reasons,
    ...ot.reasons,
  ];

  const b = band(score);
  const lead = b === "Strong Match" ? "Strong match" : b === "Good Match" ? "Good match" : b === "Potential Match" ? "Worth a look" : "Weak match";
  const summary =
    `${lead} — you are a ${startup.state}-based ${startup.stage.toLowerCase()}-stage ${startup.sector} ` +
    `${startup.businessModel} company seeking ${inrShort(startup.raising)}. ` +
    (sec.kind === "match" ? `That sits inside this investor's sector mandate` : `This investor's sector mandate is a partial fit`) +
    (st.kind === "match" ? `, matches their ${investor.preferences.stages.join(" / ")} stage focus` : `, sits outside their usual ${investor.preferences.stages.join(" / ")} stage focus`) +
    (ch.kind === "match"
      ? ` and fits their ${inrShort(investor.preferences.minCheque)}–${inrShort(investor.preferences.maxCheque)} cheque range.`
      : ` and their cheque range is ${inrShort(investor.preferences.minCheque)}–${inrShort(investor.preferences.maxCheque)}.`);

  return { investor, score, band: b, components, reasons, summary };
}

export function rankInvestors(startup: StartupProfile): InvestorMatchResult[] {
  return INVESTORS.map((i) => scoreInvestor(startup, i)).sort(
    (a, b) => b.score - a.score || a.investor.name.localeCompare(b.investor.name),
  );
}
