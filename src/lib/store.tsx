import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_STARTUP, type Sector, type Stage } from "./data";
import type { KPIInput } from "./kpi";
import type { BusinessModel, StartupProfile } from "./matching-types";


export interface IntroRequest {
  investorId: string;
  investorName: string;
  at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  linkedin_connected: boolean;
}

export interface AppState {
  role: "founder" | "investor" | null;
  linkedinConnected: boolean;
  /** True when the authenticated user already has a startup profile row. */
  onboarded: boolean;
  startup: StartupProfile;
  /** Raw, founder-entered KPI inputs. Missing key = not provided (never zero). */
  kpi: KPIInput;

  saved: string[];
  applied: string[];
  introRequests: IntroRequest[];
}

const DRAFT_STARTUP: StartupProfile = {
  name: DEFAULT_STARTUP.name,
  oneLiner: DEFAULT_STARTUP.oneLiner,
  sector: DEFAULT_STARTUP.sector,
  stage: DEFAULT_STARTUP.stage,
  city: DEFAULT_STARTUP.city,
  state: DEFAULT_STARTUP.state,
  team: DEFAULT_STARTUP.team,
  arr: DEFAULT_STARTUP.arr,
  raising: DEFAULT_STARTUP.raising,
  monthlyGrowth: DEFAULT_STARTUP.monthlyGrowth,
  businessModel: DEFAULT_STARTUP.businessModel as BusinessModel,
  dpiit: DEFAULT_STARTUP.dpiit,
};

const initial: AppState = {
  role: "founder",
  linkedinConnected: false,
  onboarded: false,
  startup: DRAFT_STARTUP,
  kpi: {},
  saved: [],
  applied: [],
  introRequests: [],
};

/** Prototype-only local state (shortlists, intro requests). */
const LOCAL_KEY = "o-local-state";

type LocalSlice = Pick<AppState, "saved" | "applied" | "introRequests">;


interface StartupRow {
  user_id: string;
  startup_name: string;
  one_liner: string;
  sector: string;
  stage: string;
  city: string;
  location: string;
  business_model: string;
  funding_required: number;
  revenue: number;
  monthly_growth: number;
  employees: number;
  dpiit_registered: boolean;
}

function rowToProfile(r: StartupRow): StartupProfile {
  return {
    name: r.startup_name || "",
    oneLiner: r.one_liner || "",
    sector: (r.sector || DRAFT_STARTUP.sector) as Sector,
    stage: (r.stage || DRAFT_STARTUP.stage) as Stage,
    city: r.city || DRAFT_STARTUP.city,
    state: r.location || DRAFT_STARTUP.state,
    businessModel: (r.business_model || DRAFT_STARTUP.businessModel) as BusinessModel,
    raising: Number(r.funding_required ?? 0),
    arr: Number(r.revenue ?? 0),
    monthlyGrowth: Number(r.monthly_growth ?? 0),
    team: Number(r.employees ?? 1),
    dpiit: Boolean(r.dpiit_registered),
  };
}

function profileToRow(userId: string, s: StartupProfile) {
  return {
    user_id: userId,
    startup_name: s.name,
    one_liner: s.oneLiner,
    sector: s.sector,
    stage: s.stage,
    city: s.city,
    location: s.state,
    business_model: s.businessModel,
    funding_required: s.raising,
    revenue: s.arr,
    monthly_growth: s.monthlyGrowth,
    employees: s.team,
    dpiit_registered: s.dpiit,
  };
}

/** Raw KPI row shape: every column is nullable — NULL means "not provided". */
interface KpiRow {
  monthly_revenue: number | null;
  previous_month_revenue: number | null;
  cash_balance: number | null;
  monthly_burn: number | null;
  total_customers: number | null;
  cac: number | null;
  average_revenue_per_customer: number | null;
  gross_margin: number | null;
  monthly_churn: number | null;
  nrr: number | null;
}

const KPI_COLUMNS: [keyof KPIInput, keyof KpiRow][] = [
  ["monthlyRevenue", "monthly_revenue"],
  ["previousMonthRevenue", "previous_month_revenue"],
  ["cashBalance", "cash_balance"],
  ["monthlyBurn", "monthly_burn"],
  ["totalCustomers", "total_customers"],
  ["cac", "cac"],
  ["averageRevenuePerCustomer", "average_revenue_per_customer"],
  ["grossMargin", "gross_margin"],
  ["monthlyChurn", "monthly_churn"],
  ["nrr", "nrr"],
];

/** NULL columns are omitted entirely — "not provided" is never zero. */
function rowToKpi(r: KpiRow): KPIInput {
  const out: KPIInput = {};
  for (const [field, column] of KPI_COLUMNS) {
    const v = r[column];
    if (v !== null && v !== undefined) out[field] = Number(v);
  }
  return out;

}

