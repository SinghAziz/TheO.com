import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { scoreKPIProfile, type KPIInput } from "@/lib/kpi";

import {
  BUSINESS_MODELS,
  CITIES,
  CITY_STATE,
  SECTORS,
  STAGES,
  STATES,
  type Sector,
  type Stage,
} from "@/lib/data";
import { rankInvestors } from "@/lib/investorMatching";
import { rankSchemes } from "@/lib/schemeMatching";
import { inrShort } from "@/lib/matchUtils";
import type { BusinessModel } from "@/lib/matching-types";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Startup profile — the inputs behind every match | O" },
      {
        name: "description",
        content:
          "Edit sector, stage, state, DPIIT status, ARR, growth and raise target. Investor and government scheme matching recalculates instantly.",
      },
      { property: "og:title", content: "Startup profile | O" },
      {
        property: "og:description",
        content: "Change your startup profile and watch investor and scheme rankings update.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

/** Founder-entered KPI inputs only — nothing derived is editable. */
const KPI_GROUPS: {
  label: string;
  fields: { key: keyof KPIInput; label: string; unit?: string; step?: number }[];
}[] = [
  {
    label: "Growth",
    fields: [
      { key: "monthlyRevenue", label: "MRR", unit: "₹", step: 1000 },
      { key: "previousMonthRevenue", label: "Previous month MRR", unit: "₹", step: 1000 },
    ],
  },
  {
    label: "Financial health",
    fields: [
      { key: "cashBalance", label: "Cash available", unit: "₹", step: 10000 },
      { key: "monthlyBurn", label: "Monthly burn", unit: "₹", step: 10000 },
    ],
  },
  {
    label: "Unit economics",
    fields: [
      { key: "totalCustomers", label: "Total customers", step: 1 },
      { key: "cac", label: "CAC", unit: "₹", step: 500 },
      { key: "averageRevenuePerCustomer", label: "Revenue per customer", unit: "₹", step: 500 },
      { key: "grossMargin", label: "Gross margin", unit: "%", step: 1 },
    ],
  },
  {
    label: "Retention",
    fields: [
      { key: "monthlyChurn", label: "Monthly churn", unit: "%", step: 0.1 },
      { key: "nrr", label: "Net revenue retention", unit: "%", step: 1 },
    ],
  },
];

function Profile() {
  const { state, set, setKpi, kpiSaving } = useApp();
  const s = state.startup;
  const patch = (p: Partial<typeof s>) => set({ startup: { ...s, ...p } });
  const kpi = useMemo(() => scoreKPIProfile(state.kpi), [state.kpi]);


  const topInvestors = rankInvestors(s).slice(0, 3);
  const topSchemes = rankSchemes(s)
    .filter((r) => r.blockers.length === 0)
    .slice(0, 3);

  return (
    <AppShell
      eyebrow="Startup profile"
      title="The inputs behind every match"
      lede="Everything on the Investors and Government Schemes pages is scored from this profile. Change anything here and the rankings recalculate immediately."
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <Field label="Startup name">
            <input
              value={s.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="w-full border-b border-input bg-transparent pb-2 text-base outline-none focus:border-primary"
            />
          </Field>
          <Field label="One-liner">
            <textarea
              value={s.oneLiner}
              onChange={(e) => patch({ oneLiner: e.target.value })}
              rows={2}
              className="w-full resize-none border-b border-input bg-transparent pb-2 text-base outline-none focus:border-primary"
            />
          </Field>

          <Field label="Primary sector">
            <Chips
              options={SECTORS as readonly string[]}
              value={s.sector}
              onPick={(v) => patch({ sector: v as Sector })}
            />
          </Field>
          <Field label="Funding stage">
            <Chips
              options={STAGES as readonly string[]}
              value={s.stage}
              onPick={(v) => patch({ stage: v as Stage })}
            />
          </Field>
          <Field label="Business model">
            <Chips
              options={BUSINESS_MODELS as readonly string[]}
              value={s.businessModel}
              onPick={(v) => patch({ businessModel: v as BusinessModel })}
            />
          </Field>
          <Field label="Registered city">
            <Chips
              options={CITIES as readonly string[]}
              value={s.city}
              onPick={(v) => patch({ city: v, state: CITY_STATE[v] ?? s.state })}
            />
          </Field>
          <Field label="Registered state">
            <Chips options={STATES as readonly string[]} value={s.state} onPick={(v) => patch({ state: v })} />
          </Field>
          <Field label="DPIIT recognition">
            <div className="flex gap-2">
              <Chip label="Recognised" active={s.dpiit} onClick={() => patch({ dpiit: true })} />
              <Chip label="Not yet" active={!s.dpiit} onClick={() => patch({ dpiit: false })} />
            </div>
          </Field>

          <Field label={`Team size — ${s.team} people`}>
            <input
              type="range"
              min={1}
              max={60}
              value={s.team}
              onChange={(e) => patch({ team: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Field>
          <Field label={`Current ARR — ${inrShort(s.arr)}`}>
            <input
              type="range"
              min={0}
              max={50000000}
              step={100000}
              value={s.arr}
              onChange={(e) => patch({ arr: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Field>
          <Field label={`Raise target — ${inrShort(s.raising)}`}>
            <input
              type="range"
              min={2500000}
              max={250000000}
              step={2500000}
              value={s.raising}
              onChange={(e) => patch({ raising: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Field>
          <Field label={`Monthly revenue growth — ${s.monthlyGrowth}% MoM`}>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={s.monthlyGrowth}
              onChange={(e) => patch({ monthlyGrowth: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Field>

          <section className="border-t border-border pt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl">KPI profile</h2>
              <p className="text-xs text-muted-foreground">
                {kpiSaving ? "Saving…" : `${kpi.coverage.percent}% complete`}
              </p>
            </div>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Enter only raw numbers. O calculates ARR, MoM growth, runway, burn multiple, LTV,
              LTV/CAC and CAC payback from them. Leave a field blank if you do not have it — blank
              is treated as “not provided”, never as zero.
            </p>

            {KPI_GROUPS.map((group) => (
              <div key={group.label} className="mt-8">
                <p className="label-eyebrow mb-4 text-muted-foreground">{group.label}</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {group.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-sm text-muted-foreground">
                        {f.label}
                        {f.unit ? ` (${f.unit})` : ""}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={f.step}
                        value={state.kpi[f.key] ?? ""}
                        placeholder="Not provided"
                        onChange={(e) => {
                          const raw = e.target.value;
                          setKpi({ [f.key]: raw === "" ? undefined : Number(raw) });
                        }}
                        className="mt-2 w-full border-b border-input bg-transparent pb-2 text-base outline-none focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="panel mt-8 p-6">
              <p className="label-eyebrow text-muted-foreground">Calculated by O</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {kpi.rows
                  .filter((r) => r.source === "derived")
                  .map((r) => (
                    <div key={r.key} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <span className="font-display text-lg">{r.display}</span>
                    </div>
                  ))}
              </div>
              <Link to="/kpi" className="label-eyebrow mt-6 inline-block text-primary">
                Open full evaluation
              </Link>
            </div>
          </section>
        </div>


        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-6">
            <p className="label-eyebrow text-muted-foreground">Live investor matches</p>
            <ul className="mt-4 space-y-3">
              {topInvestors.map((r) => (
                <li key={r.investor.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">{r.investor.name}</span>
                  <span className="font-display text-xl text-primary">{r.score}%</span>
                </li>
              ))}
            </ul>
            <Link to="/investors" className="label-eyebrow mt-5 inline-block text-primary">
              Open investors
            </Link>
          </div>

          <div className="panel p-6">
            <p className="label-eyebrow text-muted-foreground">Live scheme matches</p>
            <ul className="mt-4 space-y-3">
              {topSchemes.map((r) => (
                <li key={r.scheme.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">{r.scheme.name}</span>
                  <span className="font-display text-xl text-primary">{r.score}%</span>
                </li>
              ))}
            </ul>
            <Link to="/schemes" className="label-eyebrow mt-5 inline-block text-primary">
              Open government schemes
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-eyebrow mb-4 text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Chips({
  options,
  value,
  onPick,
}: {
  options: readonly string[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} active={value === o} onClick={() => onPick(o)} />
      ))}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-2 text-sm transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"
      }`}
    >
      {label}
    </button>
  );
}
