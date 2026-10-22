import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Meter } from "@/components/AppShell";
import { SCHEMES } from "@/data/schemes";
import { SECTORS, STAGES, STATES } from "@/lib/data";
import { inrShort } from "@/lib/matchUtils";
import type { MatchReason, SchemeMatchResult } from "@/lib/matching-types";
import { rankSchemes, scoreScheme } from "@/lib/schemeMatching";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Government scheme discovery & matching for startups | O" },
      {
        name: "description",
        content:
          "Browse central and state startup schemes with official sources, or switch to For You for a scored shortlist based on your sector, stage, state, DPIIT status and revenue.",
      },
      { property: "og:title", content: "Government scheme matching | O" },
      {
        property: "og:description",
        content: "Central and state startup schemes scored against your actual startup profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Schemes,
});

const FUNDING_TYPES = ["All", "Grant", "Equity", "Convertible Debt", "Loan", "Loan Guarantee", "Incubation"] as const;

const AMOUNTS = [
  { id: "any", label: "Any amount" },
  { id: "u10", label: "Up to ₹10 L", max: 1000000 },
  { id: "10to50", label: "₹10–50 L", min: 1000000, max: 5000000 },
  { id: "50to500", label: "₹50 L–5 Cr", min: 5000000, max: 50000000 },
  { id: "5cr", label: "₹5 Cr+", min: 50000000 },
] as const;

