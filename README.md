# PlacementPrep AI

Paste a job description and your resume, pick a role track, and get a saved,
practiceable interview prep pack: a fit summary, the gaps worth naming
upfront, ~15 tailored questions across four categories, and questions to ask
the interviewer back.

Built with Next.js (App Router, TypeScript, Tailwind CSS v4), Supabase
(Postgres + Auth), and the Anthropic API. Deployable on Vercel.

## Table of contents

- [Architecture overview](#architecture-overview)
- [Local setup](#local-setup)
- [Supabase project setup](#supabase-project-setup)
- [Environment variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Test credentials](#test-credentials)
- [Seeding the reviewer account](#seeding-the-reviewer-account)
- [Guardrails](#guardrails)
- [Known issues / trade-offs](#known-issues--trade-offs)

## Architecture overview

```
Browser
  │
  ├─ Server Components (RSC)  ──►  Supabase (Postgres + Auth), via @supabase/ssr
  │     dashboard, /prep/[id], layout/navbar auth state
  │
  ├─ Client Components         ──►  fetch()  ──►  Route Handlers (/api/*)
  │     forms, checkboxes, inline rename, autosave notes
  │
  └─ src/proxy.ts (Next "proxy"/middleware)
        refreshes the Supabase session cookie on every request and
        redirects unauthenticated requests to /dashboard, /prep/* → /login
```

- **Auth**: Supabase email/password auth. `@supabase/ssr` keeps the session
  in cookies so both Server Components and Route Handlers can read the
  current user. `src/proxy.ts` (Next.js 16's middleware-equivalent file
  convention) refreshes the session on every request and gates
  `/dashboard` and `/prep/*`.
- **Database**: a single `prep_packs` table in Supabase Postgres, with Row
  Level Security so a user can only ever read/write their own rows. See
  [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
- **Generation**: `POST /api/generate` (auth-required) builds a prompt from
  the JD, resume, track and company, calls the Anthropic API server-side,
  strictly validates the JSON response with `zod` (retrying once on
  malformed output), assigns stable per-question ids, and inserts the pack.
  The client then redirects to `/prep/[id]`.
- **Editing**: `PATCH /api/packs/[id]` handles title rename, practiced
  checkboxes, per-question notes (all autosaved), and status changes.
  `DELETE /api/packs/[id]` removes a pack permanently.
- **Rate limiting**: no external infra — the per-user hourly limit is a
  count query against the user's own `prep_packs` rows (works fine under
  RLS), and the global daily cap uses a `SECURITY DEFINER` Postgres
  function (`generations_today_count()`) that returns only a count across
  all users, without needing a service-role key on the server. See
  [Guardrails](#guardrails).

Key files:

```
src/
  app/
    page.tsx                landing page
    signup/, login/         auth pages
    dashboard/               "my packs" list
    prep/new/                generation form
    prep/[id]/                pack detail / practice view
    api/generate/route.ts    generation endpoint
    api/packs/[id]/route.ts  PATCH (rename/practiced/notes/status), DELETE
  components/                 NewPrepForm, PrepPackView, QuestionCard, PackCard, ...
  lib/
    supabase/client.ts        browser Supabase client
    supabase/server.ts        server (RSC/route handler) Supabase client
    anthropic.ts               Anthropic client + model id
    prompt.ts                  system/user prompt builders
    validation.ts               zod schemas (request + LLM output)
    rateLimit.ts                per-user + global generation caps
    markdown.ts                 pack → Markdown export
  proxy.ts                    session refresh + route protection
supabase/migrations/0001_init.sql
```

## Local setup

Requires Node 20+.

```bash
cd placementprep-ai
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

Open http://localhost:3000.

To verify a production build locally:

```bash
npm run build
npm run start
```

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. In the SQL Editor, paste and run the contents of
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   It creates the `prep_packs` table, enables Row Level Security with
   per-user policies, an `updated_at` trigger, and the
   `generations_today_count()` function used for the daily generation cap.
   (If you use the Supabase CLI instead: `supabase link` then
   `supabase db push`.)
3. In **Authentication → Providers**, email/password is enabled by default.
   For quick local/grading use, you may want to turn **Confirm email**
   off (Authentication → Sign In / Providers → Email) so signup logs the
   user in immediately instead of requiring an email click-through — the
   app handles both cases either way (it shows a "check your email"
   message if a session isn't returned).
4. Copy **Project Settings → API → Project URL** and the **anon public**
   key into your env vars below.

The full schema SQL (also in the migration file) for reference:

```sql
create extension if not exists pgcrypto;

create table if not exists public.prep_packs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  company       text,
  track         text not null check (
                  track in (
                    'marketing', 'consulting', 'product',
                    'analytics', 'sales', 'general_management'
                  )
                ),
  jd_text       text not null,
  resume_text   text not null,
  pack          jsonb not null,
  practiced     jsonb not null default '{}'::jsonb,
  notes         jsonb not null default '{}'::jsonb,
  status        text not null default 'in_progress' check (
                  status in ('in_progress', 'interview_ready')
                ),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.prep_packs enable row level security;

create policy "Users can view own packs"   on public.prep_packs for select using (auth.uid() = user_id);
create policy "Users can insert own packs" on public.prep_packs for insert with check (auth.uid() = user_id);
create policy "Users can update own packs" on public.prep_packs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own packs" on public.prep_packs for delete using (auth.uid() = user_id);

-- see the migration file for the updated_at trigger and
-- generations_today_count() RPC used for the global daily cap.
```

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | server only | Anthropic API key, used in `/api/generate`. Never exposed to the client. |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon/public key. Safe to expose — RLS enforces access control. |
| `MAX_DAILY_GENERATIONS` | server only | Global cap on prep-pack generations per UTC day, across all users (e.g. `50`). |

See [`.env.example`](./.env.example).

## Deploying to Vercel

1. Push this repo to GitHub (or another Vercel-supported Git provider).
2. In Vercel, **Add New → Project**, import the repo, and set the project
   root to `placementprep-ai/` if it lives alongside other projects in a
   monorepo.
3. Framework preset: Next.js (auto-detected).
4. Add the four environment variables above under **Settings →
   Environment Variables** (Production, and Preview if you want preview
   deploys to work too).
5. Deploy. Vercel runs `npm run build` automatically.
6. Once deployed, in Supabase go to **Authentication → URL Configuration**
   and add your Vercel deployment URL (and any preview URLs you use) to
   the **Site URL** / **Redirect URLs** allow-list so auth works in
   production.

## Test credentials

For grading/review, use:

- **Email:** `reviewer@placementprep.app`
- **Password:** set when you seed the account (see below) — share this
  separately/privately from this README rather than committing a real
  password to git.

This account should have one pre-generated example pack visible on its
dashboard so a reviewer can open `/prep/[id]` and see a fully populated
pack (practiced checkboxes, notes, progress bar) without needing to spend
an API call.

## Seeding the reviewer account

There's no seed script bundled (Supabase Auth users can't be created via
plain SQL — they need to go through the Auth API), so seed it in two
steps:

1. **Create the user.** Simplest path: use the app itself — go to
   `/signup` on your deployed site with `reviewer@placementprep.app` and a
   password of your choice. If you'd rather not expose signup for this,
   create the user from Supabase Dashboard → Authentication → Users → Add
   user, with "Auto confirm user" checked.
2. **Generate one example pack.** Log in as that user and use `/prep/new`
   to generate a real pack (paste a real JD + resume text) — this both
   proves the end-to-end flow works and gives the reviewer something to
   open immediately. Optionally check a few questions as "practiced" and
   add a note or two so the practice UI has visible state too.

If you'd prefer to insert a pack directly via SQL instead of spending an
API call, you can, once you have the user's `id` from
`auth.users`:

```sql
insert into public.prep_packs (user_id, title, company, track, jd_text, resume_text, pack)
values (
  '<reviewer-user-id>',
  'Hindustan Unilever — Marketing / Brand Prep',
  'Hindustan Unilever',
  'marketing',
  '<paste a JD, at least 200 chars>',
  '<paste resume text, at least 200 chars>',
  '{"fitSummary": "...", "gaps": [...], "questions": [...], "askThem": [...]}'::jsonb
);
```

The `pack` JSON must match the shape described in `src/lib/types.ts`
(`fitSummary`, `gaps[]`, `questions[]` with unique `id`s like
`"resume-1"`, `askThem[]`) for the detail page to render correctly.

## Guardrails

- **Per-user rate limit**: 5 generations per rolling hour, enforced by
  counting the user's own `prep_packs` rows created in the last hour
  (works under RLS since it's their own data).
- **Global daily cap**: `MAX_DAILY_GENERATIONS` per UTC day, across all
  users, enforced via the `generations_today_count()` Postgres function
  (`SECURITY DEFINER`, returns only a count — no row data crosses the RLS
  boundary). When hit, `/api/generate` returns a friendly "come back
  tomorrow" error instead of a raw 500.
- **Input validation**: JD and resume text both require ≥200 characters
  (enforced client-side with live counters, and again server-side with
  zod) before generation is allowed.
- **LLM output validation**: the Anthropic response is parsed as JSON
  (after stripping any ```` ```json ```` fences), validated with zod
  against the exact pack schema (3–5 gaps, 12–20 questions with ≥3 per
  category, 5 "ask them" questions), retried once with a corrective
  follow-up message if invalid, and only then inserted — otherwise the
  API returns a clear error instead of saving malformed data.
- **Privacy**: packs are private to the owning user's account via RLS;
  deleting a pack permanently removes the row (no soft-delete/undo).

## Known issues / trade-offs

- **Rate limiting is DB-based, not a token bucket** — it counts rows in
  `prep_packs`, so a failed generation (e.g. invalid LLM output after
  retry) doesn't count against the limit. This is intentional (don't
  penalize users for model flakiness) but means the "5/hour" limit is
  really "5 successful packs/hour".
- **No service-role key required by design** — the global daily cap uses
  a `SECURITY DEFINER` SQL function instead, which keeps the deployment
  surface smaller (one fewer secret) at the cost of that function being
  Postgres-specific glue rather than app-level logic.
- **Email confirmation UX depends on your Supabase Auth settings** — with
  confirmations on, a new signup won't get a session immediately; the
  signup page detects this and shows a "check your email" message rather
  than silently failing.
- **No automated test suite** — given the assignment scope, correctness
  is covered by TypeScript, zod validation at both the request and LLM-output
  boundaries, and manual verification (`npm run build` + a full click-through
  of signup → generate → practice → delete). A follow-up would add
  integration tests around `/api/generate` and `/api/packs/[id]`.
- **Markdown export and print styles are independent implementations** —
  they're not generated from the same renderer, so if the pack schema
  changes, both `src/lib/markdown.ts` and the print CSS in
  `src/app/globals.css` / `PrepPackView.tsx` need updating together.
