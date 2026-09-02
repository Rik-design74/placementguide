// The entire "backend" for this demo: auth accounts and prep packs both
// live in this browser's localStorage. Nothing is sent to a server —
// there is no database and no API key to configure, so the app runs
// end-to-end straight after `npm install && npm run dev`.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Pack, PackStatus, Track } from "@/lib/types";

export interface Session {
  id: string;
  email: string;
  name: string;
}

export interface PackRow {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  track: Track;
  pack: Pack;
  practiced: Record<string, boolean>;
  notes: Record<string, string>;
  status: PackStatus;
  createdAt: string;
  updatedAt: string;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

const USERS_KEY = "pp_users";
const SESSION_KEY = "pp_session";
const PACKS_KEY = "pp_packs";
const GEN_LOG_KEY = "pp_gen_log";

export const DEMO_CREDENTIALS = { email: "demo@placementprep.ai", password: "demo1234" };

const HOURLY_LIMIT = 5;
const DAILY_GLOBAL_LIMIT = Number(process.env.NEXT_PUBLIC_MAX_DAILY_GENERATIONS ?? 50);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled — silently no-op, this is a demo fallback.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Seeds the shared demo login, idempotently, the first time this module runs in a browser. */
function ensureDemoUser() {
  const users = read<StoredUser[]>(USERS_KEY, []);
  if (!users.some((u) => u.email.toLowerCase() === DEMO_CREDENTIALS.email)) {
    write(USERS_KEY, [
      ...users,
      { id: "demo-user", email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password, name: "Demo Student" },
    ]);
  }
}

if (typeof window !== "undefined") {
  ensureDemoUser();
}

export function signUp(name: string, email: string, password: string): Session {
  const users = read<StoredUser[]>(USERS_KEY, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const user: StoredUser = { id: newId(), email, password, name: name.trim() || email.split("@")[0] };
  write(USERS_KEY, [...users, user]);
  const session: Session = { id: user.id, email: user.email, name: user.name };
  write(SESSION_KEY, session);
  return session;
}

export function signIn(email: string, password: string): Session {
  const users = read<StoredUser[]>(USERS_KEY, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error("Invalid email or password.");
  const session: Session = { id: user.id, email: user.email, name: user.name };
  write(SESSION_KEY, session);
  return session;
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

/** Client-side auth guard: redirects to `redirectTo` if no session exists. */
export function useSession(redirectTo: string) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | "loading">("loading");

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      router.replace(redirectTo);
      return;
    }
    queueMicrotask(() => setSession(existing));
  }, [router, redirectTo]);

  return session;
}

export function listPacks(userId: string): PackRow[] {
  return read<PackRow[]>(PACKS_KEY, [])
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPack(id: string): PackRow | null {
  return read<PackRow[]>(PACKS_KEY, []).find((p) => p.id === id) ?? null;
}

export function insertPack(input: Omit<PackRow, "id" | "createdAt" | "updatedAt">): PackRow {
  const now = new Date().toISOString();
  const row: PackRow = { ...input, id: newId(), createdAt: now, updatedAt: now };
  write(PACKS_KEY, [...read<PackRow[]>(PACKS_KEY, []), row]);
  return row;
}

export function updatePack(
  id: string,
  patch: Partial<Pick<PackRow, "title" | "status" | "practiced" | "notes">>,
): PackRow | null {
  const packs = read<PackRow[]>(PACKS_KEY, []);
  const idx = packs.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const current = packs[idx];
  const merged: PackRow = {
    ...current,
    ...patch,
    practiced: patch.practiced ? { ...current.practiced, ...patch.practiced } : current.practiced,
    notes: patch.notes ? { ...current.notes, ...patch.notes } : current.notes,
    updatedAt: new Date().toISOString(),
  };
  const next = [...packs];
  next[idx] = merged;
  write(PACKS_KEY, next);
  return merged;
}

export function deletePack(id: string) {
  write(PACKS_KEY, read<PackRow[]>(PACKS_KEY, []).filter((p) => p.id !== id));
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "user_hourly" | "global_daily";
}

/** Per-user 5/hour cap plus a global MAX_DAILY_GENERATIONS-style cap, both enforced client-side. */
export function checkAndLogGeneration(userId: string): RateLimitResult {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const todayKey = new Date().toISOString().slice(0, 10);

  const log = read<{ userId: string; ts: number; day: string }[]>(GEN_LOG_KEY, []);
  const recentUserCount = log.filter((e) => e.userId === userId && e.ts >= oneHourAgo).length;
  if (recentUserCount >= HOURLY_LIMIT) {
    return { allowed: false, reason: "user_hourly" };
  }

  const todayCount = log.filter((e) => e.day === todayKey).length;
  if (todayCount >= DAILY_GLOBAL_LIMIT) {
    return { allowed: false, reason: "global_daily" };
  }

  write(GEN_LOG_KEY, [...log, { userId, ts: now, day: todayKey }]);
  return { allowed: true };
}
