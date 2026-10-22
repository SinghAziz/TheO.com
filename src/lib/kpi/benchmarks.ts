/** MVP benchmarks. Kept isolated so sector/stage tuning stays a data change. */
export const KPI_BENCHMARKS = {
  growth: { strongMoM: 10, healthyMoM: 5 },
  unitEconomics: {
    strongLtvCac: 4,
    acceptableLtvCac: 3,
    strongPaybackMonths: 12,
    weakPaybackMonths: 18,
  },
  retention: { strongNrr: 110, healthyNrr: 100, strongMonthlyChurn: 5, weakMonthlyChurn: 8 },
  financialHealth: { strongRunwayMonths: 12, attentionRunwayMonths: 9 },
} as const;

/** Category weights for the overall O Score (sum = 100). */
export const KPI_WEIGHTS = {
  growth: 25,
  unitEconomics: 30,
  retention: 20,
  financialHealth: 25,
} as const;
