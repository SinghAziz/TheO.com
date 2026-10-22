import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Wordmark } from "@/components/AppShell";
import { INVESTORS } from "@/data/investors";
import { SCHEMES } from "@/data/schemes";
import { useApp } from "@/lib/store";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TheO — Startup Ecosystem Intelligence" },
      {
        name: "description",
        content:
          "Startup ecosystem intelligence for founders — discover investors, funding schemes, evaluate your startup and navigate what's next.",
      },
      { property: "og:title", content: "TheO — Startup Ecosystem Intelligence" },
      {
        property: "og:description",
        content:
          "Startup ecosystem intelligence for founders — discover investors, funding schemes, evaluate your startup and navigate what's next.",
      },
    ],
  }),
  component: Landing,
});

const CAPABILITIES = [
  {
    n: "01",
    title: "Find the right investors",
    body: "Match your startup with investors based on sector, stage, geography and cheque size.",
  },
  {
    n: "02",
    title: "Discover funding schemes",
    body: "Browse Indian government schemes and see which ones may match your startup.",
  },
  {
    n: "03",
    title: "Evaluate your startup",
    body: "Understand your strengths, risks and funding readiness across four categories: growth, unit economics, retention and financial health.",
  },
  {
    n: "04",
    title: "Build your founder profile",
    body: "Connect your professional profile to make your TheO recommendations more relevant.",
  },
];

function Landing() {
  const { user, initialized } = useApp();
  /* `initialized` is false during SSR and first paint, so markup matches on hydration. */
  const signedIn = initialized && Boolean(user);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Wordmark />
          <div className="flex items-center gap-6">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="label-eyebrow bg-ink px-4 py-2.5 text-background transition-opacity hover:opacity-85"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="label-eyebrow text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  to="/auth"
                  className="label-eyebrow bg-ink px-4 py-2.5 text-background transition-opacity hover:opacity-85"
                >
                  Start as a Founder
                </Link>
              </>
            )}
          </div>
        </div>
      </header>


      <section className="border-b border-border">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
          <p className="label-eyebrow text-primary">Startup ecosystem intelligence · India</p>
          <h1 className="display-xl mt-6 max-w-4xl">
            Understand your startup.
            <br />
            <span className="text-primary">Find what comes next.</span>
          </h1>
          <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              TheO brings together the opportunities, resources and intelligence founders need to
              navigate the startup ecosystem — from funding and government schemes to startup
              evaluation and beyond.
            </p>
            <Link
              to="/auth"
              className="label-eyebrow inline-flex w-fit items-center gap-3 bg-primary px-6 py-4 text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start as a Founder <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14">
          <h2 className="text-2xl">The startup ecosystem is fragmented.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Investors are on one platform. Government schemes are somewhere else. Opportunities,
            resources and useful information are scattered across hundreds of websites.
          </p>
          <p className="mt-5 font-medium text-primary">TheO brings it together.</p>
        </div>
      </section>

      <section className="border-b border-border bg-sand">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-8 px-5 py-10 md:grid-cols-3 md:px-8">
          {[
            { k: `${INVESTORS.length}`, v: "Investors indexed" },
            { k: `${SCHEMES.length}`, v: "Schemes indexed" },
            { k: "4", v: "Evaluation categories" },
          ].map((s) => (
            <div key={s.v}>
              <p className="font-display text-3xl leading-none md:text-4xl">{s.k}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="display-lg max-w-2xl">
            Everything you need to navigate the startup ecosystem.
          </h2>
          <p className="label-eyebrow text-muted-foreground">Phase 1</p>
        </div>
        <div className="mt-12 grid gap-px bg-border md:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div key={c.n} className="bg-background p-7 md:p-9">
              <p className="font-mono text-xs text-primary">{c.n}</p>
              <h3 className="mt-5 text-2xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-sand">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="label-eyebrow text-primary">How TheO works</p>
            <h2 className="display-lg mt-4">One startup profile. Multiple paths to capital.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              TheO connects your startup profile to investors, government funding opportunities
              and startup evaluation.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { title: "Your Startup", body: "Sector, stage, location and funding needs" },
              {
                title: "TheO understands your profile",
                body: "Maps your inputs to relevant capital",
              },
              { title: "Investors + Schemes + Evaluation", body: "See what fits and what to improve" },
            ].map((step, i, arr) => (
              <div key={step.title} className="relative flex items-start gap-4 md:block">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background font-mono text-xs text-primary">
                  0{i + 1}
                </div>
                <div className="flex-1 md:mt-6">
                  <h3 className="text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="absolute right-4 top-5 hidden h-px flex-1 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-eyebrow text-primary">Example output</p>
            <h2 className="display-lg mt-4 max-w-lg">Funding opportunities based on your startup profile.</h2>
          </div>
          <span className="label-eyebrow w-fit bg-sand px-3 py-1.5 text-muted-foreground">
            Representative example
          </span>
        </div>
        <div className="mt-10 grid gap-px bg-border md:grid-cols-2">
          <div className="bg-background p-7 md:p-9">
            <div className="flex items-center justify-between">
              <h3 className="text-xl">Startup India Seed Fund Scheme</h3>
              <span className="label-eyebrow text-primary">94% Match</span>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-muted-foreground">
              {["Sector", "Stage", "Location", "DPIIT"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              <span className="text-foreground">Potential issue:</span> Final eligibility depends
              on scheme requirements.
            </p>
          </div>
          <div className="bg-background p-7 md:p-9">
            <div className="flex items-center justify-between">
              <h3 className="text-xl">Blume Ventures</h3>
              <span className="label-eyebrow text-primary">92% Match</span>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-muted-foreground">
              {["Sector", "Stage", "Cheque size", "Geography"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              <span className="text-foreground">Why matched:</span> Your startup profile aligns
              with this investor's preferences.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-ink text-background">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
          <div>
            <h2 className="display-lg max-w-lg">
              Built for founders raising in India.
            </h2>
            <p className="mt-4 max-w-md text-sm text-background/70">
              Seed to Series A. INR cheques. DPIIT paperwork. Four evaluation categories: growth,
              unit economics, retention and financial health.
            </p>
          </div>
          <Link
            to="/auth"
            className="label-eyebrow inline-flex w-fit items-center gap-3 bg-primary px-6 py-4 text-primary-foreground"
          >
            Start as a Founder <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-8 text-xs text-muted-foreground md:flex-row md:justify-between md:px-8">
        <p>TheO — startup ecosystem intelligence</p>
        <p>
          Match scores and scheme relevance are indicative. Final eligibility depends on scheme
          requirements and should be independently verified.
        </p>
      </footer>
    </div>
  );
}
