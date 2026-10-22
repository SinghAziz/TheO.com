import { KPI_BENCHMARKS as B, KPI_WEIGHTS } from "./benchmarks";
import { calculateKPIMetrics } from "./calculations";
import { count, inr, months, multiple, pct, NOT_PROVIDED } from "./format";
import type {
  KPICategory,
  KPICoverage,
  KPIInput,
  KPIMetricRow,
  KPIMetrics,
  KPIProfile,
  KPIScoreBreakdown,
  KPIStatus,
} from "./types";

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Higher value = better. Missing data scores neutral (50), never 0. */
const upward = (v: number | null, low: number, high: number) =>
  v === null ? 50 : v <= low ? 0 : v >= high ? 100 : clamp(((v - low) / (high - low)) * 100);

/** Lower value = better. Missing data scores neutral (50), never 0. */
const downward = (v: number | null, strong: number, weak: number) =>
  v === null ? 50 : v <= strong ? 100 : v >= weak ? 0 : clamp(((weak - v) / (weak - strong)) * 100);

/** Single source of truth for turning any 0-100 score into a status label. */
export function statusFromScore(score: number): KPIStatus {
  return score >= 80 ? "strong" : score >= 65 ? "healthy" : score >= 45 ? "attention" : "critical";
}

/** Key inputs used for the data-coverage / provisional signal. */
const KEY_INPUTS: { key: keyof KPIInput; label: string }[] = [
  { key: "monthlyRevenue", label: "MRR" },
  { key: "previousMonthRevenue", label: "Previous month MRR" },
  { key: "cashBalance", label: "Cash available" },
  { key: "monthlyBurn", label: "Monthly burn" },
  { key: "cac", label: "CAC" },
  { key: "grossMargin", label: "Gross margin" },
  { key: "monthlyChurn", label: "Monthly churn" },
  { key: "nrr", label: "NRR" },
];

function coverageOf(input: KPIInput): KPICoverage {
  const hasArpc =
    input.averageRevenuePerCustomer !== undefined || input.totalCustomers !== undefined;
  const missing = KEY_INPUTS.filter((f) => input[f.key] === undefined).map((f) => f.label);
  if (!hasArpc) missing.push("Customers or ARPC");
  const total = KEY_INPUTS.length + 1;
  const provided = total - missing.length;
  return { provided, total, percent: Math.round((provided / total) * 100), missing };
}

