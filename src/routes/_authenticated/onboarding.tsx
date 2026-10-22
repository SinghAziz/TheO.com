import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/AppShell";
import { BUSINESS_MODELS, CITIES, CITY_STATE, SECTORS, STAGES, STATES, type Sector, type Stage } from "@/lib/data";
import type { BusinessModel } from "@/lib/matching-types";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Startup onboarding — tell O about your company" },
      {
        name: "description",
        content:
          "Capture sector, stage, city, team size, ARR and raise target so O can match investors and government schemes.",
      },
      { property: "og:title", content: "Startup onboarding — tell O about your company" },
      {
        property: "og:description",
        content: "Three quick steps to set up investor and scheme matching for your startup.",
      },
    ],
  }),
  component: Onboarding,
});

const crore = (v: number) => `₹${(v / 10000000).toFixed(2)} Cr`;
const lakh = (v: number) => `₹${(v / 100000).toFixed(1)} L`;

function Onboarding() {
  const { state, set, saveStartup, saving, hasStartup, initialized } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const s = state.startup;
  const patch = (p: Partial<typeof s>) => set({ startup: { ...s, ...p } });

  /* Returning founders already have a startup profile — never re-onboard them. */
  useEffect(() => {
    if (initialized && hasStartup) navigate({ to: "/dashboard", replace: true });
  }, [initialized, hasStartup, navigate]);


  const finish = async () => {
    try {
      await saveStartup();
      toast.success("Startup profile saved");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Could not save your startup profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Wordmark />
          <span className="label-eyebrow text-muted-foreground">Step 3 of 3</span>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-14 md:px-8 md:py-20">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 ${i <= step ? "bg-primary" : "bg-sand"}`}
            />
          ))}
        </div>

        <p className="label-eyebrow mt-8 text-primary">
          Onboarding · {step + 1} / 3
        </p>

        {step === 0 && (
          <section className="mt-4">
            <h1 className="display-lg">The basics</h1>
            <div className="mt-10 space-y-8">
              <Field label="Startup name">
                <input
                  value={s.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="w-full border-b border-input bg-transparent pb-2 font-display text-3xl outline-none focus:border-primary"
                />
              </Field>
              <Field label="One-line description">
                <textarea
                  value={s.oneLiner}
                  onChange={(e) => patch({ oneLiner: e.target.value })}
                  rows={2}
                  className="w-full resize-none border-b border-input bg-transparent pb-2 text-base outline-none focus:border-primary"
                />
              </Field>
              <Field label="Registered city">
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <Chip
                      key={c}
                      active={s.city === c}
                      onClick={() => patch({ city: c, state: CITY_STATE[c] ?? s.state })}
                      label={c}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Registered state">
                <div className="flex flex-wrap gap-2">
                  {STATES.map((c) => (
                    <Chip
                      key={c}
                      active={s.state === c}
                      onClick={() => patch({ state: c })}
                      label={c}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="mt-4">
            <h1 className="display-lg">Sector & stage</h1>
            <div className="mt-10 space-y-8">
              <Field label="Primary sector">
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((c) => (
                    <Chip
                      key={c}
                      active={s.sector === c}
                      onClick={() => patch({ sector: c as Sector })}
                      label={c}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Business model">
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_MODELS.map((c) => (
                    <Chip
                      key={c}
                      active={s.businessModel === c}
                      onClick={() => patch({ businessModel: c as BusinessModel })}
                      label={c}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Funding stage">
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((c) => (
                    <Chip
                      key={c}
                      active={s.stage === c}
                      onClick={() => patch({ stage: c as Stage })}
                      label={c}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Team size">
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={s.team}
                    onChange={(e) => patch({ team: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-display text-3xl">{s.team}</span>
                </div>
              </Field>
              <Field label="DPIIT recognition">
                <div className="flex gap-2">
                  <Chip
                    active={s.dpiit}
                    onClick={() => patch({ dpiit: true })}
                    label="Recognised"
                  />
                  <Chip
                    active={!s.dpiit}
                    onClick={() => patch({ dpiit: false })}
                    label="Not yet"
                  />
                </div>
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-4">
            <h1 className="display-lg">Money</h1>
            <div className="mt-10 space-y-10">
              <Field label={`Current ARR — ${lakh(s.arr)}`}>
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
              <Field label={`Raise target — ${crore(s.raising)}`}>
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
              <Field label="DPIIT recognition">
                <div className="flex flex-wrap gap-2">
                  <Chip active={s.dpiit} onClick={() => patch({ dpiit: true })} label="Recognised" />
                  <Chip active={!s.dpiit} onClick={() => patch({ dpiit: false })} label="Not yet" />
                </div>
              </Field>
              <div className="panel p-6">
                <p className="label-eyebrow text-muted-foreground">Profile summary</p>
                <p className="mt-4 text-sm leading-relaxed">
                  <strong>{s.name}</strong> — {s.oneLiner}. A {s.stage.toLowerCase()} stage{" "}
                  {s.sector} {s.businessModel} company in {s.city}, {s.state} with {s.team} people,
                  {" "}{lakh(s.arr)} ARR growing {s.monthlyGrowth}% MoM, raising {crore(s.raising)}.{" "}
                  {s.dpiit ? "DPIIT recognised." : "DPIIT recognition pending."}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="rule-line mt-12 flex items-center justify-between pt-6">
          <button
            onClick={() => setStep((v) => Math.max(0, v - 1))}
            disabled={step === 0}
            className="label-eyebrow inline-flex items-center gap-2 text-muted-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((v) => v + 1)}
              className="label-eyebrow inline-flex items-center gap-3 bg-ink px-6 py-4 text-background transition-opacity hover:opacity-85"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => void finish()}
              disabled={saving}
              className="label-eyebrow inline-flex items-center gap-3 bg-primary px-6 py-4 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving" : "Build my dashboard"}
            </button>
          )}
        </div>
      </main>
    </div>
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

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-foreground"
      }`}
    >
      {label}
    </button>
  );
}
