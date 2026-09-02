import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const PER_USER_HOURLY_LIMIT = 5;

export interface RateLimitResult {
  allowed: boolean;
  reason?: "user_hourly" | "global_daily";
  userCount?: number;
  globalCount?: number;
  globalLimit?: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RateLimitResult> {
  const globalLimit = Number(process.env.MAX_DAILY_GENERATIONS ?? 50);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [{ count: userCount, error: userError }, { data: globalCount, error: globalError }] =
    await Promise.all([
      supabase
        .from("prep_packs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", oneHourAgo),
      supabase.rpc("generations_today_count"),
    ]);

  if (userError) throw userError;
  if (globalError) throw globalError;

  const userGenerationsThisHour = userCount ?? 0;
  const globalGenerationsToday = Number(globalCount ?? 0);

  if (userGenerationsThisHour >= PER_USER_HOURLY_LIMIT) {
    return {
      allowed: false,
      reason: "user_hourly",
      userCount: userGenerationsThisHour,
    };
  }

  if (globalGenerationsToday >= globalLimit) {
    return {
      allowed: false,
      reason: "global_daily",
      globalCount: globalGenerationsToday,
      globalLimit,
    };
  }

  return { allowed: true };
}

export { PER_USER_HOURLY_LIMIT };
