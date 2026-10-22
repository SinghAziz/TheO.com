import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, Meter, Stat } from "@/components/AppShell";
import { ACTIVITY, REVENUE_SERIES } from "@/lib/data";
import { scoreKPIProfile, STATUS_LABEL, type KPIStatus } from "@/lib/kpi";
import { rankInvestors } from "@/lib/investorMatching";
import { rankSchemes } from "@/lib/schemeMatching";
import { inrShort } from "@/lib/matchUtils";
import { useApp } from "@/lib/store";

const TONE: Record<KPIStatus, string> = {
  strong: "text-positive",
  healthy: "text-positive",
  attention: "text-warning",
  critical: "text-destructive",
};


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Founder dashboard — funding readiness at a glance | O" },
      {
        name: "description",
        content:
          "Track readiness score, runway, matched Indian investors and eligible government schemes from one founder dashboard.",
      },
      { property: "og:title", content: "Founder dashboard — funding readiness | O" },
      {
        property: "og:description",
        content: "Readiness score, runway, investor matches and scheme shortlist in one view.",
      },
    ],
  }),
  component: Dashboard,
});

/** Granular metrics surfaced on the dashboard summary. */
const KPI_HIGHLIGHTS = ["arr", "momGrowth", "runway", "ltvCac"] as const;

function Dashboard() {
  const { state } = useApp();
  const s = state.startup;
  const kpi = useMemo(() => scoreKPIProfile(state.kpi), [state.kpi]);
  const score = kpi.scores.overall;
  const runwayRow = kpi.rows.find((r) => r.key === "runway")!;
  const topInvestors = rankInvestors(s).slice(0, 3);
  const topSchemes = rankSchemes(s)
    .filter((r) => r.blockers.length === 0)
    .slice(0, 3);


  return (
    <AppShell
      eyebrow={`${s.sector} · ${s.stage} · ${s.city}, ${s.state}`}
      title={s.name}
      lede={s.oneLiner}
      action={
        <div className="panel p-5">
          <p className="label-eyebrow text-muted-foreground">
            O Score {kpi.provisional ? "· provisional" : ""}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-display text-6xl leading-none">{score}</p>
            <span className={`label-eyebrow mb-2 ${TONE[kpi.status]}`}>
              {STATUS_LABEL[kpi.status]}
            </span>
          </div>
          <div className="mt-4 w-56">
            <Meter value={score} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            From your KPI data · {kpi.coverage.percent}% complete
          </p>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-4">
        <Stat label="ARR" value={inrShort(s.arr)} sub={`+${s.monthlyGrowth}% MoM`} />
        <Stat label="Runway" value={runwayRow.display} sub="Target 12 months" />
        <Stat
          label="Raise target"
          value={`₹${(s.raising / 10000000).toFixed(1)} Cr`}
          sub={`${s.stage} round`}
        />
        <Stat label="Team" value={`${s.team}`} sub={s.dpiit ? "DPIIT recognised" : "DPIIT pending"} />
      </div>


      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/investors"
          className="label-eyebrow bg-primary px-5 py-3.5 text-primary-foreground transition-opacity hover:opacity-90"
        >
          Find investors
        </Link>
        <Link
          to="/schemes"
          className="label-eyebrow bg-ink px-5 py-3.5 text-background transition-opacity hover:opacity-85"
        >
          Explore government schemes
        </Link>
        <Link
          to="/kpi"
          className="label-eyebrow border border-border px-5 py-3.5 transition-colors hover:border-foreground"
        >
          View evaluation
        </Link>
        <Link
          to="/profile"
          className="label-eyebrow border border-border px-5 py-3.5 transition-colors hover:border-foreground"
        >
          Edit startup profile
        </Link>
      </div>

      <div className="mt-14 grid gap-px bg-border lg:grid-cols-3">
        <div className="bg-background p-6 lg:col-span-2 lg:p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">MRR vs burn</h2>
            <span className="label-eyebrow text-muted-foreground">₹ lakh / month</span>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_SERIES}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--paper)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                  formatter={(v: number, n) => [`₹${v} L`, n === "mrr" ? "MRR" : "Burn"]}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="burn" stroke="var(--ink)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-background p-6 lg:p-8">
          <h2 className="text-2xl">Recent activity</h2>
          <ul className="mt-6 space-y-5">
            {ACTIVITY.map((a) => (
              <li key={a.text} className="rule-line pt-4 first:border-0 first:pt-0">
                <p className="label-eyebrow text-primary">{a.tag}</p>
                <p className="mt-1.5 text-sm leading-snug">{a.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.when}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <Header title="Top investor matches" to="/investors" cta="All investors" />
          <div className="mt-6 divide-y divide-border border-y border-border">
            {topInvestors.map(({ investor: i, score, band }) => (
              <Link
                key={i.id}
                to="/investors"
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-sand"
              >
                <div>
                  <p className="text-base font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.type} · {i.city} · {inrShort(i.preferences.minCheque)}–
                    {inrShort(i.preferences.maxCheque)} · {band}
                  </p>
                </div>
                <span className="font-display text-2xl text-primary">{score}%</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <Header title="Schemes you may qualify for" to="/schemes" cta="All schemes" />
          <div className="mt-6 divide-y divide-border border-y border-border">
            {topSchemes.map(({ scheme: i, score, status }) => (
              <Link
                key={i.id}
                to="/schemes"
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-sand"
              >
                <div>
                  <p className="text-base font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.funding_amount} · {status}
                  </p>
                </div>
                <span className="font-display text-2xl text-primary">{score}%</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-14">
        <Header
          title={kpi.provisional ? "Your KPI evaluation (provisional)" : "Your KPI evaluation"}
          to="/kpi"
          cta="Open evaluation"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          KPI data coverage {kpi.coverage.percent}%
          {kpi.coverage.missing.length ? ` · missing ${kpi.coverage.missing.join(", ")}` : ""}
        </p>
        <div className="mt-6 grid gap-px bg-border md:grid-cols-4">
          {kpi.categories.map((c) => (
            <div key={c.key} className="bg-background p-6">
              <p className="label-eyebrow text-muted-foreground">{c.label}</p>
              <p className="mt-3 font-display text-3xl">{c.score}</p>
              <div className="mt-3">
                <Meter value={c.score} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.provisional ? "No data — scored neutrally" : STATUS_LABEL[c.status]} · weight{" "}
                {c.weight}%
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-px bg-border md:grid-cols-4">
          {KPI_HIGHLIGHTS.map((key) => {
            const row = kpi.rows.find((r) => r.key === key)!;
            return (
              <div key={key} className="bg-background p-6">
                <p className="label-eyebrow text-muted-foreground">{row.label}</p>
                <p className="mt-3 font-display text-2xl">{row.display}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {row.source === "derived" ? "Calculated by O" : "You entered"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

    </AppShell>
  );
}

function Header({
  title,
  to,
  cta,
}: {
  title: string;
  to: "/investors" | "/schemes" | "/kpi";
  cta: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl">{title}</h2>
      <Link to={to} className="label-eyebrow inline-flex items-center gap-1.5 text-primary">
        {cta} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
