import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client for the project's own (bring-your-own) Supabase
 * instance. Both values are public by design — the publishable key is safe in
 * client bundles and all access is enforced by Row Level Security.
 */
const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const publishableKey = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as
  | string
  | undefined;

export const SUPABASE_CONFIGURED = Boolean(url && publishableKey);

export const supabase = createClient(url ?? "http://localhost", publishableKey ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
