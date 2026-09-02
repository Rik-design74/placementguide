import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateRequestSchema, llmPackSchema, withQuestionIds } from "@/lib/validation";
import { getAnthropicClient, GENERATION_MODEL, stripCodeFences } from "@/lib/anthropic";
import { SYSTEM_PROMPT, buildUserPrompt, RETRY_INSTRUCTION } from "@/lib/prompt";
import { TRACK_LABELS } from "@/lib/types";
import { IS_LOCAL_MODE } from "@/lib/mode";
import { buildMockPack } from "@/lib/mockPack";
import type { LlmPack } from "@/lib/validation";
import type Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export async function POST(request: Request) {
  // Local mode has no real Supabase project behind it — skip auth, rate
  // limiting, and the DB insert entirely, and hand the generated pack back
  // to the client to save in its own localStorage instead.
  const supabase = IS_LOCAL_MODE ? null : await createClient();

  let userId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to generate a prep pack." }, { status: 401 });
    }
    userId = user.id;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsedRequest = generateRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const firstIssue = parsedRequest.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { track, company, jdText, resumeText } = parsedRequest.data;

  if (supabase && userId) {
    try {
      const rateLimit = await checkRateLimit(supabase, userId);
      if (!rateLimit.allowed) {
        if (rateLimit.reason === "user_hourly") {
          return NextResponse.json(
            {
              error:
                "You've hit the limit of 5 prep packs per hour. Take a breather and try again in a bit.",
            },
            { status: 429 },
          );
        }
        return NextResponse.json(
          {
            error:
              "PlacementPrep AI has hit its generation limit for today. Come back tomorrow — your existing packs are safe and ready to practice from.",
          },
          { status: 429 },
        );
      }
    } catch (err) {
      console.error("Rate limit check failed", err);
      return NextResponse.json({ error: "Could not verify rate limits. Please try again." }, { status: 500 });
    }
  }

  let anthropic: Anthropic | null;
  try {
    anthropic = getAnthropicClient();
  } catch {
    anthropic = null;
  }

  let llmPack: LlmPack;

  if (!anthropic) {
    // No ANTHROPIC_API_KEY configured — fall back to a clearly-labeled
    // sample pack so the full generate -> practice -> export flow still
    // works end-to-end with zero external cost/setup. Once a real key is
    // set, this branch is skipped and real generation runs automatically.
    llmPack = buildMockPack({ track, company: company || undefined, jdText, resumeText });
  } else {
    const userPrompt = buildUserPrompt({ track, company: company || undefined, jdText, resumeText });
    const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: userPrompt }];

    let lastRawText = "";
    let parsed: ReturnType<typeof llmPackSchema.safeParse> | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Anthropic.Messages.Message;
      try {
        response = await anthropic.messages.create({
          model: GENERATION_MODEL,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages,
        });
      } catch (err) {
        console.error("Anthropic API call failed", err);
        return NextResponse.json(
          { error: "The AI generation service is temporarily unavailable. Please try again shortly." },
          { status: 502 },
        );
      }

      lastRawText = extractText(response);
      const cleaned = stripCodeFences(lastRawText);

      let json: unknown;
      try {
        json = JSON.parse(cleaned);
      } catch {
        parsed = null;
        messages.push({ role: "assistant", content: lastRawText });
        messages.push({ role: "user", content: RETRY_INSTRUCTION });
        continue;
      }

      const result = llmPackSchema.safeParse(json);
      if (result.success) {
        parsed = result;
        break;
      }

      parsed = result;
      messages.push({ role: "assistant", content: lastRawText });
      messages.push({ role: "user", content: RETRY_INSTRUCTION });
    }

    if (!parsed || !parsed.success) {
      console.error("LLM output failed validation after retry", parsed?.error, lastRawText.slice(0, 2000));
      return NextResponse.json(
        {
          error:
            "The AI returned an unexpected response and we couldn't recover after a retry. Please try generating again.",
        },
        { status: 502 },
      );
    }

    llmPack = parsed.data;
  }

  const pack = withQuestionIds(llmPack);
  const title = `${company ? `${company} — ` : ""}${TRACK_LABELS[track]} Prep`;

  if (!supabase) {
    // Local mode: hand the pack back for the client to save in localStorage.
    return NextResponse.json({ pack, title });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("prep_packs")
    .insert({
      user_id: userId!,
      title,
      company: company || null,
      track,
      jd_text: jdText,
      resume_text: resumeText,
      pack,
      practiced: {},
      notes: {},
      status: "in_progress",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert prep pack", insertError);
    return NextResponse.json({ error: "Generated the pack but failed to save it. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id });
}
