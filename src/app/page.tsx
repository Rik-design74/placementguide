import Link from "next/link";

const SAMPLE_QUESTIONS = [
  "Walk me through your resume — what was your specific role versus the team's?",
  "What do you think this role actually needs in the first 90 days?",
  "Tell me about a time you disagreed with your manager's decision.",
  "If we had to cut this budget by 30% tomorrow, what's the first thing you'd protect?",
];

export default function LandingPage() {
  return (
    <div>
      <section className="grain-bg border-b border-line">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center rounded-full bg-gold-soft text-ink-soft px-3 py-1 text-xs font-semibold mb-6">
            Built for MBA placement season
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-tight max-w-3xl mx-auto">
            Stop prepping generically.
            <br />
            Prep for <span className="text-gold">this</span> interview.
          </h1>
          <p className="text-ink-soft text-lg mt-5 max-w-xl mx-auto">
            Paste the job description and your resume, pick a role track, and get a saved
            prep pack — fit summary, gaps, 15 tailored questions with answer skeletons, and
            what to ask them.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-md border border-line font-semibold text-ink hover:bg-white transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-semibold text-ink text-center mb-8">
          A sample pack, so you know what you'll get
        </h2>
        <div className="relative rounded-xl border border-line bg-paper-raised p-6 sm:p-8 overflow-hidden">
          <div className="blur-sm select-none pointer-events-none space-y-5">
            <div>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">Fit summary</p>
              <p className="text-ink-soft leading-relaxed">
                For the Marketing / Brand role at Nestlé, your resume suggests relevant groundwork
                in consumer research and campaign execution worth stating plainly rather than
                assuming the interviewer connects the dots...
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">Sample questions</p>
              <ul className="space-y-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <li key={q} className="rounded-lg border border-line bg-paper px-4 py-3 text-ink text-sm">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-paper-raised/40">
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-md bg-ink text-paper font-semibold hover:bg-ink-soft transition-colors shadow-lg"
            >
              Sign up to generate your own
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              title: "Resume-specific questions",
              body: "Not generic prompts — questions that reference your actual companies, projects, and numbers.",
            },
            {
              title: "STAR-structured skeletons",
              body: "Every behavioral question comes with a 3-5 bullet structure so you're not improvising the shape of your answer.",
            },
            {
              title: "Track your practice",
              body: "Check off what you've practiced, jot notes per question, and mark a pack interview-ready once you've covered enough ground.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-paper-raised p-6">
              <h3 className="font-display text-lg font-semibold text-ink mb-2">{f.title}</h3>
              <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
