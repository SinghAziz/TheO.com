export type Sector =
  | "AI/ML"
  | "SaaS"
  | "Fintech"
  | "D2C"
  | "AgriTech"
  | "HealthTech"
  | "Biotechnology"
  | "DeepTech & Hardware"
  | "EV & Mobility"
  | "EdTech"
  | "Climate";

export type Stage = "Idea" | "Pre-seed" | "Seed" | "Pre-Series A" | "Series A";

export interface KpiDef {
  id: string;
  label: string;
  unit: string;
  value: number;
  benchmark: number;
  benchmarkLabel: string;
  weight: number;
  higherIsBetter: boolean;
  note: string;
  format: (v: number) => string;
}

const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export const KPIS: KpiDef[] = [
  {
    id: "mrr",
    label: "Monthly recurring revenue",
    unit: "₹ / month",
    value: 320000,
    benchmark: 250000,
    benchmarkLabel: "Seed-stage Indian SaaS median ₹2.5 L",
    weight: 22,
    higherIsBetter: true,
    note: "Growing 11% MoM for 6 months.",
    format: (v) => inr(v),
  },
  {
    id: "growth",
    label: "MoM revenue growth",
    unit: "%",
    value: 11,
    benchmark: 8,
    benchmarkLabel: "Top-quartile seed benchmark 8%",
    weight: 20,
    higherIsBetter: true,
    note: "Driven by Tier-2 distributor onboarding.",
    format: (v) => `${v}%`,
  },
  {
    id: "burn",
    label: "Net monthly burn",
    unit: "₹ / month",
    value: 480000,
    benchmark: 400000,
    benchmarkLabel: "Peer median ₹4 L",
    weight: 14,
    higherIsBetter: false,
    note: "Two senior hires added in Q2.",
    format: (v) => inr(v),
  },
  {
    id: "runway",
    label: "Runway",
    unit: "months",
    value: 9,
    benchmark: 12,
    benchmarkLabel: "Investor comfort threshold 12 months",
    weight: 16,
    higherIsBetter: true,
    note: "Below the level most seed funds want at first meeting.",
    format: (v) => `${v} months`,
  },
  {
    id: "cac",
    label: "CAC payback",
    unit: "months",
    value: 7,
    benchmark: 9,
    benchmarkLabel: "Healthy Indian SaaS under 9 months",
    weight: 12,
    higherIsBetter: false,
    note: "Referral loop keeps paid spend low.",
    format: (v) => `${v} months`,
  },
  {
    id: "retention",
    label: "Net revenue retention",
    unit: "%",
    value: 104,
    benchmark: 100,
    benchmarkLabel: "Break-even NRR 100%",
    weight: 16,
    higherIsBetter: true,
    note: "Upsell on the compliance add-on.",
    format: (v) => `${v}%`,
  },
];

export function scoreKpi(k: KpiDef, value: number): number {
  const ratio = k.higherIsBetter ? value / k.benchmark : k.benchmark / value;
  return Math.max(0, Math.min(100, Math.round(ratio * 72)));
}

export function overallScore(values: Record<string, number>): number {
  const total = KPIS.reduce((s, k) => s + k.weight, 0);
  const sum = KPIS.reduce(
    (s, k) => s + scoreKpi(k, values[k.id] ?? k.value) * k.weight,
    0,
  );
  return Math.round(sum / total);
}

export function grade(score: number) {
  if (score >= 80) return { band: "Investment ready", tone: "positive" as const };
  if (score >= 60) return { band: "Near ready", tone: "warning" as const };
  return { band: "Needs work", tone: "destructive" as const };
}

export const REVENUE_SERIES = [
  { month: "Feb", mrr: 1.6, burn: 3.4 },
  { month: "Mar", mrr: 1.9, burn: 3.6 },
  { month: "Apr", mrr: 2.1, burn: 4.0 },
  { month: "May", mrr: 2.4, burn: 4.2 },
  { month: "Jun", mrr: 2.7, burn: 4.5 },
  { month: "Jul", mrr: 3.2, burn: 4.8 },
];

export const SECTORS: Sector[] = [
  "AI/ML",
  "SaaS",
  "Fintech",
  "D2C",
  "AgriTech",
  "HealthTech",
  "Biotechnology",
  "DeepTech & Hardware",
  "EV & Mobility",
  "EdTech",
  "Climate",
];

export const STAGES: Stage[] = [
  "Idea",
  "Pre-seed",
  "Seed",
  "Pre-Series A",
  "Series A",
];

export const CITIES = [
  "Bengaluru",
  "Mumbai",
  "New Delhi",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Ahmedabad",
  "Jaipur",
  "Mohali",
  "Chandigarh",
  "Ludhiana",
  "Gurugram",
  "Noida",
  "Kochi",
  "Indore",
];

export const STATES = [
  "Punjab",
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Haryana",
  "Uttar Pradesh",
  "Telangana",
  "Tamil Nadu",
  "Gujarat",
  "Rajasthan",
  "Kerala",
  "Madhya Pradesh",
  "West Bengal",
  "Chandigarh",
];

/** Best-guess state for a city, used to keep the profile consistent. */
export const CITY_STATE: Record<string, string> = {
  Bengaluru: "Karnataka",
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  "New Delhi": "Delhi",
  Hyderabad: "Telangana",
  Chennai: "Tamil Nadu",
  Ahmedabad: "Gujarat",
  Jaipur: "Rajasthan",
  Mohali: "Punjab",
  Chandigarh: "Chandigarh",
  Ludhiana: "Punjab",
  Gurugram: "Haryana",
  Noida: "Uttar Pradesh",
  Kochi: "Kerala",
  Indore: "Madhya Pradesh",
};

export const BUSINESS_MODELS = [
  "B2B SaaS",
  "B2B Marketplace",
  "B2C / Consumer",
  "D2C Commerce",
  "Fintech / Lending",
  "Deep Tech / R&D",
  "Hardware",
  "Services",
] as const;

export const LINKEDIN_PROFILE = {
  name: "Ananya Iyer",
  headline: "Co-founder & CEO, Khaata — GST-ready books for Bharat's retailers",
  location: "Bengaluru, Karnataka, India",
  connections: "3,214",
  education: "B.Tech, NIT Trichy · PGP, IIM Bangalore",
  experience: [
    "Co-founder & CEO · Khaata · 2025 – present",
    "Product Lead · Razorpay · 2021 – 2025",
    "Associate · Zerodha · 2019 – 2021",
  ],
  signals: [
    "12 mutual connections with Blume Ventures partners",
    "4 angels in network have invested in fintech at seed",
    "Alumni network overlap with 2 DPIIT incubators",
  ],
};

export const DEFAULT_STARTUP = {
  name: "Khaata",
  oneLiner: "AI copilot that keeps GST books clean for India's small retailers",
  sector: "AI/ML" as Sector,
  stage: "Seed" as Stage,
  city: "Mohali",
  state: "Punjab",
  founded: "2025",
  team: 6,
  arr: 4000000,
  raising: 20000000,
  monthlyGrowth: 18,
  businessModel: "B2B SaaS" as const,
  dpiit: true,
};

export const ACTIVITY = [
  { when: "Today", text: "Blume Ventures viewed your data room", tag: "Investor" },
  { when: "2 days ago", text: "SISFS application moved to incubator review", tag: "Scheme" },
  { when: "4 days ago", text: "KPI score improved 61 → 68 after July close", tag: "KPI" },
  { when: "1 week ago", text: "Warm intro path found via Titan Capital portfolio", tag: "Network" },
];
