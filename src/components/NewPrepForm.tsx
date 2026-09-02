"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TRACKS, type Track } from "@/lib/types";
import { useSession, checkAndLogGeneration, insertPack } from "@/lib/db";
import { buildPack, MIN_CHARS } from "@/lib/generate";

const LOADING_MESSAGES = [
  "Reading the job description…",
  "Reading your resume…",
  "Mapping your experience to what this role actually needs…",
  "Finding the gaps worth naming upfront…",
  "Drafting resume deep-dive questions…",
  "Building behavioral questions with STAR skeletons…",
  "Writing the curveballs…",
  "Putting together questions to ask them…",
  "Almost there…",
];

export default function NewPrepForm() {
  const router = useRouter();
  const session = useSession("/login?next=/prep/new");
  const [company, setCompany] = useState("");
  const [track, setTrack] = useState<Track>("consulting");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
      }, 550);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  const jdValid = jdText.trim().length >= MIN_CHARS;
  const resumeValid = resumeText.trim().length >= MIN_CHARS;
  const canSubmit = jdValid && resumeValid && !loading;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || session === "loading" || !session) return;
    setError(null);

    const limit = checkAndLogGeneration(session.id);
    if (!limit.allowed) {
      if (limit.reason === "user_hourly") {
        setError("You've hit the limit of 5 prep packs per hour. Take a breather and try again in a bit.");
      } else {
        setError(
          "PlacementPrep AI has hit its generation limit for today. Come back tomorrow — your existing packs are safe and ready to practice from.",
        );
      }
      return;
    }

    setMessageIndex(0);
    setLoading(true);

    const trackLabel = TRACKS.find((t) => t.value === track)?.label ?? track;
    const title = `${company ? `${company} — ` : ""}${trackLabel} Prep`;
    const pack = buildPack({ track, company: company || undefined, jdText, resumeText });

    window.setTimeout(() => {
      const row = insertPack({
        userId: session.id,
        title,
        company: company || null,
        track,
        pack,
        practiced: {},
        notes: {},
        status: "in_progress",
      });
      router.push(`/prep/${row.id}`);
    }, LOADING_MESSAGES.length * 550 + 300);
  }

  if (session === "loading" || !session) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-10 text-center">
        <div className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <p className="font-display text-lg text-ink mb-1">Building your prep pack</p>
        <p className="text-ink-soft transition-opacity">{LOADING_MESSAGES[messageIndex]}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-ink mb-1.5">
            Company <span className="text-ink-soft font-normal">(optional)</span>
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Hindustan Unilever"
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold"
          />
        </div>

        <div>
          <label htmlFor="track" className="block text-sm font-medium text-ink mb-1.5">
            Role track
          </label>
          <select
            id="track"
            value={track}
            onChange={(e) => setTrack(e.target.value as Track)}
            className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold"
          >
            {TRACKS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor="jdText" className="block text-sm font-medium text-ink">
            Job description
          </label>
          <span className={`text-xs ${jdValid ? "text-success" : "text-ink-soft"}`}>
            {jdText.trim().length}/{MIN_CHARS} min
          </span>
        </div>
        <textarea
          id="jdText"
          required
          rows={8}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here…"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold resize-y"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label htmlFor="resumeText" className="block text-sm font-medium text-ink">
            Your resume (text)
          </label>
          <span className={`text-xs ${resumeValid ? "text-success" : "text-ink-soft"}`}>
            {resumeText.trim().length}/{MIN_CHARS} min
          </span>
        </div>
        <textarea
          id="resumeText"
          required
          rows={10}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here…"
          className="w-full rounded-md border border-line bg-paper-raised px-3 py-2.5 text-ink focus:border-gold resize-y"
        />
      </div>

      <div className="rounded-md bg-gold-soft/40 border border-gold/30 px-4 py-3 text-sm text-ink-soft">
        Your JD and resume are stored privately in your account (this browser only) and used only to
        generate your pack. Deleting a pack removes it permanently.
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full sm:w-auto px-6 py-3 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate my prep pack
      </button>
    </form>
  );
}