function kpiToRow(startupId: string, k: KPIInput) {
  const v = (x: number | undefined) => (x === undefined ? null : x);
  return {
    startup_id: startupId,
    monthly_revenue: v(k.monthlyRevenue),
    previous_month_revenue: v(k.previousMonthRevenue),
    cash_balance: v(k.cashBalance),
    monthly_burn: v(k.monthlyBurn),
    total_customers: v(k.totalCustomers),
    cac: v(k.cac),
    average_revenue_per_customer: v(k.averageRevenuePerCustomer),
    gross_margin: v(k.grossMargin),
    monthly_churn: v(k.monthlyChurn),
    nrr: v(k.nrr),
  };
}

interface Ctx {
  state: AppState;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  /** True until the session and startup profile have been resolved. */
  loading: boolean;
  /** True once the first full hydration (session → profile → startup → KPI) finished. */
  initialized: boolean;
  hasStartup: boolean;
  saving: boolean;
  kpiSaving: boolean;

  set: (patch: Partial<AppState>) => void;
  /** Patch raw KPI inputs; `undefined` clears a field back to "not provided". */
  setKpi: (patch: Partial<KPIInput>) => void;
  /** Persist the current startup profile (insert on first save, update after). */
  saveStartup: () => Promise<void>;
  setLinkedinConnected: (v: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  toggleSaved: (id: string) => void;
  markApplied: (id: string) => void;
  requestIntro: (investorId: string, investorName: string) => void;
}


const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [hasStartup, setHasStartup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kpiSaving, setKpiSaving] = useState(false);
  const hasStartupRef = useRef(false);
  const startupRef = useRef(state.startup);
  const userIdRef = useRef<string | null>(null);
  const startupIdRef = useRef<string | null>(null);
  const kpiRef = useRef<KPIInput>(state.kpi);
  /** Monotonic hydration id — only the newest load may write state. */
  const genRef = useRef(0);
  /** User id whose data is already hydrated, to avoid duplicate loads. */
  const loadedUserRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kpiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  startupRef.current = state.startup;
  hasStartupRef.current = hasStartup;

