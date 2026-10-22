import type { KPIInput, KPIMetrics } from "./types";

/**
 * Derived KPI metrics — the ONLY place these formulas live.
 *
 *   ARR            = MRR × 12
 *   MoM growth %   = (MRR − previous MRR) / previous MRR × 100
 *   Runway (mo)    = cash available / monthly burn
 *   ARPC           = entered ARPC, else MRR / total customers
 *   LTV            = ARPC × (gross margin / 100) / (monthly churn / 100)
 *   LTV/CAC        = LTV / CAC
 *   CAC payback    = CAC / (ARPC × gross margin / 100)
 *   Burn multiple  = monthly burn / max(MRR − previous MRR, 0)
 *
 * Any input a formula needs that is missing yields `null` — never 0. Founders
 * never type these values; they are always calculated by O.
 */
export function calculateKPIMetrics(input: KPIInput): KPIMetrics {
  const num = (v: number | undefined) =>
    v === undefined || v === null || !Number.isFinite(v) ? null : v;

  const mrr = num(input.monthlyRevenue);
  const previousMrr = num(input.previousMonthRevenue);
  const cash = num(input.cashBalance);
  const burn = num(input.monthlyBurn);
  const customers = num(input.totalCustomers);
  const cac = num(input.cac);
  const grossMargin = num(input.grossMargin);
  const churn = num(input.monthlyChurn);

  const arr = mrr === null ? null : mrr * 12;

  const momGrowth =
    mrr === null || previousMrr === null
      ? null
      : previousMrr === 0
        ? mrr > 0
          ? 100
          : 0
        : ((mrr - previousMrr) / previousMrr) * 100;

  const runway = cash === null || burn === null || burn <= 0 ? null : cash / burn;

  const arpc =
    num(input.averageRevenuePerCustomer) ??
    (mrr !== null && customers !== null && customers > 0 ? mrr / customers : null);

  const ltv =
    arpc !== null && grossMargin !== null && churn !== null && churn > 0
      ? (arpc * (grossMargin / 100)) / (churn / 100)
      : null;

  const ltvCac = ltv !== null && cac !== null && cac > 0 ? ltv / cac : null;

  const grossProfitPerCustomer =
    arpc !== null && grossMargin !== null ? arpc * (grossMargin / 100) : null;

  const cacPayback =
    grossProfitPerCustomer !== null && grossProfitPerCustomer > 0 && cac !== null && cac >= 0
      ? cac / grossProfitPerCustomer
      : null;

  const burnMultiple =
    mrr !== null && previousMrr !== null && burn !== null && burn > 0
      ? burn / Math.max(mrr - previousMrr, 0)
      : null;

  return { mrr, arr, momGrowth, runway, arpc, ltv, ltvCac, cacPayback, burnMultiple };
}
