"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localGetSession, type LocalSession } from "@/lib/local/db";

/**
 * Client-side auth guard for local mode: redirects to `redirectTo` if no
 * local session exists. Pass `enabled: false` (e.g. when not in local mode)
 * to make this a no-op — always call the hook unconditionally per rules of
 * hooks, and just disable it when it doesn't apply.
 */
export function useLocalSession(redirectTo: string, enabled: boolean = true) {
  const router = useRouter();
  const [session, setSession] = useState<LocalSession | null | "loading">("loading");

  useEffect(() => {
    if (!enabled) return;
    const existing = localGetSession();
    if (!existing) {
      router.replace(redirectTo);
      return;
    }
    queueMicrotask(() => setSession(existing));
  }, [router, redirectTo, enabled]);

  return session;
}