  /* Local prototype slice */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const l = JSON.parse(raw) as Partial<LocalSlice>;
        setState((s) => ({
          ...s,
          saved: l.saved ?? [],
          applied: l.applied ?? [],
          introRequests: l.introRequests ?? [],
        }));
      }
    } catch {
      /* prototype: ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const { saved, applied, introRequests } = state;
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ saved, applied, introRequests }));
    } catch {
      /* prototype: ignore */
    }
  }, [state.saved, state.applied, state.introRequests, state]);


  /**
   * Loads profile → startup profile → KPI row for a user.
   * `gen` guards every write: a stale load can never overwrite a newer one
   * (otherwise a slow load resolving last resets startup data to defaults).
   */
  const load = useCallback(
    async (gen: number, userId: string, email: string, fullName: string) => {
      const fresh = () => genRef.current === gen;
      const [{ data: prof }, { data: startup }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("startup_profiles").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      if (!fresh()) return;

      let resolvedProfile = prof as UserProfile | null;
      if (!resolvedProfile) {
        const { data: created } = await supabase
          .from("profiles")
          .insert({ id: userId, email, full_name: fullName })
          .select()
          .maybeSingle();
        resolvedProfile = (created as UserProfile | null) ?? {
          id: userId,
          full_name: fullName,
          email,
          linkedin_connected: false,
        };
      }
      if (!fresh()) return;
      setProfile(resolvedProfile);

      if (startup) {
        const row = startup as StartupRow & { id: string };
        const { data: kpiRow } = await supabase
          .from("startup_kpis")
          .select("*")
          .eq("startup_id", row.id)
          .maybeSingle();
        if (!fresh()) return;
        const kpi = kpiRow ? rowToKpi(kpiRow as KpiRow) : {};
        startupIdRef.current = row.id;
        kpiRef.current = kpi;
        setHasStartup(true);
        setState((s) => ({
          ...s,
          onboarded: true,
          linkedinConnected: resolvedProfile?.linkedin_connected ?? false,
          startup: rowToProfile(row),
          kpi,
        }));
      } else {
        startupIdRef.current = null;
        kpiRef.current = {};
        setHasStartup(false);
        setState((s) => ({
          ...s,
          onboarded: false,
          linkedinConnected: resolvedProfile?.linkedin_connected ?? false,
          startup: { ...DRAFT_STARTUP, name: "", oneLiner: "" },
          kpi: {},
        }));
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const hydrate = async (s: Session | null) => {
      if (!active) return;
      const gen = ++genRef.current;
      setSession(s);
      const u = s?.user ?? null;
      userIdRef.current = u?.id ?? null;
      if (!u) {
        startupIdRef.current = null;
        kpiRef.current = {};
        setProfile(null);
        setHasStartup(false);
        setState((st) => ({ ...st, onboarded: false, linkedinConnected: false }));
        setLoading(false);
        setInitialized(true);
        return;
      }
      setLoading(true);
      try {
        await load(
          gen,
          u.id,
          u.email ?? "",
          (u.user_metadata?.["full_name"] as string | undefined) ?? "",
        );
      } finally {
        if (active && genRef.current === gen) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      loadedUserRef.current = data.session?.user?.id ?? null;
      void hydrate(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      const nextUser = s?.user?.id ?? null;
      /* Token refreshes and repeat INITIAL_SESSION events must not re-hydrate. */
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(s);
        return;
      }
      if (event === "INITIAL_SESSION" && nextUser === loadedUserRef.current) {
        setSession(s);
        return;
      }
      if (nextUser && nextUser === loadedUserRef.current && event === "SIGNED_IN") {
        setSession(s);
        return;
      }
      loadedUserRef.current = nextUser;
      void hydrate(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);


  const persist = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    setSaving(true);
    const row = profileToRow(userId, startupRef.current);
    /* One user = one startup profile: conflict on user_id always UPDATES. */
    const { data, error } = await supabase
      .from("startup_profiles")
      .upsert(row, { onConflict: "user_id" })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (!error) {
      const id = (data as { id?: string } | null)?.id;
      if (id) startupIdRef.current = id;
      setHasStartup(true);
      setState((s) => ({ ...s, onboarded: true }));
    } else {
      console.error("startup profile save failed", error);
      throw error;
    }
  }, []);

  /** Upsert the raw KPI inputs against the owning startup profile row. */
  const persistKpi = useCallback(async () => {
    const startupId = startupIdRef.current;
    if (!startupId) return;
    setKpiSaving(true);
    const { error } = await supabase
      .from("startup_kpis")
      .upsert(kpiToRow(startupId, kpiRef.current), { onConflict: "startup_id" });
    setKpiSaving(false);
    if (error) console.error("kpi save failed", error);
  }, []);

  const set = useCallback(
    (patch: Partial<AppState>) => {
      setState((s) => ({ ...s, ...patch }));
      if (patch.startup && userIdRef.current && hasStartupRef.current) {
        startupRef.current = patch.startup;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          void persist().catch(() => undefined);
        }, 700);
      }
    },
    [persist],
  );

  /** Patch raw KPI inputs. `undefined` clears a field back to "not provided". */
  const setKpi = useCallback(
    (patch: Partial<KPIInput>) => {
      const next = { ...kpiRef.current, ...patch };
      for (const k of Object.keys(patch) as (keyof KPIInput)[]) {
        if (patch[k] === undefined) delete next[k];
      }
      kpiRef.current = next;
      setState((s) => ({ ...s, kpi: next }));
      if (kpiTimer.current) clearTimeout(kpiTimer.current);
      kpiTimer.current = setTimeout(() => {
        void persistKpi();
      }, 700);
    },
    [persistKpi],
  );


  const setLinkedinConnected = useCallback(async (v: boolean) => {
    setState((s) => ({ ...s, linkedinConnected: v }));
    const userId = userIdRef.current;
    if (!userId) return;
    await supabase.from("profiles").update({ linkedin_connected: v }).eq("id", userId);
    setProfile((p) => (p ? { ...p, linkedin_connected: v } : p));
  }, []);

  const signOut = useCallback(async () => {
    /* Bump the generation so any in-flight load cannot write after sign-out. */
    genRef.current += 1;
    loadedUserRef.current = null;
    userIdRef.current = null;
    startupIdRef.current = null;
    kpiRef.current = {};
    if (timer.current) clearTimeout(timer.current);
    if (kpiTimer.current) clearTimeout(kpiTimer.current);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setHasStartup(false);
    setState((s) => ({
      ...s,
      onboarded: false,
      linkedinConnected: false,
      startup: { ...DRAFT_STARTUP, name: "", oneLiner: "" },
      kpi: {},
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      user: session?.user ?? null,
      session,
      profile,
      loading,
      initialized,
      hasStartup,
      saving,
      kpiSaving,

      set,
      setKpi,
      saveStartup: persist,
      setLinkedinConnected,
      signOut,
      toggleSaved: (id) =>
        setState((s) => ({
          ...s,
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        })),
      markApplied: (id) =>
        setState((s) => ({
          ...s,
          applied: s.applied.includes(id) ? s.applied : [...s.applied, id],
        })),
      requestIntro: (investorId, investorName) =>
        setState((s) => ({
          ...s,
          introRequests: s.introRequests.some((r) => r.investorId === investorId)
            ? s.introRequests
            : [...s.introRequests, { investorId, investorName, at: new Date().toISOString() }],
        })),
    }),
    [
      state,
      session,
      profile,
      loading,
      initialized,
      hasStartup,

      saving,
      kpiSaving,
      set,
      setKpi,
      persist,
      setLinkedinConnected,
      signOut,
    ],
  );


  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
