import { CATEGORY_LABELS, TRACK_LABELS, type Pack, type Track } from "@/lib/types";

export function packToMarkdown(input: {
  title: string;
  company: string | null;
  track: Track;
  pack: Pack;
  practiced: Record<string, boolean>;
  notes: Record<string, string>;
}): string {
  const { title, company, track, pack, practiced, notes } = input;
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`**Track:** ${TRACK_LABELS[track]}${company ? `  \n**Company:** ${company}` : ""}`);
  lines.push("");
  lines.push("## Fit summary");
  lines.push("");
  lines.push(pack.fitSummary);
  lines.push("");
  lines.push("## Gaps to address");
  lines.push("");
  for (const g of pack.gaps) {
    lines.push(`- **Gap:** ${g.gap}`);
    lines.push(`  **Handle it:** ${g.handleIt}`);
  }
  lines.push("");
  lines.push("## Practice questions");
  lines.push("");

  for (const category of Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]) {
    const questions = pack.questions.filter((q) => q.category === category);
    if (questions.length === 0) continue;
    lines.push(`### ${CATEGORY_LABELS[category]}`);
    lines.push("");
    for (const q of questions) {
      const done = practiced[q.id] ? "x" : " ";
      lines.push(`- [${done}] **${q.question}**`);
      lines.push(`  - *Testing:* ${q.testing}`);
      lines.push(`  - *Skeleton:*`);
      for (const s of q.skeleton) {
        lines.push(`    - ${s}`);
      }
      const note = notes[q.id];
      if (note && note.trim()) {
        lines.push(`  - *My notes:* ${note.trim()}`);
      }
      lines.push("");
    }
  }

  lines.push("## Questions to ask them");
  lines.push("");
  for (const q of pack.askThem) {
    lines.push(`- ${q}`);
  }
  lines.push("");

  return lines.join("\n");
}
