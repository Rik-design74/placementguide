import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          {user ? (
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
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink rounded-md"
                >
                  Log out
                </button>
              </form>
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
