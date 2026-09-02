export type QuestionCategory =
  | "resume"
  | "functional"
  | "behavioral"
  | "curveball";

export interface Gap {
  gap: string;
  handleIt: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  question: string;
  testing: string;
  skeleton: string[];
}

export interface Pack {
  fitSummary: string;
  gaps: Gap[];
  questions: Question[];
  askThem: string[];
}

export type Track =
  | "marketing"
  | "consulting"
  | "product"
  | "analytics"
  | "sales"
  | "general_management";

export const TRACKS: { value: Track; label: string }[] = [
  { value: "marketing", label: "Marketing / Brand" },
  { value: "consulting", label: "Consulting" },
  { value: "product", label: "Product" },
  { value: "analytics", label: "Analytics / Data" },
  { value: "sales", label: "Sales / BD" },
  { value: "general_management", label: "General Management" },
];

export const TRACK_LABELS: Record<Track, string> = Object.fromEntries(
  TRACKS.map((t) => [t.value, t.label]),
) as Record<Track, string>;

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  resume: "Resume deep-dive",
  functional: "Functional / role fit",
  behavioral: "Behavioral",
  curveball: "Curveball",
};

export const CATEGORY_ORDER: QuestionCategory[] = [
  "resume",
  "functional",
  "behavioral",
  "curveball",
];

export type PackStatus = "in_progress" | "interview_ready";

export const INTERVIEW_READY_THRESHOLD = 70;
