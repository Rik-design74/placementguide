import { z } from "zod";
import { CATEGORY_ORDER, type Question, type QuestionCategory } from "@/lib/types";

export const generateRequestSchema = z.object({
  company: z.string().trim().max(200).optional().or(z.literal("")),
  track: z.enum([
    "marketing",
    "consulting",
    "product",
    "analytics",
    "sales",
    "general_management",
  ]),
  jdText: z.string().trim().min(200, "Job description must be at least 200 characters."),
  resumeText: z.string().trim().min(200, "Resume text must be at least 200 characters."),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

const gapSchema = z.object({
  gap: z.string().min(1),
  handleIt: z.string().min(1),
});

const questionCategorySchema = z.enum([
  "resume",
  "functional",
  "behavioral",
  "curveball",
]);

const rawQuestionSchema = z.object({
  category: questionCategorySchema,
  question: z.string().min(1),
  testing: z.string().min(1),
  skeleton: z.array(z.string().min(1)).min(3).max(5),
});

export const llmPackSchema = z
  .object({
    fitSummary: z.string().min(1),
    gaps: z.array(gapSchema).min(3).max(5),
    questions: z.array(rawQuestionSchema).min(12).max(20),
    askThem: z.array(z.string().min(1)).length(5),
  })
  .superRefine((data, ctx) => {
    const counts = new Map<QuestionCategory, number>();
    for (const q of data.questions) {
      counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
    }
    for (const category of CATEGORY_ORDER) {
      if ((counts.get(category) ?? 0) < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Need at least 3 "${category}" questions, got ${counts.get(category) ?? 0}.`,
          path: ["questions"],
        });
      }
    }
  });

export type LlmPack = z.infer<typeof llmPackSchema>;

/** Assigns stable ids to questions so practiced/notes can key off them. */
export function withQuestionIds(pack: LlmPack): {
  fitSummary: string;
  gaps: LlmPack["gaps"];
  questions: Question[];
  askThem: string[];
} {
  const counters: Partial<Record<QuestionCategory, number>> = {};
  const questions: Question[] = pack.questions.map((q) => {
    const n = (counters[q.category] ?? 0) + 1;
    counters[q.category] = n;
    return { id: `${q.category}-${n}`, ...q };
  });
  return { ...pack, questions };
}

export const patchPackSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    status: z.enum(["in_progress", "interview_ready"]).optional(),
    practiced: z.record(z.string(), z.boolean()).optional(),
    notes: z.record(z.string(), z.string().max(5000)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });
