"use client";

import type { Question } from "@/lib/types";

export default function QuestionCard({
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
            <label className="block text-xs font-semibold text-ink-soft mb-1">
              Your notes
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Jot how you'd actually answer this…"
              className="no-print w-full rounded-md border border-line bg-paper px-2.5 py-2 text-sm text-ink focus:border-gold resize-y"
            />
            {note.trim() && (
              <p className="hidden print:block text-sm text-ink mt-1 whitespace-pre-wrap">
                {note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
