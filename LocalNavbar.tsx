"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localGetSession, localSignOut, type LocalSession } from "@/lib/local/db";

export default function LocalNavbar() {
  const router = useRouter();
  const [session, setSession] = useState<LocalSession | null>(null);

  useEffect(() => {
    queueMicrotask(() => setSession(localGetSession()));
  }, []);

  function handleLogout() {
    localSignOut();
    setSession(null);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-line bg-paper-raised/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          PlacementPrep<span className="text-gold"> AI</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline-flex items-center rounded-full bg-gold-soft text-ink-soft px-2.5 py-1 text-xs font-semibold">
            Local demo mode
          </span>
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/prep/new"
                className="px-3 py-2 text-sm font-semibold rounded-md bg-ink text-paper hover:bg-ink-soft transition-colors"
              >
                New Prep
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink rounded-md"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink rounded-md"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-2 text-sm font-semibold rounded-md bg-ink text-paper hover:bg-ink-soft transition-colors"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
