import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink mb-3">
        Not found
      </h1>
      <p className="text-ink-soft mb-8">
        This prep pack doesn&apos;t exist, or isn&apos;t yours to see.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-5 py-2.5 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
