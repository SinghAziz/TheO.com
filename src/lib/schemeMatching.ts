import { SCHEMES } from "@/data/schemes";
import type {
  EligibilityStatus,
  MatchReason,
  Scheme,
  SchemeMatchResult,
  ScoreComponent,
  StartupProfile,
} from "./matching-types";
import { clamp, inrShort, isAdjacentSector, nearestStageDistance } from "./matchUtils";

export const SCHEME_WEIGHTS = {
  sector: 25,
  stage: 20,
  geography: 15,
  dpiit: 15,
  funding: 10,
  revenue: 10,
  other: 5,
} as const;

export function scoreScheme(s: StartupProfile, scheme: Scheme): SchemeMatchResult {
  const reasons: MatchReason[] = [];
  const blockers: string[] = [];

  /* Sector — an explicit sector list the startup fails is a hard requirement. */
  let sector = 0;
  let sectorNote = "";
  if (scheme.sectors === "All") {
    sector = 22;
    sectorNote = "Open to all sectors";
    reasons.push({ kind: "match", label: "Sector-agnostic scheme — your sector is not a barrier" });
  } else if (scheme.sectors.includes(s.sector)) {
    sector = 25;
    sectorNote = `${s.sector} is explicitly covered`;
    reasons.push({ kind: "match", label: `${s.sector} is within the scheme's stated sectors` });
  } else if (scheme.sectors.some((x) => isAdjacentSector(s.sector, x))) {
    sector = 6;
    sectorNote = `Adjacent sectors only`;
    blockers.push(`Requires a focus on ${scheme.sectors.slice(0, 3).join(" / ")} — your ${s.sector} work is adjacent but not covered`);
    reasons.push({ kind: "fail", label: `Requires a focus on ${scheme.sectors.slice(0, 3).join(" / ")}` });
  } else {
    sector = 0;
    sectorNote = `Restricted to ${scheme.sectors.slice(0, 3).join(", ")}`;
    blockers.push(`Requires a focus on ${scheme.sectors.slice(0, 3).join(" / ")} — not ${s.sector}`);
    reasons.push({ kind: "fail", label: `Requires a focus on ${scheme.sectors.slice(0, 3).join(" / ")}` });
  }

  /* Stage */
  const d = nearestStageDistance(s.stage, scheme.startup_stages);
  let stage = 0;
  let stageNote = "";
  if (d === 0) {
    stage = 20;
    stageNote = `${s.stage} stage is covered`;
    reasons.push({ kind: "match", label: `${s.stage} stage matches the scheme` });
  } else if (d === 1) {
    stage = 10;
    stageNote = "One stage away";
    reasons.push({ kind: "warn", label: `Scheme targets ${scheme.startup_stages.join(" / ")} — one step from your ${s.stage} stage` });
  } else {
    stage = 0;
    stageNote = `Targets ${scheme.startup_stages.join(", ")}`;
    blockers.push(`Requires startup stage ${scheme.startup_stages.join(" / ")}, you are at ${s.stage}`);
    reasons.push({ kind: "fail", label: `Requires ${scheme.startup_stages.join(" / ")} stage` });
  }

  /* Geography */
  const allIndia = scheme.states.includes("All India");
  let geography = 0;
  let geoNote = "";
  if (allIndia) {
    geography = 15;
    geoNote = "Central scheme, open across India";
    reasons.push({ kind: "match", label: "Central scheme open to Indian startups in any state" });
  } else if (scheme.states.includes(s.state)) {
    geography = 15;
    geoNote = `${s.state} scheme`;
    reasons.push({ kind: "match", label: `State scheme for ${s.state} — you are based there` });
  } else {
    geography = 0;
    geoNote = `Limited to ${scheme.states.join(", ")}`;
    blockers.push(`Requires registration in ${scheme.states.join(" / ")}, you are in ${s.state}`);
    reasons.push({ kind: "fail", label: `Requires a ${scheme.states.join(" / ")} presence` });
  }

  /* DPIIT */
  let dpiit = 0;
  let dpiitNote = "";
  if (scheme.dpiit_required) {
    if (s.dpiit) {
      dpiit = 15;
      dpiitNote = "DPIIT recognition required and held";
      reasons.push({ kind: "match", label: "DPIIT recognition required — you have it" });
    } else {
      dpiit = 0;
      dpiitNote = "DPIIT recognition required";
      blockers.push("Requires DPIIT recognition, which your profile says you do not have yet");
      reasons.push({ kind: "fail", label: "Requires DPIIT recognition" });
    }
  } else {
    dpiit = s.dpiit ? 13 : 11;
    dpiitNote = "DPIIT not mandatory";
    reasons.push({ kind: "match", label: "DPIIT recognition is not mandatory for this scheme" });
  }

  /* Funding requirement vs what the scheme can give */
  let funding = 0;
  const cover = scheme.funding_amount_max / Math.max(1, s.raising);
  if (cover >= 0.5) {
    funding = 10;
    reasons.push({ kind: "match", label: `Support of ${scheme.funding_amount} is meaningful against your ${inrShort(s.raising)} requirement` });
  } else if (cover >= 0.15) {
    funding = 7;
    reasons.push({ kind: "match", label: `Covers part of your ${inrShort(s.raising)} requirement (${scheme.funding_amount})` });
  } else {
    funding = 3;
    reasons.push({ kind: "warn", label: `Support is small relative to your ${inrShort(s.raising)} requirement` });
  }

  /* Revenue compatibility */
  let revenue = 10;
  let revNote = "No revenue condition in the profile check";
  if (scheme.max_revenue !== null && s.arr > scheme.max_revenue) {
    revenue = 0;
    revNote = `Revenue cap ${inrShort(scheme.max_revenue)}`;
    blockers.push(`Revenue cap of about ${inrShort(scheme.max_revenue)} — your ${inrShort(s.arr)} ARR is above it`);
    reasons.push({ kind: "fail", label: `Aimed at startups under about ${inrShort(scheme.max_revenue)} revenue` });
  } else if (scheme.min_revenue !== null && s.arr < scheme.min_revenue) {
    revenue = 4;
    revNote = `Expects around ${inrShort(scheme.min_revenue)} revenue`;
    reasons.push({ kind: "warn", label: `Usually expects stable revenue near ${inrShort(scheme.min_revenue)} — you are at ${inrShort(s.arr)}` });
  } else if (scheme.min_revenue !== null || scheme.max_revenue !== null) {
    revNote = "Revenue range compatible";
    reasons.push({ kind: "match", label: `Your ${inrShort(s.arr)} ARR sits inside the scheme's revenue expectations` });
  }

  /* Other criteria — team, model fit for R&D-heavy programmes */
  let other = 3;
  if (scheme.funding_type === "Grant" || scheme.funding_type === "Incubation") other += 1;
  if (s.team >= 2) other += 1;
  const otherNote = "Funding type and team readiness";

  const components: ScoreComponent[] = [
    { key: "sector", label: "Sector", score: sector, max: SCHEME_WEIGHTS.sector, note: sectorNote },
    { key: "stage", label: "Startup stage", score: stage, max: SCHEME_WEIGHTS.stage, note: stageNote },
    { key: "geography", label: "Geography", score: geography, max: SCHEME_WEIGHTS.geography, note: geoNote },
    { key: "dpiit", label: "DPIIT status", score: dpiit, max: SCHEME_WEIGHTS.dpiit, note: dpiitNote },
    { key: "funding", label: "Funding requirement", score: funding, max: SCHEME_WEIGHTS.funding, note: scheme.funding_amount },
    { key: "revenue", label: "Revenue compatibility", score: revenue, max: SCHEME_WEIGHTS.revenue, note: revNote },
    { key: "other", label: "Other eligibility", score: clamp(other, 0, 5), max: SCHEME_WEIGHTS.other, note: otherNote },
  ];

  const raw = Math.round(components.reduce((a, c) => a + c.score, 0));
  /* A failed explicit requirement must never read as a high match, and a gate
     O cannot judge from the profile must never read as confirmed eligibility. */
  let score = blockers.length > 0 ? Math.min(raw, 34) : raw;
  if (blockers.length === 0 && scheme.conditional_gate) {
    score = Math.min(score, 65);
    reasons.push({ kind: "warn", label: scheme.conditional_gate });
  }

  let status: EligibilityStatus;
  if (blockers.length > 0) status = "Not currently eligible";
  else if (scheme.conditional_gate) status = "Needs verification";
  else if (score >= 70) status = "Potential match";
  else if (score >= 50) status = "Needs verification";
  else status = "Low match";

  const verification = scheme.verification_points;

  const summary =
    blockers.length > 0
      ? `Not currently eligible: ${blockers[0]}. Everything else about your profile can still fit, so revisit this if that condition changes.`
      : `${scheme.conditional_gate ? "Needs verification" : "Potential match"} for a ${s.state}-based ${s.stage.toLowerCase()}-stage ${s.sector} startup${s.dpiit ? " with DPIIT recognition" : ""}. ` +
        `Your profile lines up with the scheme's stated sector, stage and location conditions — final eligibility is decided by ${scheme.organization} against the full guidelines.`;

  return { scheme, score, status, components, reasons, blockers, verification, summary };
}

export function rankSchemes(startup: StartupProfile): SchemeMatchResult[] {
  return SCHEMES.map((s) => scoreScheme(startup, s)).sort(
    (a, b) => b.score - a.score || a.scheme.name.localeCompare(b.scheme.name),
  );
}
