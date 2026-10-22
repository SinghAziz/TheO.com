import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Rocket } from "lucide-react";
import { Wordmark } from "@/components/AppShell";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/select-role")({
  head: () => ({
    meta: [
      { title: "Choose your path — Founder or Investor | O" },
      {
        name: "description",
        content:
          "Tell O whether you are raising capital as a founder or deploying it as an investor to tailor your workspace.",
      },
      { property: "og:title", content: "Choose your path — Founder or Investor | O" },
      {
        property: "og:description",
        content: "Founder or investor: pick a path to set up your O workspace.",
      },
    ],
  }),
  component: SelectRole,
});

function SelectRole() {
  const { state, set } = useApp();
  const navigate = useNavigate();

  const choose = (role: "founder" | "investor") => {
    set({ role });
    if (role === "founder") navigate({ to: "/linkedin" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Wordmark />
          <span className="label-eyebrow text-muted-foreground">Step 1 of 3</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-14 md:px-8 md:py-20">
        <p className="label-eyebrow text-primary">Who is using O today</p>
        <h1 className="display-lg mt-4 max-w-2xl">
          Are you raising capital, or deploying it?
        </h1>

        <div className="mt-12 grid gap-px bg-border md:grid-cols-2">
          <button
            onClick={() => choose("founder")}
            className={`group bg-background p-8 text-left transition-colors hover:bg-sand md:p-10 ${
              state.role === "founder" ? "bg-sand" : ""
            }`}
          >
            <Rocket className="h-6 w-6 text-primary" />
            <h2 className="mt-6 text-3xl">I'm a founder</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Get matched with Indian investors, find schemes that may be relevant to your startup
              and benchmark your KPIs before you pitch.
            </p>
            <span className="label-eyebrow mt-8 inline-flex items-center gap-2 text-primary">
              Start as a Founder <ArrowRight className="h-4 w-4" />
            </span>
          </button>

          <button
            onClick={() => choose("investor")}
            className={`bg-background p-8 text-left transition-colors hover:bg-sand md:p-10 ${
              state.role === "investor" ? "bg-sand" : ""
            }`}
          >
            <Briefcase className="h-6 w-6 text-muted-foreground" />
            <h2 className="mt-6 text-3xl">I'm an investor</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Screen deal flow by stage, sector and traction quality with standardised KPI
              scoring.
            </p>
            <span className="label-eyebrow mt-8 inline-block bg-sand px-3 py-1.5 text-muted-foreground">
              Coming later
            </span>
          </button>
        </div>

        {state.role === "investor" && (
          <div className="panel mt-8 p-6">
            <p className="text-sm">
              O currently focuses on the founder workspace. The investor workspace isn't
              available yet — you can continue as a founder.
            </p>
            <Link
              to="/linkedin"
              className="label-eyebrow mt-4 inline-flex items-center gap-2 text-primary"
            >
              Explore as founder <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
