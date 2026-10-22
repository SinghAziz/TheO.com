import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

/** Routes a signed-in founder can reach before their startup profile exists. */
const PRE_PROFILE = ["/onboarding", "/linkedin"];

function AuthenticatedLayout() {
  const { loading, initialized, user, hasStartup } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  /* "Not loaded yet" must never be read as "user has no startup". */
  const ready = initialized && !loading;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (!hasStartup && !PRE_PROFILE.includes(pathname)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [ready, user, hasStartup, pathname, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}

