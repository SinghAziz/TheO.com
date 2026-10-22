export const NOT_PROVIDED = "Not provided";

export function inr(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return NOT_PROVIDED;
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function pct(v: number | null, digits = 1): string {
  return v === null || !Number.isFinite(v) ? NOT_PROVIDED : `${v.toFixed(digits)}%`;
}

export function months(v: number | null): string {
  return v === null || !Number.isFinite(v) ? NOT_PROVIDED : `${v.toFixed(1)} months`;
}

export function multiple(v: number | null): string {
  return v === null || !Number.isFinite(v) ? NOT_PROVIDED : `${v.toFixed(1)}x`;
}

export function count(v: number | null): string {
  return v === null || !Number.isFinite(v) ? NOT_PROVIDED : Math.round(v).toLocaleString("en-IN");
}
