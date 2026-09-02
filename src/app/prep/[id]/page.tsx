"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, getPack, type PackRow } from "@/lib/db";
import PrepPackView from "@/components/PrepPackView";

export default function PrepPackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession(`/login?next=/prep/${params.id}`);
  const [row, setRow] = useState<PackRow | null | "loading">("loading");

  useEffect(() => {
    if (!session || session === "loading") return;
    const found = getPack(params.id);
    if (!found || found.userId !== session.id) {
      router.replace("/dashboard");
      return;
    }
    queueMicrotask(() => setRow(found));
  }, [session, params.id, router]);

  if (session === "loading" || row === "loading" || row === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
        <p className="text-ink-soft">Loading…</p>
      </div>
    );
  }

  return (
    <PrepPackView
      id={row.id}
      initialTitle={row.title}
      company={row.company}
      track={row.track}
      status={row.status}
      pack={row.pack}
      initialPracticed={row.practiced}
      initialNotes={row.notes}
    />
  );
}
