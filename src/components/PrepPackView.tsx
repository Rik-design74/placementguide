"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  INTERVIEW_READY_THRESHOLD,
  TRACK_LABELS,
  type Pack,
  type PackStatus,
  type Question,
  type Track,
} from "@/lib/types";
import { packToMarkdown } from "@/lib/markdown";
import { updatePack } from "@/lib/db";

function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-ink-soft mb-1">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full rounded-full bg-line overflow-hidden"
      >
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  practiced,
  note,
  onTogglePracticed,
  onNoteChange,
}: {
  question: Question;
  practiced: boolean;
  note: string;
  onTogglePracticed: (checked: boolean) => void;
  onNoteChange: (value: string) => void;
}) {
  return (
    <div className="print-card rounded-lg border border-line bg-paper-raised p-5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={practiced}
          onChange={(e) => onTogglePracticed(e.target.checked)}
          className="mt-1.5 h-4 w-4 accent-gold shrink-0"
          aria-label={`Mark practiced: ${question.question}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-ink font-medium leading-snug">{question.question}</p>
          <p className="text-sm text-ink-soft mt-1.5">
            <span className="font-semibold text-ink-soft">Testing: </span>
            {question.testing}
          </p>

          <ul className="mt-3 space-y-1 list-disc list-inside text-sm text-ink-soft">
            {question.skeleton.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>

          <div className="mt-3">
            <label className="block text-xs font-semibold text-ink-soft mb-1">Your notes</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Jot how you'd actually answer this…"
              className="no-print w-full rounded-md border border-line bg-paper px-2.5 py-2 text-sm text-ink focus:border-gold resize-y"
            />
            {note.trim() && (
              <p className="hidden print:block text-sm text-ink mt-1 whitespace-pre-wrap">{note}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrepPackView({
  id,
  initialTitle,
  company,
  track,
  status,
  pack,
  initialPracticed,
  initialNotes,
}: {
  id: string;
  initialTitle: string;
  company: string | null;
  track: Track;
  status: PackStatus;
  pack: Pack;
  initialPracticed: Record<string, boolean>;
  initialNotes: Record<string, string>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialTitle);
  const [status_, setStatus] = useState<PackStatus>(status);
  const [practiced, setPracticed] = useState<Record<string, boolean>>(initialPracticed);
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [copyLabel, setCopyLabel] = useState("Copy as Markdown");
  const [markingReady, setMarkingReady] = useState(false);

  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const totalQuestions = pack.questions.length;
  const practicedCount = useMemo(
    () => pack.questions.filter((q) => practiced[q.id]).length,
    [pack.questions, practiced],
  );
  const percent = totalQuestions ? (practicedCount / totalQuestions) * 100 : 0;
  const canMarkReady = percent >= INTERVIEW_READY_THRESHOLD && status_ !== "interview_ready";

  function handleSaveTitle() {
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (!next || next === title) {
      setTitleDraft(title);
      return;
    }
    setTitle(next);
    updatePack(id, { title: next });
  }

  function handleTogglePracticed(questionId: string, checked: boolean) {
    setPracticed((prev) => ({ ...prev, [questionId]: checked }));
    updatePack(id, { practiced: { [questionId]: checked } });
  }

  function handleNoteChange(questionId: string, value: string) {
    setNotes((prev) => ({ ...prev, [questionId]: value }));
    if (noteTimers.current[questionId]) clearTimeout(noteTimers.current[questionId]);
    noteTimers.current[questionId] = setTimeout(() => {
      updatePack(id, { notes: { [questionId]: value } });
    }, 800);
  }

  useEffect(() => {
    const timers = noteTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  function handleMarkReady() {
    setMarkingReady(true);
    updatePack(id, { status: "interview_ready" });
    setStatus("interview_ready");
    setMarkingReady(false);
  }

  function handleUnmarkReady() {
    setStatus("in_progress");
    updatePack(id, { status: "in_progress" });
  }

  async function handleCopyMarkdown() {
    const md = packToMarkdown({ title, company, track, pack, practiced, notes });
    try {
      await navigator.clipboard.writeText(md);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }
    setTimeout(() => setCopyLabel("Copy as Markdown"), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {status_ === "interview_ready" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">
              Interview-ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft text-ink-soft px-2.5 py-1 text-xs font-semibold">
              In progress
            </span>
          )}
          <span className="text-sm text-ink-soft">
            {company ? `${company} · ` : ""}
            {TRACK_LABELS[track]}
          </span>
        </div>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitleDraft(title);
                setEditingTitle(false);
              }
            }}
            className="font-display text-3xl font-semibold text-ink w-full border-b-2 border-gold bg-transparent focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="no-print font-display text-3xl font-semibold text-ink text-left hover:text-ink-soft"
            aria-label="Rename this pack"
            title="Click to rename"
          >
            {title}
          </button>
        )}
        <h1 className="hidden print:block font-display text-3xl font-semibold text-ink">{title}</h1>
      </div>

      <div className="no-print rounded-xl border border-line bg-paper-raised p-5 mb-8">
        <ProgressBar percent={percent} label="Practiced" />
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {status_ === "interview_ready" ? (
            <button
              onClick={handleUnmarkReady}
              className="px-4 py-2 rounded-md border border-line text-sm font-semibold text-ink-soft hover:text-ink"
            >
              Move back to in progress
            </button>
          ) : (
            <button
              onClick={handleMarkReady}
              disabled={!canMarkReady || markingReady}
              title={canMarkReady ? undefined : `Practice at least ${INTERVIEW_READY_THRESHOLD}% of questions to unlock`}
              className="px-4 py-2 rounded-md bg-ink text-paper text-sm font-semibold hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {markingReady ? "Saving…" : "Mark interview-ready"}
            </button>
          )}
          <button
            onClick={handleCopyMarkdown}
            className="px-4 py-2 rounded-md border border-line text-sm font-semibold text-ink hover:bg-white"
          >
            {copyLabel}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md border border-line text-sm font-semibold text-ink hover:bg-white"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <section className="print-card mb-10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-3">Fit summary</h2>
        <p className="text-ink-soft leading-relaxed">{pack.fitSummary}</p>
      </section>

      <section className="print-card mb-10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">Gaps to address</h2>
        <div className="space-y-4">
          {pack.gaps.map((g, i) => (
            <div key={i} className="rounded-lg border border-line bg-paper-raised p-4">
              <p className="text-ink font-medium">{g.gap}</p>
              <p className="text-ink-soft text-sm mt-1.5">
                <span className="font-semibold">Handle it: </span>
                {g.handleIt}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">Practice questions</h2>
        <div className="space-y-8">
          {CATEGORY_ORDER.map((category) => {
            const questions = pack.questions.filter((q) => q.category === category);
            if (questions.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="font-display text-lg font-semibold text-ink mb-3">{CATEGORY_LABELS[category]}</h3>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      practiced={!!practiced[q.id]}
                      note={notes[q.id] ?? ""}
                      onTogglePracticed={(checked) => handleTogglePracticed(q.id, checked)}
                      onNoteChange={(value) => handleNoteChange(q.id, value)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="print-card">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">Questions to ask them</h2>
        <ul className="space-y-2">
          {pack.askThem.map((q, i) => (
            <li key={i} className="rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink">
              {q}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
