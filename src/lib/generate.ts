// Builds a full prep pack entirely on-device from the pasted JD + resume —
// no API key, no network call. Deterministic and instant, which keeps the
// whole generate -> practice -> export flow demo-able with zero setup.
import {
  CATEGORY_ORDER,
  TRACK_LABELS,
  type Pack,
  type QuestionCategory,
  type Track,
} from "@/lib/types";

export const MIN_CHARS = 200;

function snippet(text: string, max = 140): string {
  const line = text
    .split(/\n|(?<=[.!?])\s/)
    .map((s) => s.trim())
    .find((s) => s.length > 20);
  return (line ?? text.trim()).slice(0, max);
}

export function buildPack(input: {
  track: Track;
  company?: string;
  jdText: string;
  resumeText: string;
}): Pack {
  const trackLabel = TRACK_LABELS[input.track];
  const co = input.company?.trim() || "this company";
  const jdBit = snippet(input.jdText);
  const resumeBit = snippet(input.resumeText);

  const fitSummary =
    `For the ${trackLabel} role at ${co}, your resume points to relevant groundwork worth ` +
    `stating plainly in the interview rather than assuming the interviewer connects the dots. ` +
    `The JD leans on points like "${jdBit}" — be ready to map your own experience to that ` +
    `directly, using specifics rather than restating your resume. Your background around ` +
    `"${resumeBit}" is a natural anchor for that story, so have it ready in under 90 seconds.`;

  const gaps: Pack["gaps"] = [
    {
      gap: `Depth of hands-on ${trackLabel.toLowerCase()} experience relative to what the JD implies.`,
      handleIt:
        "Prepare one or two concrete examples that show direct exposure, even if the scope was smaller than the role calls for.",
    },
    {
      gap: "Quantified impact isn't obvious from a resume line alone.",
      handleIt: "Have 2-3 metrics ready (%, revenue, time saved) for your strongest project before the interview.",
    },
    {
      gap: `Limited visible overlap between "${resumeBit}" and the JD's core ask.`,
      handleIt: "Draw the connection explicitly in your own words instead of leaving the interviewer to infer it.",
    },
    {
      gap: "No clear signal of prior exposure to this specific industry or function.",
      handleIt: "Lead with transferable skills and name one thing you've already done to close that gap (course, project, reading).",
    },
  ];

  const bank: Record<QuestionCategory, { question: string; testing: string; skeleton: string[] }[]> = {
    resume: [
      {
        question: `Walk me through "${resumeBit}" — what was your specific role versus the team's?`,
        testing: "Whether you can separate personal contribution from team output.",
        skeleton: ["Context: team size and your title", "Your specific ownership", "One decision you made unilaterally", "Outcome, quantified if possible"],
      },
      {
        question: "Which line on your resume are you least prepared to defend in detail, and why?",
        testing: "Self-awareness and honesty under scrutiny.",
        skeleton: ["Name the item honestly", "Why it's thinner than it reads", "What you'd say if pressed"],
      },
      {
        question: "Pick the most impressive metric on your resume — how was it actually calculated?",
        testing: "Whether resume numbers survive a follow-up question.",
        skeleton: ["Restate the metric", "Data source and calculation method", "Caveats you'd volunteer proactively"],
      },
      {
        question: "What's a resume bullet you'd write differently today, and how?",
        testing: "Growth and reflective thinking about your own work.",
        skeleton: ["Original bullet", "What you'd change", "What you learned since"],
      },
    ],
    functional: [
      {
        question: `What do you think this ${trackLabel.toLowerCase()} role actually needs in the first 90 days?`,
        testing: "Whether you read the JD closely and formed a real point of view.",
        skeleton: ["Top 1-2 JD requirements you'd prioritize first", "Why those first", "What 'done' looks like at day 90"],
      },
      {
        question: `Which part of ${co}'s current strategy would you push back on, if any?`,
        testing: "Independent thinking versus reflexive agreement.",
        skeleton: ["What you'd question and why", "Evidence or reasoning", "How you'd raise it constructively"],
      },
      {
        question: "How would you prioritize between two equally urgent asks from different stakeholders?",
        testing: "Structured prioritization under real constraints.",
        skeleton: ["Criteria you'd use to compare them", "Who you'd loop in", "What you'd communicate to the deprioritized side"],
      },
      {
        question: "What's a tool, framework, or metric from this domain you'd want to introduce here?",
        testing: "Domain fluency beyond what's on the resume.",
        skeleton: ["What it is, briefly", "Why it fits this specific role", "Risk of introducing it"],
      },
    ],
    behavioral: [
      {
        question: "Tell me about a time you disagreed with your manager's decision.",
        testing: "How you handle authority and disagreement professionally.",
        skeleton: ["Situation", "Task", "Action — how you raised it", "Result and what changed (or didn't)"],
      },
      {
        question: "Describe a time you had to deliver bad news to a stakeholder.",
        testing: "Communication under pressure and ownership of setbacks.",
        skeleton: ["Situation", "Task", "Action — how you framed it", "Result and follow-up"],
      },
      {
        question: "Tell me about a project that failed, and what you did next.",
        testing: "Resilience and honest accountability.",
        skeleton: ["Situation", "Task", "Action — what went wrong and your response", "Result and lesson applied since"],
      },
      {
        question: "Describe a time you had to influence someone without formal authority over them.",
        testing: "Persuasion and cross-functional collaboration.",
        skeleton: ["Situation", "Task", "Action — your approach to influence", "Result"],
      },
    ],
    curveball: [
      {
        question: `If ${co} had to cut its ${trackLabel.toLowerCase()} budget by 30% tomorrow, what's the first thing you'd protect?`,
        testing: "Judgment under constraint, not just optimism.",
        skeleton: ["What you'd protect and why", "What you'd cut first", "Risk you're accepting"],
      },
      {
        question: "Estimate how many people in this city could plausibly be a customer of this company.",
        testing: "Structured estimation under ambiguity.",
        skeleton: ["Stated assumptions", "Breakdown into segments", "Rough final number with sanity check"],
      },
      {
        question: "What would make you quit this role within the first six months?",
        testing: "Self-awareness about fit and honesty about deal-breakers.",
        skeleton: ["Name 1-2 real deal-breakers", "Why those specifically", "What you'd need to see instead"],
      },
      {
        question: `Sell me ${co}'s product in 30 seconds, then argue why a customer shouldn't buy it.`,
        testing: "Balanced thinking and comfort arguing both sides.",
        skeleton: ["30-second pitch", "Strongest counter-argument", "How you'd still close"],
      },
    ],
  };

  const counters: Partial<Record<QuestionCategory, number>> = {};
  const questions: Pack["questions"] = CATEGORY_ORDER.flatMap((category) =>
    bank[category].map((q) => {
      const n = (counters[category] ?? 0) + 1;
      counters[category] = n;
      return { id: `${category}-${n}`, category, ...q };
    }),
  );

  const askThem: Pack["askThem"] = [
    `What does success look like in this ${trackLabel.toLowerCase()} role after the first quarter?`,
    `What's the biggest challenge someone in this seat at ${co} runs into?`,
    "How is performance actually measured here, beyond the job description?",
    "What made the last person in this role succeed or struggle?",
    "What's changed about this team's priorities in the last six months?",
  ];

  return { fitSummary, gaps, questions, askThem };
}
