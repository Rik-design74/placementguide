"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalSession } from "@/lib/local/useLocalSession";
import { localGetPack, localUpdatePack, type LocalPackRow } from "@/lib/local/db";
import PrepPackView from "@/components/PrepPackView";

export default function LocalPrepPackLoader({ id }: { id: string }) {
  const router = useRouter();
  const session = useLocalSession(`/login?next=/prep/${id}`);
  const [row, setRow] = useState<LocalPackRow | null | "loading">("loading");

  useEffect(() => {
    if (!session || session === "loading") return;
    const found = localGetPack(id);
    if (!found || found.user_id !== session.id) {
      router.replace("/dashboard");
      return;
    }
    queueMicrotask(() => setRow(found));
  }, [session, id, router]);

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
      onPatch={(body) => {
        localUpdatePack(row.id, body as Parameters<typeof localUpdatePack>[1]);
      }}
    />
  );
}
