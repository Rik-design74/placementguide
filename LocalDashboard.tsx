"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalSession } from "@/lib/local/useLocalSession";
import { localDeletePack, localListPacks, type LocalPackRow } from "@/lib/local/db";
import PackCard, { type PackCardData } from "@/components/PackCard";

function toCardData(row: LocalPackRow): PackCardData {
  const totalQuestions = row.pack?.questions?.length ?? 0;
  const practicedCount = Object.values(row.practiced ?? {}).filter(Boolean).length;
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    track: row.track,
    status: row.status,
    practicedCount,
    totalQuestions,
    updatedAt: row.updated_at,
  };
}

export default function LocalDashboard() {
  const session = useLocalSession("/login?next=/dashboard");
  const [packs, setPacks] = useState<PackCardData[] | null>(null);

  useEffect(() => {
    if (session && session !== "loading") {
      queueMicrotask(() => setPacks(localListPacks(session.id).map(toCardData)));
    }
  }, [session]);

  function handleDelete(id: string) {
    localDeletePack(id);
    setPacks((prev) => (prev ?? []).filter((p) => p.id !== id));
  }

  if (session === "loading" || packs === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-ink-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">My prep packs</h1>
          <p className="text-ink-soft mt-1">
            {packs.length === 0
              ? "You haven't generated a pack yet."
              : `${packs.length} pack${packs.length === 1 ? "" : "s"} saved.`}
          </p>
        </div>
        <Link
          href="/prep/new"
          className="shrink-0 px-4 py-2.5 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors"
        >
          + New Prep
        </Link>
      </div>

      {packs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper-raised p-10 text-center">
          <p className="font-display text-xl text-ink mb-2">No prep packs yet</p>
          <p className="text-ink-soft mb-6 max-w-md mx-auto">
            Paste a job description and your resume to generate your first tailored
            interview prep pack.
          </p>
          <Link
            href="/prep/new"
            className="inline-block px-5 py-2.5 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors"
          >
            Create your first pack
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