export function scoreKPIProfile(
  input: KPIInput,
  metrics: KPIMetrics = calculateKPIMetrics(input),
): KPIProfile {
  /* ---- category scores ---------------------------------------------- */
  const growth = upward(metrics.momGrowth, B.growth.healthyMoM, B.growth.strongMoM);

  const ltvCacScore = upward(
    metrics.ltvCac,
    B.unitEconomics.acceptableLtvCac,
    B.unitEconomics.strongLtvCac,
  );
  const paybackScore = downward(
    metrics.cacPayback,
    B.unitEconomics.strongPaybackMonths,
    B.unitEconomics.weakPaybackMonths,
  );
  const unitEconomics =
    metrics.ltvCac === null && metrics.cacPayback === null
      ? 50
      : clamp(ltvCacScore * 0.65 + paybackScore * 0.35);

  const nrr = input.nrr ?? null;
  const churn = input.monthlyChurn ?? null;
  const nrrScore = upward(nrr, B.retention.healthyNrr, B.retention.strongNrr);
  const churnScore = downward(churn, B.retention.strongMonthlyChurn, B.retention.weakMonthlyChurn);
  const retention =
    nrr === null && churn === null ? 50 : clamp(nrrScore * 0.6 + churnScore * 0.4);

  const runwayScore =
    metrics.runway === null
      ? 50
      : metrics.runway >= B.financialHealth.strongRunwayMonths
        ? 100
        : metrics.runway <= B.financialHealth.attentionRunwayMonths
          ? 45
          : 45 + ((metrics.runway - B.financialHealth.attentionRunwayMonths) / 3) * 55;
  const burnScore =
    metrics.burnMultiple === null
      ? 50
      : metrics.burnMultiple <= 1
        ? 100
        : metrics.burnMultiple >= 3
          ? 0
          : ((3 - metrics.burnMultiple) / 2) * 100;
  const financialHealth = clamp(runwayScore * 0.65 + burnScore * 0.35);

  const scores: KPIScoreBreakdown = {
    growth: Math.round(growth),
    unitEconomics: Math.round(unitEconomics),
    retention: Math.round(retention),
    financialHealth: Math.round(financialHealth),
    overall: Math.round(
      (growth * KPI_WEIGHTS.growth +
        unitEconomics * KPI_WEIGHTS.unitEconomics +
        retention * KPI_WEIGHTS.retention +
        financialHealth * KPI_WEIGHTS.financialHealth) /
        100,
    ),
  };

  const categories: KPICategory[] = [
    {
      key: "growth",
      label: "Growth",
      score: scores.growth,
      weight: KPI_WEIGHTS.growth,
      status: statusFromScore(scores.growth),
      provisional: metrics.momGrowth === null,
    },
    {
      key: "financialHealth",
      label: "Financial Health",
      score: scores.financialHealth,
      weight: KPI_WEIGHTS.financialHealth,
      status: statusFromScore(scores.financialHealth),
      provisional: metrics.runway === null && metrics.burnMultiple === null,
    },
    {
      key: "unitEconomics",
      label: "Unit Economics",
      score: scores.unitEconomics,
      weight: KPI_WEIGHTS.unitEconomics,
      status: statusFromScore(scores.unitEconomics),
      provisional: metrics.ltvCac === null && metrics.cacPayback === null,
    },
    {
      key: "retention",
      label: "Retention",
      score: scores.retention,
      weight: KPI_WEIGHTS.retention,
      status: statusFromScore(scores.retention),
      provisional: nrr === null && churn === null,
    },
  ];

  /* ---- granular metric rows (reusable by other engines) -------------- */
  const st = (score: number, value: number | null): KPIStatus | null =>
    value === null ? null : statusFromScore(score);

  const rows: KPIMetricRow[] = [
    {
      key: "mrr",
      label: "MRR",
      category: "growth",
      source: "input",
      value: metrics.mrr,
      display: inr(metrics.mrr),
      status: null,
      note: "Monthly recurring revenue as entered.",
    },
    {
      key: "arr",
      label: "ARR",
      category: "growth",
      source: "derived",
      value: metrics.arr,
      display: inr(metrics.arr),
      status: null,
      note: "MRR × 12.",
    },
    {
      key: "momGrowth",
      label: "MoM growth",
      category: "growth",
      source: "derived",
      value: metrics.momGrowth,
      display: pct(metrics.momGrowth),
      status: st(growth, metrics.momGrowth),
      note: `Against a ${B.growth.strongMoM}% strong / ${B.growth.healthyMoM}% healthy reference.`,
    },
    {
      key: "runway",
      label: "Runway",
      category: "financialHealth",
      source: "derived",
      value: metrics.runway,
      display: months(metrics.runway),
      status: st(runwayScore, metrics.runway),
      note: `Cash ÷ monthly burn. Investors look for ${B.financialHealth.strongRunwayMonths}+ months.`,
    },
    {
      key: "burnMultiple",
      label: "Burn multiple",
      category: "financialHealth",
      source: "derived",
      value: metrics.burnMultiple,
      display: multiple(metrics.burnMultiple),
      status: st(burnScore, metrics.burnMultiple),
      note: "Burn ÷ net new MRR. Below 1x is efficient growth.",
    },
    {
      key: "arpc",
      label: "Revenue per customer",
      category: "unitEconomics",
      source: input.averageRevenuePerCustomer !== undefined ? "input" : "derived",
      value: metrics.arpc,
      display: inr(metrics.arpc),
      status: null,
      note:
        input.averageRevenuePerCustomer !== undefined
          ? "As entered."
          : "MRR ÷ total customers.",
    },
    {
      key: "cac",
      label: "CAC",
      category: "unitEconomics",
      source: "input",
      value: input.cac ?? null,
      display: inr(input.cac ?? null),
      status: null,
      note: "Customer acquisition cost as entered.",
    },
    {
      key: "ltv",
      label: "LTV",
      category: "unitEconomics",
      source: "derived",
      value: metrics.ltv,
      display: inr(metrics.ltv),
      status: null,
      note: "Revenue per customer × gross margin ÷ monthly churn.",
    },
    {
      key: "ltvCac",
      label: "LTV / CAC",
      category: "unitEconomics",
      source: "derived",
      value: metrics.ltvCac,
      display: multiple(metrics.ltvCac),
      status: st(ltvCacScore, metrics.ltvCac),
      note: `${B.unitEconomics.acceptableLtvCac}x is acceptable, ${B.unitEconomics.strongLtvCac}x is strong.`,
    },
    {
      key: "cacPayback",
      label: "CAC payback",
      category: "unitEconomics",
      source: "derived",
      value: metrics.cacPayback,
      display: months(metrics.cacPayback),
      status: st(paybackScore, metrics.cacPayback),
      note: `Under ${B.unitEconomics.strongPaybackMonths} months is strong.`,
    },
    {
      key: "churn",
      label: "Monthly churn",
      category: "retention",
      source: "input",
      value: churn,
      display: pct(churn),
      status: st(churnScore, churn),
      note: `Under ${B.retention.strongMonthlyChurn}% is strong.`,
    },
    {
      key: "nrr",
      label: "NRR",
      category: "retention",
      source: "input",
      value: nrr,
      display: pct(nrr, 0),
      status: st(nrrScore, nrr),
      note: `${B.retention.healthyNrr}% is healthy, ${B.retention.strongNrr}%+ is strong.`,
    },
    {
      key: "customers",
      label: "Total customers",
      category: "unitEconomics",
      source: "input",
      value: input.totalCustomers ?? null,
      display: count(input.totalCustomers ?? null),
      status: null,
      note: "Used to derive revenue per customer when ARPC is not entered.",
    },
    {
      key: "grossMargin",
      label: "Gross margin",
      category: "unitEconomics",
      source: "input",
      value: input.grossMargin ?? null,
      display: pct(input.grossMargin ?? null, 0),
      status: null,
      note: "Used in the LTV and CAC payback formulas.",
    },
    {
      key: "cashBalance",
      label: "Cash available",
      category: "financialHealth",
      source: "input",
      value: input.cashBalance ?? null,
      display: inr(input.cashBalance ?? null),
      status: null,
      note: "Cash in bank as entered.",
    },
    {
      key: "monthlyBurn",
      label: "Monthly burn",
      category: "financialHealth",
      source: "input",
      value: input.monthlyBurn ?? null,
      display: inr(input.monthlyBurn ?? null),
      status: null,
      note: "Net monthly cash burn as entered.",
    },
  ];

  /* ---- narrative, all from the same numbers -------------------------- */
  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (growth >= 75 && metrics.momGrowth !== null)
    strengths.push(`Strong month-over-month growth at ${pct(metrics.momGrowth)}.`);
  if (unitEconomics >= 75 && metrics.ltvCac !== null)
    strengths.push(`Healthy unit economics — LTV/CAC of ${multiple(metrics.ltvCac)}.`);
  if (retention >= 75)
    strengths.push(
      `Good retention${nrr !== null ? ` — NRR at ${pct(nrr, 0)}` : churn !== null ? ` — churn at ${pct(churn)}` : ""}.`,
    );
  if (financialHealth >= 75 && metrics.runway !== null)
    strengths.push(`Healthy financial position with ${months(metrics.runway)} of runway.`);

  if (metrics.runway !== null && metrics.runway < B.financialHealth.strongRunwayMonths) {
    risks.push(`Runway of ${months(metrics.runway)} is below the recommended 12 months.`);
    recommendations.push(
      "Consider reducing monthly burn or extending your runway before beginning a larger raise.",
    );
  }
  if (metrics.burnMultiple !== null && metrics.burnMultiple > 2) {
    risks.push(`Burn multiple of ${multiple(metrics.burnMultiple)} means growth is expensive.`);
    recommendations.push("Tighten spend per rupee of new revenue to improve burn efficiency.");
  }
  if (metrics.ltvCac !== null && metrics.ltvCac < B.unitEconomics.acceptableLtvCac) {
    risks.push(`LTV/CAC of ${multiple(metrics.ltvCac)} is below the 3x benchmark.`);
    recommendations.push("Review acquisition channels and CAC payback before scaling spend.");
  }
  if (metrics.cacPayback !== null && metrics.cacPayback > B.unitEconomics.weakPaybackMonths) {
    risks.push(`CAC payback of ${months(metrics.cacPayback)} ties up cash for too long.`);
    recommendations.push("Shorten CAC payback through pricing, onboarding speed or channel mix.");
  }
  if (churn !== null && churn > B.retention.strongMonthlyChurn) {
    risks.push(`Monthly churn of ${pct(churn)} is above the 5% comfort level.`);
    recommendations.push(
      "Prioritize retention and cohort analysis before aggressively increasing acquisition.",
    );
  }
  if (nrr !== null && nrr < B.retention.healthyNrr) {
    risks.push(`NRR of ${pct(nrr, 0)} means the existing base is contracting.`);
    recommendations.push("Build an expansion motion so net revenue retention clears 100%.");
  }
  if (input.grossMargin !== undefined && input.grossMargin < 50) {
    risks.push(`Gross margin of ${pct(input.grossMargin, 0)} limits how far each rupee goes.`);
    recommendations.push("Review pricing and delivery costs to improve gross margin.");
  }
  if (metrics.momGrowth !== null && metrics.momGrowth < B.growth.healthyMoM) {
    risks.push(`MoM growth of ${pct(metrics.momGrowth)} is below the 5% healthy reference.`);
    recommendations.push("Improve monthly revenue growth before increasing burn.");
  }

  if (growth >= 75 && retention >= 75)
    recommendations.push(
      "Your current traction profile may support a stronger fundraising narrative.",
    );

  const coverage = coverageOf(input);
  if (coverage.missing.length)
    recommendations.push(
      `Complete your KPI profile (${coverage.missing.join(", ")}) to improve evaluation accuracy.`,
    );

  if (!strengths.length)
    strengths.push(
      coverage.provided === 0
        ? `No KPI data provided yet — strengths appear once metrics are entered.`
        : "No standout strengths from the metrics provided yet.",
    );
  if (!risks.length) risks.push("No major KPI risks detected from the available data.");
  if (!recommendations.length)
    recommendations.push("Maintain current performance and keep KPI data updated monthly.");

  return {
    input,
    metrics,
    scores,
    categories,
    rows,
    status: statusFromScore(scores.overall),
    provisional: coverage.missing.length > 0,
    coverage,
    strengths,
    risks,
    recommendations,
  };
}

export { NOT_PROVIDED };
