import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Check, Search, Send, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Meter } from "@/components/AppShell";
import { SECTORS, STAGES, STATES } from "@/lib/data";
import { rankInvestors } from "@/lib/investorMatching";
import { inrShort } from "@/lib/matchUtils";
import type { InvestorMatchResult, MatchReason } from "@/lib/matching-types";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/investors")({
  head: () => ({
    meta: [
      { title: "Investor matching for Indian founders | O" },
      {
        name: "description",
        content:
          "Every investor scored against your startup's sector, stage, cheque size, geography, business model and traction — with the reasoning shown.",
      },
      { property: "og:title", content: "Investor matching | O" },
      {
        property: "og:description",
        content: "Rule-based investor match scores with a transparent breakdown of why each investor fits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Investors,
});

const CHEQUE_BANDS = [
  { id: "any", label: "Any cheque" },
  { id: "u1", label: "Under ₹1 Cr", max: 10000000 },
  { id: "1to5", label: "₹1–5 Cr", min: 10000000, max: 50000000 },
  { id: "5to20", label: "₹5–20 Cr", min: 50000000, max: 200000000 },
  { id: "20plus", label: "₹20 Cr+", min: 200000000 },
] as const;

const SCORE_FLOORS = [
  { id: "0", label: "All matches", min: 0 },
  { id: "50", label: "50+", min: 50 },
  { id: "70", label: "70+", min: 70 },
  { id: "85", label: "85+", min: 85 },
] as const;

const GROUPS = [
  { band: "Strong Match", title: "Recommended for you", note: "Score 85–100" },
  { band: "Good Match", title: "Good matches", note: "Score 70–84" },
  { band: "Potential Match", title: "Potential matches", note: "Score 50–69" },
  { band: "Low Match", title: "Low matches", note: "Below 50" },
] as const;

function Investors() {
  const { state, toggleSaved, requestIntro } = useApp();
  const s = state.startup;

  const [stage, setStage] = useState("All");
  const [sector, setSector] = useState("All");
  const [geo, setGeo] = useState("All");
  const [cheque, setCheque] = useState<string>("any");
  const [floor, setFloor] = useState<string>("0");
  const [q, setQ] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [open, setOpen] = useState<InvestorMatchResult | null>(null);

  const ranked = useMemo(() => rankInvestors(s), [s]);

  const results = useMemo(() => {
    const cb = CHEQUE_BANDS.find((c) => c.id === cheque);
    const min = SCORE_FLOORS.find((f) => f.id === floor)?.min ?? 0;
    const t = q.trim().toLowerCase();
    return ranked.filter(({ investor: i, score }) => {
      const p = i.preferences;
      if (stage !== "All" && !p.stages.includes(stage as never)) return false;
      if (sector !== "All" && p.sectors !== "Sector agnostic" && !p.sectors.includes(sector as never))
        return false;
      if (
        geo !== "All" &&
        !p.geographies.includes("Pan-India") &&
        !p.geographies.includes("Global") &&
        !p.geographies.includes(geo)
      )
        return false;
      if (cb && "min" in cb && cb.min !== undefined && p.maxCheque < cb.min) return false;
      if (cb && "max" in cb && cb.max !== undefined && p.minCheque > cb.max) return false;
      if (score < min) return false;
      if (onlySaved && !state.saved.includes(i.id)) return false;
      if (
        t &&
        !`${i.name} ${i.type} ${i.city} ${i.thesis} ${i.portfolioAreas.join(" ")}`
          .toLowerCase()
          .includes(t)
      )
        return false;
      return true;
    });
  }, [ranked, stage, sector, geo, cheque, floor, q, onlySaved, state.saved]);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: results.filter((r) => r.band === g.band),
  })).filter((g) => g.items.length > 0);

  return (
    <AppShell
      eyebrow="Founder ↔ Investor Matching"
      title="Investors scored against your profile"
      lede={`Every investor in O's index is scored on sector, stage, cheque size, geography, business model and traction for ${s.name} — a ${s.stage.toLowerCase()}-stage ${s.sector} company in ${s.city}, ${s.state} raising ${inrShort(s.raising)}.`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Sector" value={sector} onChange={setSector} options={["All", ...SECTORS]} />
        <Select label="Stage" value={stage} onChange={setStage} options={["All", ...STAGES]} />
        <Select label="Geography" value={geo} onChange={setGeo} options={["All", ...STATES]} />
        <Select
          label="Cheque"
          value={cheque}
          onChange={setCheque}
          options={CHEQUE_BANDS.map((c) => c.id)}
          labels={Object.fromEntries(CHEQUE_BANDS.map((c) => [c.id, c.label]))}
        />
        <Select
          label="Match"
          value={floor}
          onChange={setFloor}
          options={SCORE_FLOORS.map((c) => c.id)}
          labels={Object.fromEntries(SCORE_FLOORS.map((c) => [c.id, c.label]))}
        />
        <label className="flex items-center gap-2 border border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search investor or focus"
            className="w-44 bg-transparent text-sm outline-none"
          />
        </label>
        <button
          onClick={() => setOnlySaved((v) => !v)}
          className={`label-eyebrow border px-4 py-2.5 transition-colors ${
            onlySaved ? "border-primary bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          Saved only
        </button>
        <span className="label-eyebrow ml-auto text-muted-foreground">
          {results.length} of {ranked.length} scored
        </span>
      </div>

      {grouped.length === 0 && (
        <p className="mt-10 border border-border bg-sand p-8 text-sm text-muted-foreground">
          No investors match these filters. Try widening sector, stage or the match floor.
        </p>
      )}

      {grouped.map((g) => (
        <section key={g.band} className="mt-12">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 className="text-2xl">{g.title}</h2>
            <span className="label-eyebrow text-muted-foreground">
              {g.note} · {g.items.length}
            </span>
          </div>

          <div className="mt-px grid gap-px bg-border lg:grid-cols-2">
            {g.items.map((r) => (
              <Card
                key={r.investor.id}
                result={r}
                saved={state.saved.includes(r.investor.id)}
                requested={state.introRequests.some((x) => x.investorId === r.investor.id)}
                onOpen={() => setOpen(r)}
                onSave={() => {
                  toggleSaved(r.investor.id);
                  toast.success(
                    state.saved.includes(r.investor.id)
                      ? "Removed from shortlist"
                      : `${r.investor.name} saved to shortlist`,
                  );
                }}
                onIntro={() => {
                  requestIntro(r.investor.id, r.investor.name);
                  toast.success("Introduction request recorded.");
                }}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="mt-12 border-l-2 border-border pl-4 text-xs leading-relaxed text-muted-foreground">
        Investor preferences are compiled from publicly stated mandates and are indicative. O has no
        partnership or agreement with any investor listed here, and scores are a rule-based
        indication of fit — not an endorsement or a commitment from the investor.
      </p>

      {open && (
        <Detail
          result={open}
          requested={state.introRequests.some((x) => x.investorId === open.investor.id)}
          onClose={() => setOpen(null)}
          onIntro={() => {
            requestIntro(open.investor.id, open.investor.name);
            toast.success("Introduction request recorded.");
          }}
        />
      )}
    </AppShell>
  );
}

function Card({
  result: r,
  saved,
  requested,
  onOpen,
  onSave,
  onIntro,
}: {
  result: InvestorMatchResult;
  saved: boolean;
  requested: boolean;
  onOpen: () => void;
  onSave: () => void;
  onIntro: () => void;
}) {
  const i = r.investor;
  const p = i.preferences;
  const good = r.reasons.filter((x) => x.kind === "match").slice(0, 4);
  const risks = r.reasons.filter((x) => x.kind !== "match").slice(0, 2);

  return (
    <article className="bg-background p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow text-muted-foreground">{i.type}</p>
          <h3 className="mt-2 text-2xl">{i.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {i.city}, {i.state} · Cheque {inrShort(p.minCheque)}–{inrShort(p.maxCheque)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl leading-none text-primary">{r.score}%</p>
          <p className="label-eyebrow mt-1 text-muted-foreground">{r.band}</p>
        </div>
      </div>

      <div className="mt-5">
        <Meter value={r.score} />
      </div>

      <p className="label-eyebrow mt-6 text-muted-foreground">Why this investor matches</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {good.map((x) => (
          <ReasonLine key={x.label} reason={x} />
        ))}
      </ul>

      {risks.length > 0 && (
        <>
          <p className="label-eyebrow mt-5 text-muted-foreground">Potential mismatch</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {risks.map((x) => (
              <ReasonLine key={x.label} reason={x} />
            ))}
          </ul>
        </>
      )}

      <div className="rule-line mt-6 flex flex-wrap items-center gap-3 pt-5">
        <button
          onClick={onOpen}
          className="label-eyebrow bg-ink px-4 py-2.5 text-background transition-opacity hover:opacity-85"
        >
          View match detail
        </button>
        <button
          onClick={onSave}
          className="label-eyebrow inline-flex items-center gap-2 border border-border px-4 py-2.5"
        >
          {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={onIntro}
          disabled={requested}
          className="label-eyebrow inline-flex items-center gap-2 text-primary disabled:text-muted-foreground"
        >
          {requested ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {requested ? "Introduction requested" : "Request introduction"}
        </button>
      </div>
    </article>
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

function Detail({
  result: r,
  requested,
  onClose,
  onIntro,
}: {
  result: InvestorMatchResult;
  requested: boolean;
  onClose: () => void;
  onIntro: () => void;
}) {
  const i = r.investor;
  const p = i.preferences;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-paper p-7 md:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="label-eyebrow text-primary">{i.type}</p>
            <h2 className="mt-2 display-lg text-4xl">{i.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="rule-line mt-8 grid grid-cols-2 gap-6 pt-6 text-sm">
          <Row k="Location" v={`${i.city}, ${i.state}`} />
          <Row k="Typical cheque" v={`${inrShort(p.minCheque)}–${inrShort(p.maxCheque)}`} />
          <Row k="Stages" v={p.stages.join(", ")} />
          <Row
            k="Sectors"
            v={p.sectors === "Sector agnostic" ? "Sector agnostic" : p.sectors.join(", ")}
          />
          <Row k="Geography" v={p.geographies.join(", ")} />
          <Row k="Round role" v={p.leadPreference} />
        </dl>

        <div className="rule-line mt-6 pt-6">
          <p className="label-eyebrow text-muted-foreground">Investment thesis</p>
          <p className="mt-3 text-sm leading-relaxed">{i.thesis}</p>
        </div>

        <div className="rule-line mt-6 pt-6">
          <p className="label-eyebrow text-muted-foreground">Relevant portfolio areas</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {i.portfolioAreas.map((x) => (
              <span key={x} className="border border-border px-2.5 py-1 text-xs">
                {x}
              </span>
            ))}
          </div>
        </div>

        <div className="rule-line mt-6 pt-6">
          <div className="flex items-end justify-between">
            <p className="label-eyebrow text-muted-foreground">Your match</p>
            <p className="font-display text-5xl leading-none text-primary">{r.score}%</p>
          </div>
          <div className="mt-3">
            <Meter value={r.score} />
          </div>
          <ul className="mt-5 space-y-3">
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
        </div>

        <div className="rule-line mt-6 pt-6">
          <p className="label-eyebrow text-muted-foreground">Why O recommends this investor</p>
          <p className="mt-3 bg-sand p-4 text-sm leading-relaxed">{r.summary}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {r.reasons.map((x) => (
              <ReasonLine key={x.label} reason={x} />
            ))}
          </ul>
        </div>

        {i.notes.length > 0 && (
          <p className="mt-6 flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {i.notes.join(" · ")}
          </p>
        )}

        <button
          onClick={onIntro}
          disabled={requested}
          className="label-eyebrow mt-8 w-full bg-primary px-6 py-4 text-primary-foreground disabled:bg-sand disabled:text-muted-foreground"
        >
          {requested ? "Introduction request recorded" : "Request introduction"}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Your request is saved to your O account; no email is sent on your behalf.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="label-eyebrow text-muted-foreground">{k}</dt>
      <dd className="mt-1.5">{v}</dd>
    </div>
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
