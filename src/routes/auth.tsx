import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or create your founder account | O" },
      {
        name: "description",
        content:
          "Create an O founder account to save your startup profile and get investor and government scheme matches that update as your profile changes.",
      },
      { property: "og:title", content: "Sign in to O" },
      {
        property: "og:description",
        content: "Sign in to O to save your startup profile and see your capital matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading, initialized, hasStartup } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && user) {
      navigate({ to: hasStartup ? "/dashboard" : "/onboarding", replace: true });
    }
  }, [user, loading, initialized, hasStartup, navigate]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: "https://o.harazizsingh.com/auth",
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          toast.success("Account created. Check your inbox to confirm, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Wordmark />
          <Link to="/" className="label-eyebrow text-muted-foreground">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1240px] gap-px bg-border px-0 md:grid-cols-2">
        <section className="bg-background px-5 py-14 md:px-10 md:py-20">
          <p className="label-eyebrow text-primary">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
          <h1 className="display-lg mt-4">
            {mode === "signup" ? "Start as a Founder" : "Sign in to O"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your startup profile is saved to your account, so investor matches, scheme
            relevance and your evaluation stay in sync across sessions.
          </p>

          <form onSubmit={submit} className="mt-10 max-w-md space-y-5">
            {mode === "signup" && (
              <label className="block">
                <span className="label-eyebrow text-muted-foreground">Full name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm"
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block">
              <span className="label-eyebrow text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="you@startup.com"
              />
            </label>
            <label className="block">
              <span className="label-eyebrow text-muted-foreground">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm"
                placeholder="At least 6 characters"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="label-eyebrow inline-flex items-center gap-2 bg-primary px-6 py-3 text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-6 text-sm text-muted-foreground underline"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "New to O? Create an account"}
          </button>
        </section>

        <section className="bg-sand px-5 py-14 md:px-10 md:py-20">
          <p className="label-eyebrow text-muted-foreground">What happens next</p>
          <ol className="mt-6 space-y-6">
            {[
              ["01", "Build your startup profile", "Sector, stage, location, funding need, revenue, growth, team and DPIIT status."],
              ["02", "See investors matched to that profile", "Transparent 0–100 fit scores with the reasons behind each one."],
              ["03", "See government schemes for you", "Deterministic eligibility with clear hard-fail explanations."],
              ["04", "Read your evaluation", "Four categories scored from your own profile data."],
            ].map(([n, t, b]) => (
              <li key={n} className="flex gap-4">
                <span className="label-eyebrow text-primary">{n}</span>
                <div>
                  <p className="text-base font-medium">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