function Schemes() {
  const { state, markApplied } = useApp();
  const s = state.startup;

  const [tab, setTab] = useState<"all" | "you">("you");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [st, setSt] = useState("All");
  const [stage, setStage] = useState("All");
  const [type, setType] = useState<string>("All");
  const [amount, setAmount] = useState<string>("any");
  const [openId, setOpenId] = useState<string | null>(null);

  const ranked = useMemo(() => rankSchemes(s), [s]);

  const all = useMemo(
    () =>
      [...SCHEMES]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((scheme) => scoreScheme(s, scheme)),
    [s],
  );

  const list = useMemo(() => {
    const base = tab === "you" ? ranked : all;
    const ab = AMOUNTS.find((a) => a.id === amount);
    const t = q.trim().toLowerCase();
    return base.filter(({ scheme: x }) => {
      if (sector !== "All" && x.sectors !== "All" && !x.sectors.includes(sector as never)) return false;
      if (st !== "All" && !x.states.includes("All India") && !x.states.includes(st)) return false;
      if (stage !== "All" && !x.startup_stages.includes(stage as never)) return false;
      if (type !== "All" && x.funding_type !== type) return false;
      if (ab && "min" in ab && ab.min !== undefined && x.funding_amount_max < ab.min) return false;
      if (ab && "max" in ab && ab.max !== undefined && x.funding_amount_max > ab.max) return false;
      if (
        t &&
        !`${x.name} ${x.organization} ${x.description} ${x.funding_type}`.toLowerCase().includes(t)
      )
        return false;
      return true;
    });
  }, [tab, ranked, all, sector, st, stage, type, amount, q]);

  const eligibleCount = ranked.filter((r) => r.blockers.length === 0).length;

  return (
    <AppShell
      eyebrow="Government Scheme Discovery"
      title="Non-dilutive capital, matched to you"
      lede={`Central and state programmes with official sources. For You scores every scheme against ${s.name}'s sector, stage, state, DPIIT status, funding requirement and revenue.`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex border border-border">
          {(
            [
              ["you", "For you"],
              ["all", "All schemes"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`label-eyebrow px-5 py-3 transition-colors ${
                tab === k ? "bg-ink text-background" : "text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 border border-border px-3 py-2.5 md:w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scheme or ministry"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Select label="Sector" value={sector} onChange={setSector} options={["All", ...SECTORS]} />
        <Select label="State" value={st} onChange={setSt} options={["All", ...STATES]} />
        <Select label="Stage" value={stage} onChange={setStage} options={["All", ...STAGES]} />
        <Select label="Type" value={type} onChange={setType} options={FUNDING_TYPES} />
        <Select
          label="Amount"
          value={amount}
          onChange={setAmount}
          options={AMOUNTS.map((a) => a.id)}
          labels={Object.fromEntries(AMOUNTS.map((a) => [a.id, a.label]))}
        />
        <span className="label-eyebrow ml-auto text-muted-foreground">
          {list.length} of {SCHEMES.length} schemes
        </span>
      </div>

      {tab === "you" && (
        <p className="mt-6 border-l-2 border-primary bg-sand p-4 text-xs leading-relaxed text-muted-foreground">
          Scored for a {s.stage.toLowerCase()}-stage {s.sector} startup in {s.city}, {s.state}
          {s.dpiit ? " with DPIIT recognition" : " without DPIIT recognition"}, {inrShort(s.arr)} ARR,
          seeking {inrShort(s.raising)}. {eligibleCount} of {SCHEMES.length} schemes show no explicit
          blocker against your profile — O never confirms eligibility, only the issuing body can.
        </p>
      )}

      <div className="mt-10 divide-y divide-border border-y border-border">
        {list.map((r) => (
          <SchemeRow
            key={r.scheme.id}
            result={r}
            showScore={tab === "you"}
            open={openId === r.scheme.id}
            onToggle={() => setOpenId(openId === r.scheme.id ? null : r.scheme.id)}
            applied={state.applied.includes(r.scheme.id)}
            onApply={() => {
              markApplied(r.scheme.id);
              toast.success(`Marked ${r.scheme.name} as started`);
            }}
          />
        ))}
        {list.length === 0 && (
          <p className="py-10 text-sm text-muted-foreground">No schemes match these filters.</p>
        )}
      </div>

      <p className="mt-10 border-l-2 border-border pl-4 text-xs leading-relaxed text-muted-foreground">
        Scheme details are summarised from official government sources and were last verified on the
        date shown on each scheme. Guidelines, corpus and deadlines change — always confirm on the
        official page before applying.
      </p>
    </AppShell>
  );
}

function statusTone(status: SchemeMatchResult["status"]) {
  if (status === "Potential match") return "text-positive";
  if (status === "Needs verification") return "text-warning";
  if (status === "Low match") return "text-muted-foreground";
  return "text-destructive";
}

function SchemeRow({
  result: r,
  showScore,
  open,
  onToggle,
  applied,
  onApply,
}: {
  result: SchemeMatchResult;
  showScore: boolean;
  open: boolean;
  onToggle: () => void;
  applied: boolean;
  onApply: () => void;
}) {
  const x = r.scheme;
  const good = r.reasons.filter((z) => z.kind === "match");
  const bad = r.reasons.filter((z) => z.kind !== "match");

  return (
    <div className="py-6">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-6 text-left">
        <div>
          <p className="label-eyebrow text-muted-foreground">{x.organization}</p>
          <h2 className="mt-2 text-xl md:text-2xl">{x.name}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{x.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span className="font-medium text-primary">{x.funding_amount}</span>
            <span className="text-muted-foreground">{x.funding_type}</span>
            <span className="text-muted-foreground">
              {x.states.includes("All India") ? "All India" : x.states.join(", ")}
            </span>
            {applied && (
              <span className="inline-flex items-center gap-1 text-positive">
                <Check className="h-3 w-3" /> Application started
              </span>
            )}
          </div>
        </div>
        <div className="w-28 shrink-0 text-right">
          <p className="font-display text-3xl leading-none">{r.score}%</p>
          <p className={`label-eyebrow mt-1 ${showScore ? statusTone(r.status) : "text-muted-foreground"}`}>
            {showScore ? r.status : "Fit score"}
          </p>
          <div className="mt-3">
            <Meter value={r.score} />
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-6 grid gap-6 bg-sand p-6 lg:grid-cols-2">
          <div>
            <p className="label-eyebrow text-muted-foreground">
              {r.blockers.length > 0 ? "Why you are not eligible right now" : "Why this is recommended"}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(r.blockers.length > 0 ? bad.concat(good) : good).map((z) => (
                <ReasonLine key={z.label} reason={z} />
              ))}
            </ul>

            {r.blockers.length === 0 && bad.length > 0 && (
              <>
                <p className="label-eyebrow mt-5 text-muted-foreground">Watch out for</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {bad.map((z) => (
                    <ReasonLine key={z.label} reason={z} />
                  ))}
                </ul>
              </>
            )}

            <p className="label-eyebrow mt-5 text-muted-foreground">What you should check</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {r.verification.map((v) => (
                <ReasonLine key={v} reason={{ kind: "warn", label: v }} />
              ))}
              <ReasonLine
                reason={{
                  kind: "warn",
                  label: "Final eligibility depends on scheme-specific conditions and the current call guidelines.",
                }}
              />
            </ul>

            <p className="mt-5 text-sm leading-relaxed">{r.summary}</p>
          </div>

          <div>
            <p className="label-eyebrow text-muted-foreground">Match breakdown</p>
            <ul className="mt-3 space-y-2.5">
              {r.components.map((c) => (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="font-display">
                      {c.score}/{c.max}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter value={(c.score / c.max) * 100} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                </li>
              ))}
            </ul>

            <p className="label-eyebrow mt-6 text-muted-foreground">Eligibility as published</p>
            <ul className="mt-3 space-y-2 text-sm">
              {x.eligibility.map((e) => (
                <li key={e} className="flex gap-2">
                  <span className="text-primary">—</span>
                  <span className="text-muted-foreground">{e}</span>
                </li>
              ))}
            </ul>

            <p className="label-eyebrow mt-6 text-muted-foreground">How to apply</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {x.application_process}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href={x.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="label-eyebrow inline-flex items-center gap-2 text-primary"
              >
                Official page <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-xs text-muted-foreground">
                Last verified {x.last_verified}
              </span>
            </div>

            <button
              onClick={onApply}
              disabled={applied}
              className="label-eyebrow mt-6 bg-primary px-5 py-3 text-primary-foreground disabled:bg-background disabled:text-muted-foreground"
            >
              {applied ? "Marked as started" : "Mark as started"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReasonLine({ reason }: { reason: MatchReason }) {
  const mark = reason.kind === "match" ? "✓" : reason.kind === "warn" ? "⚠" : "✕";
  const tone =
    reason.kind === "match"
      ? "text-positive"
      : reason.kind === "warn"
        ? "text-warning"
        : "text-destructive";
  return (
    <li className="flex gap-2 leading-relaxed">
      <span className={`${tone} shrink-0`}>{mark}</span>
      <span className="text-muted-foreground">{reason.label}</span>
    </li>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="inline-flex items-center gap-2 border border-border px-3 py-2">
      <span className="label-eyebrow text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
