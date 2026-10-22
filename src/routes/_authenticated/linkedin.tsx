import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Loader2, Linkedin, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/AppShell";
import { LINKEDIN_PROFILE } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/linkedin")({
  head: () => ({
    meta: [
      { title: "Connect your professional profile | O" },
      {
        name: "description",
        content:
          "Connect your professional profile so O can map network signals to introduction paths with Indian investors.",
      },
      { property: "og:title", content: "Connect your professional profile | O" },
      {
        property: "og:description",
        content: "Connect your professional profile to surface introduction paths to investors.",
      },
    ],
  }),
  component: LinkedInConnect,
});

const STEPS = [
  "Requesting profile permissions",
  "Reading headline, roles and education",
  "Mapping 3,214 connections to investor graph",
  "Scoring warm introduction paths",
];

function LinkedInConnect() {
  const { state, setLinkedinConnected } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "running" | "done">(
    state.linkedinConnected ? "done" : "idle",
  );
  const [step, setStep] = useState(0);

  const run = () => {
    setPhase("running");
    setStep(0);
    STEPS.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), 550 * (i + 1));
    });
    setTimeout(() => {
      setPhase("done");
      void setLinkedinConnected(true);
    }, 550 * STEPS.length + 400);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Wordmark />
          <span className="label-eyebrow text-muted-foreground">Step 2 of 3</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1240px] gap-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <p className="label-eyebrow text-primary">LinkedIn Connect</p>
          <h1 className="display-lg mt-4">Who in your network can open the door?</h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            O reads your profile and connection graph to find the shortest warm path to
            each investor. Cold outreach converts at 4%; warm intros at 38%.
          </p>

          <div className="mt-8 flex items-start gap-3 border-l-2 border-primary bg-sand p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your profile data stays in your O account and is only used to map
              introduction paths to investors.
            </p>
          </div>

          {phase === "idle" && (
            <button
              onClick={run}
              className="label-eyebrow mt-8 inline-flex items-center gap-3 bg-ink px-6 py-4 text-background transition-opacity hover:opacity-85"
            >
              <Linkedin className="h-4 w-4" /> Connect LinkedIn
            </button>
          )}

          {phase !== "idle" && (
            <ul className="mt-8 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {i < step ? (
                    <Check className="h-4 w-4 text-positive" />
                  ) : phase === "running" && i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-border" />
                  )}
                  <span className={i < step ? "" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ul>
          )}

          {phase === "done" && (
            <button
              onClick={() => navigate({ to: "/onboarding" })}
              className="label-eyebrow mt-8 inline-flex items-center gap-3 bg-primary px-6 py-4 text-primary-foreground transition-opacity hover:opacity-90"
            >
              Continue to onboarding <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="panel p-7">
          <div className="flex items-center justify-between">
            <p className="label-eyebrow text-muted-foreground">Imported profile</p>
            {phase === "done" && (
              <span className="label-eyebrow flex items-center gap-1.5 text-positive">
                <Check className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>

          <div className={phase === "done" ? "" : "opacity-40 blur-[2px]"}>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-xl text-background">
                AI
              </div>
              <div>
                <p className="text-lg font-medium leading-tight">{LINKEDIN_PROFILE.name}</p>
                <p className="text-xs text-muted-foreground">{LINKEDIN_PROFILE.location}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed">{LINKEDIN_PROFILE.headline}</p>

            <div className="rule-line mt-6 pt-5">
              <p className="label-eyebrow text-muted-foreground">Experience</p>
              <ul className="mt-3 space-y-2 text-sm">
                {LINKEDIN_PROFILE.experience.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                {LINKEDIN_PROFILE.education}
              </p>
            </div>

            <div className="rule-line mt-6 pt-5">
              <p className="label-eyebrow text-primary">Network signals</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {LINKEDIN_PROFILE.signals.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-primary">—</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
