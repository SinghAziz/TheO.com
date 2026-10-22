import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { AppShell, Meter } from "@/components/AppShell";
import { scoreKPIProfile, STATUS_LABEL, type KPICategoryKey, type KPIStatus } from "@/lib/kpi";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/kpi")({
  head: () => ({
    meta: [
      { title: "Startup KPI evaluation against Indian seed benchmarks | O" },
      {
        name: "description",
        content:
          "Score growth, unit economics, retention and financial health from your own KPI data, with every derived metric shown transparently.",
      },
      { property: "og:title", content: "Startup KPI evaluation | O" },
      {
        property: "og:description",
        content: "Your O Score, calculated from the KPI data you entered — no guesswork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kpi,
});

const TONE: Record<KPIStatus, string> = {
  strong: "text-positive",
  healthy: "text-positive",
  attention: "text-warning",
  critical: "text-destructive",
};

const CATEGORY_ORDER: KPICategoryKey[] = [
  "growth",
  "financialHealth",
  "unitEconomics",
  "retention",
];

function Kpi() {
  const { state } = useApp();
  const kpi = useMemo(() => scoreKPIProfile(state.kpi), [state.kpi]);
  const radar = kpi.categories.map((c) => ({ metric: c.label, score: c.score }));
  const hasAnyData = kpi.coverage.provided > 0;

  return (
    <AppShell
      eyebrow="Startup KPI Evaluation"
      title="What an investor sees first"
      lede="Four weighted categories scored from the KPI data you entered. Every derived metric below is calculated by O — nothing is assumed."
      action={
        <div className="panel p-5">
          <p className="label-eyebrow text-muted-foreground">
            O Score {kpi.provisional ? "· provisional" : ""}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-display text-6xl leading-none">{kpi.scores.overall}</p>
            <span className={`label-eyebrow mb-2 ${TONE[kpi.status]}`}>
              {STATUS_LABEL[kpi.status]}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            KPI data coverage {kpi.coverage.percent}% ({kpi.coverage.provided}/{kpi.coverage.total})
          </p>
          <div className="mt-2">
            <Meter value={kpi.coverage.percent} />
          </div>
          <Link to="/profile" className="label-eyebrow mt-4 inline-block text-primary">
            Edit KPI data
          </Link>
        </div>
      }
    >
      {!hasAnyData && (
        <div className="panel mb-10 p-6">
          <h2 className="text-xl">No KPI data yet</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Categories without data score neutrally rather than zero, so this evaluation is
            indicative until you add your numbers.
          </p>
          <Link to="/profile" className="label-eyebrow mt-4 inline-block text-primary">
            Add KPI data
          </Link>
        </div>
      )}

      {kpi.provisional && hasAnyData && (
        <p className="mb-10 border border-warning/40 bg-warning/5 p-4 text-xs leading-relaxed text-muted-foreground">
          <span className="text-warning">Provisional score.</span> Missing:{" "}
          {kpi.coverage.missing.join(", ")}. Missing categories are scored neutrally, not zero.
        </p>
      )}

      <div className="grid gap-px bg-border lg:grid-cols-3">
        <div className="bg-background p-6 lg:p-8">
          <h2 className="text-2xl">Category scores</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {state.startup.name || "Your startup"} — {state.startup.sector}, {state.startup.stage},{" "}
            {state.startup.state}.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.16}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-4">
            {kpi.categories.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="label-eyebrow text-muted-foreground">
                    {c.score}/100 · weight {c.weight}%
                  </p>
                </div>
                <div className="mt-2">
                  <Meter value={c.score} />
                </div>
                <p className={`mt-1.5 text-xs ${c.provisional ? "text-muted-foreground" : TONE[c.status]}`}>
                  {c.provisional ? "No data — scored neutrally" : STATUS_LABEL[c.status]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background p-6 lg:col-span-2 lg:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">Every metric, and where it comes from</h2>
            <span className="label-eyebrow text-muted-foreground">Entered vs calculated</span>
          </div>

          <div className="mt-8 space-y-10">
            {CATEGORY_ORDER.map((key) => {
              const category = kpi.categories.find((c) => c.key === key)!;
              const rows = kpi.rows.filter((r) => r.category === key);
              return (
                <div key={key}>
                  <p className="label-eyebrow text-muted-foreground">{category.label}</p>
                  <div className="mt-4 grid gap-px bg-border sm:grid-cols-2">
                    {rows.map((r) => (
                      <div key={r.key} className="bg-background p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium">{r.label}</p>
                          <span className="label-eyebrow text-muted-foreground">
                            {r.source === "derived" ? "Calculated by O" : "You entered"}
                          </span>
                        </div>
                        <p className="mt-2 font-display text-2xl leading-none">{r.display}</p>
                        {r.status && (
                          <p className={`label-eyebrow mt-1.5 ${TONE[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </p>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-px bg-border md:grid-cols-2">
        <div className="bg-background p-6 lg:p-8">
          <p className="label-eyebrow text-muted-foreground">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {kpi.strengths.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="bg-background p-6 lg:p-8">
          <p className="label-eyebrow text-muted-foreground">Risks</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {kpi.risks.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Recommended actions</h2>
        <div className="mt-6 grid gap-px bg-border md:grid-cols-3">
          {kpi.recommendations.map((a) => (
            <div key={a} className="bg-background p-6">
              <p className="text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
