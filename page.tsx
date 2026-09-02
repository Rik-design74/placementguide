import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PackCard, { type PackCardData } from "@/components/PackCard";
import type { Pack } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: rows, error } = await supabase
    .from("prep_packs")
    .select("id, title, company, track, status, pack, practiced, updated_at")
    .order("updated_at", { ascending: false });

  const packs: PackCardData[] = (rows ?? []).map((row) => {
    const pack = row.pack as Pack;
    const totalQuestions = pack?.questions?.length ?? 0;
    const practicedMap = (row.practiced ?? {}) as Record<string, boolean>;
    const practicedCount = Object.values(practicedMap).filter(Boolean).length;
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
  });

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

      {error && (
        <p className="text-danger mb-6">Could not load your packs. Please refresh.</p>
      )}

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
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}
