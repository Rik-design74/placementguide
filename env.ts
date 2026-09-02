// Falls back to harmless placeholders when Supabase env vars aren't set yet,
// so `next build` (and a first deploy without Supabase configured) never
// crashes on a missing/undefined URL. Auth/DB calls will fail at runtime
// until real values are set in the environment — this only keeps the build
// and page rendering from throwing.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
