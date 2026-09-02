// True when no real Supabase project is configured (NEXT_PUBLIC_SUPABASE_URL
// unset). In that case the app runs in "local mode": auth and prep packs
// live only in this browser's localStorage instead of a real database, so
// the app is fully clickable with zero backend setup. Once real Supabase
// env vars are set, this flips to false and the app uses the real backend
// everywhere, unchanged.
export const IS_LOCAL_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;
