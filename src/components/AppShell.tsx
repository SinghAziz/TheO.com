import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useApp } from "@/lib/store";


export function Wordmark({ label = true, to = "/" }: { label?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary">
        <span className="h-2 w-2 rounded-full bg-primary" />
      </span>
      {label && (
        <span className="font-display text-2xl leading-none tracking-tight">TheO</span>
      )}
    </Link>
  );
}

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/investors", label: "Investors" },
  { to: "/schemes", label: "Government Schemes" },
  { to: "/kpi", label: "Evaluation" },
  { to: "/profile", label: "Profile" },
] as const;

export function AppShell({
  children,
  eyebrow,
  title,
  lede,
  action,
}: {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  lede?: string;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, user, signOut } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-8">
            <Wordmark to={user ? "/dashboard" : "/"} />
            <nav className="hidden items-center gap-7 md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`label-eyebrow transition-colors ${
                    pathname === n.to
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{state.startup.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {state.startup.stage} · {state.startup.city}
              </p>
            </div>
            {user && (
              <button
                onClick={() => void handleSignOut()}
                className="label-eyebrow hidden items-center gap-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            )}
            <button
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-border px-5 py-3 md:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm"
              >
                {n.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => void handleSignOut()}
                className="py-2 text-left text-sm text-muted-foreground"
              >
                Sign out
              </button>
            )}
          </nav>
        )}
      </header>

      {(title || eyebrow) && (
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8 md:py-14">
            <div className="max-w-2xl">
              {eyebrow && <p className="label-eyebrow text-primary">{eyebrow}</p>}
              {title && <h1 className="display-lg mt-3">{title}</h1>}
              {lede && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {lede}
                </p>
              )}
            </div>
            {action}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14">{children}</main>

      <footer className="rule-line mt-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>TheO — Understand your startup. Find what comes next.</p>
          <p>TheO — startup ecosystem intelligence</p>
        </div>
      </footer>
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border-l border-border pl-4">
      <p className="label-eyebrow text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Meter({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full bg-sand">
      <div
        className="h-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
