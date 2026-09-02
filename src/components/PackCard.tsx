"use client";

import { useState } from "react";
import Link from "next/link";
import { TRACK_LABELS, type PackStatus, type Track } from "@/lib/types";

export interface PackCardData {
  id: string;
  title: string;
  company: string | null;
  track: Track;
  status: PackStatus;
  practicedCount: number;
  totalQuestions: number;
}

export default function PackCard({
  pack,
  onDelete,
}: {
  pack: PackCardData;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const percent = pack.totalQuestions
    ? Math.round((pack.practicedCount / pack.totalQuestions) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/prep/${pack.id}`}
            className="font-display text-lg font-semibold text-ink hover:text-gold leading-snug"
          >
            {pack.title}
          </Link>
          <StatusBadge status={pack.status} />
        </div>
        <p className="text-sm text-ink-soft mt-1">
          {pack.company ? `${pack.company} · ` : ""}
          {TRACK_LABELS[pack.track]}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-medium text-ink-soft mb-1">
          <span>Practiced</span>
          <span>
            {pack.practicedCount}/{pack.totalQuestions}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-line">
        <Link href={`/prep/${pack.id}`} className="text-sm font-semibold text-ink hover:text-gold">
          Open pack →
        </Link>

        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(pack.id)}
              className="text-xs font-semibold text-danger hover:underline"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs font-medium text-ink-soft hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs font-medium text-ink-soft hover:text-danger"
            aria-label={`Delete ${pack.title}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PackStatus }) {
  if (status === "interview_ready") {
    return (
      <span className="shrink-0 inline-flex items-center rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">
        Interview-ready
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center rounded-full bg-gold-soft text-ink-soft px-2.5 py-1 text-xs font-semibold">
      In progress
    </span>
  );
}
