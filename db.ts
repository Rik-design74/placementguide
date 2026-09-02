// Browser-only mock of the Supabase backend, used when the app is running
// in local mode (see src/lib/mode.ts). Auth "users" and prep packs are
// stored in this browser's localStorage only — nothing leaves the device,
// nothing survives clearing site data or switching browsers/devices.
"use client";

import type { Pack, Track, PackStatus } from "@/lib/types";

export interface LocalSession {
  id: string;
  email: string;
}

export interface LocalPackRow {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  track: Track;
  jd_text: string;
  resume_text: string;
  pack: Pack;
  practiced: Record<string, boolean>;
  notes: Record<string, string>;
  status: PackStatus;
  created_at: string;
  updated_at: string;
}

interface LocalUser {
  id: string;
  email: string;
  password: string;
}

const USERS_KEY = "pp_local_users";
const SESSION_KEY = "pp_local_session";
const PACKS_KEY = "pp_local_packs";

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
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function localSignUp(email: string, password: string): LocalSession {
  const users = read<LocalUser[]>(USERS_KEY, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const user: LocalUser = { id: newId(), email, password };
  write(USERS_KEY, [...users, user]);
  const session: LocalSession = { id: user.id, email: user.email };
  write(SESSION_KEY, session);
  return session;
}

export function localSignIn(email: string, password: string): LocalSession {
  const users = read<LocalUser[]>(USERS_KEY, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error("Invalid email or password.");
  const session: LocalSession = { id: user.id, email: user.email };
  write(SESSION_KEY, session);
  return session;
}

export function localSignOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function localGetSession(): LocalSession | null {
  return read<LocalSession | null>(SESSION_KEY, null);
}

export function localListPacks(userId: string): LocalPackRow[] {
  return read<LocalPackRow[]>(PACKS_KEY, [])
    .filter((p) => p.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function localGetPack(id: string): LocalPackRow | null {
  return read<LocalPackRow[]>(PACKS_KEY, []).find((p) => p.id === id) ?? null;
}

export function localInsertPack(
  input: Omit<LocalPackRow, "id" | "created_at" | "updated_at">,
): LocalPackRow {
  const now = new Date().toISOString();
  const row: LocalPackRow = { ...input, id: newId(), created_at: now, updated_at: now };
  const packs = read<LocalPackRow[]>(PACKS_KEY, []);
  write(PACKS_KEY, [...packs, row]);
  return row;
}

export function localUpdatePack(
  id: string,
  patch: Partial<Omit<LocalPackRow, "id" | "user_id" | "created_at">>,
): LocalPackRow | null {
  const packs = read<LocalPackRow[]>(PACKS_KEY, []);
  const idx = packs.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const current = packs[idx];
  const merged: LocalPackRow = {
    ...current,
    ...patch,
    practiced: patch.practiced ? { ...current.practiced, ...patch.practiced } : current.practiced,
    notes: patch.notes ? { ...current.notes, ...patch.notes } : current.notes,
    updated_at: new Date().toISOString(),
  };
  const next = [...packs];
  next[idx] = merged;
  write(PACKS_KEY, next);
  return merged;
}

export function localDeletePack(id: string) {
  const packs = read<LocalPackRow[]>(PACKS_KEY, []);
  write(PACKS_KEY, packs.filter((p) => p.id !== id));
}
