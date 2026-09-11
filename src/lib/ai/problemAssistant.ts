import { generateJson } from "./gemini";
import {
  BUDGET_BANDS,
  MAX_CLARIFY_ROUNDS,
  THEMES,
  type AssistantResult,
  type ClarifyRound,
  type KpiSuggestion,
  type ProblemDraft,
} from "@/lib/problemFields";

const SYSTEM_PROMPT = `You are the Problem-Framing Assistant on Setu, a Government of Maharashtra platform where government departments publish problems and verified startups pitch solutions.

A government officer describes a problem in plain words (possibly Hindi, Marathi or mixed with English). Turn it into a clear, solution-neutral problem statement that startups can pitch against.

A credible statement needs:
1. What is going wrong and who is affected
2. How it is handled today and why that fails
3. Where and at what scale (districts, users, volumes)
4. What success looks like, ideally measurable
5. Constraints: budget, timeline, existing systems to integrate with, data, language, connectivity

DECIDE
- If 2 or more of these are missing or too vague to write a credible statement, ask clarifying questions: 2 to 4 short, specific questions in simple English that a busy officer can answer in one line each. Never ask about something already answered. Never ask more than 4.
- Otherwise, write the draft.

WHEN DRAFTING
- Write in English, in a formal government-document tone. No marketing language.
- Stay solution-neutral: describe the problem and requirements; do not prescribe a specific technology or vendor.
- Use only facts the officer gave. If you must fill a gap (for example a number), list it in "assumptions" and phrase it cautiously in the text ("approximately", "to be confirmed").
- title: at most 12 words, specific. Do not start with "AI-based" unless the officer asked for AI.
- description: 150-250 words in 3 short paragraphs separated by a blank line: (1) context and who is affected, (2) current process and pain points, (3) scale and why it matters now.
- scope: 4-7 lines, each starting with "- ", listing functional and technical requirements (integrations, data sources, Marathi/English language support, offline or low-bandwidth use, accessibility, data privacy under Indian law).
- expectedOutcomes: 3-5 lines, each starting with "- ", measurable where possible.
- constraints: 2-5 lines, each starting with "- ".
- targetBeneficiaries: one sentence.
- suggestedKpis: 2-4 KPIs, each with a numeric target, a short unit, and direction HIGHER_IS_BETTER or LOWER_IS_BETTER (use LOWER_IS_BETTER for time, cost and error rates).
- theme: exactly one of ${JSON.stringify(THEMES)}.
- budgetBand: exactly one of ${JSON.stringify(BUDGET_BANDS.map((b) => b.value))}.
- timelineWeeks: a realistic pilot length between 4 and 52.

OUTPUT only a JSON object, in one of these two shapes:
{"kind":"questions","understanding":"<1-2 sentences restating what you understood>","questions":["..."]}
{"kind":"draft","draft":{"title":"","theme":"","description":"","scope":"","expectedOutcomes":"","constraints":"","targetBeneficiaries":"","budgetBand":"","timelineWeeks":12,"suggestedKpis":[{"metric":"","target":0,"unit":"","direction":"HIGHER_IS_BETTER"}],"assumptions":[""]}}`;

type AssistantInput = {
  brief: string;
  rounds: ClarifyRound[];
  forceDraft: boolean;
  department: { name: string; state: string | null };
};

export async function runProblemAssistant(input: AssistantInput): Promise<AssistantResult> {
  const mustDraft = input.forceDraft || input.rounds.length >= MAX_CLARIFY_ROUNDS;
  const raw = await generateJson<any>(SYSTEM_PROMPT, buildPrompt(input, mustDraft));

  if (raw?.kind === "questions" && !mustDraft) {
    const questions = asStringArray(raw.questions).slice(0, 4);
    if (questions.length) {
      return { kind: "questions", understanding: asText(raw.understanding), questions, simulated: false };
    }
  }
  if (raw?.kind === "draft" && raw.draft) {
    const draft = normaliseDraft(raw.draft);
    if (draft.title && draft.description) return { kind: "draft", draft, simulated: false };
  }

  return mockResult(input, mustDraft);
}

function buildPrompt(input: AssistantInput, mustDraft: boolean): string {
  const transcript = input.rounds
    .map((round, r) =>
      round.questions
        .map((q, i) => `Q${r + 1}.${i + 1}: ${q}\nA: ${round.answers[i]?.trim() || "(officer skipped this question)"}`)
        .join("\n")
    )
    .join("\n\n");

  return [
    `Department: ${input.department.name}${input.department.state ? `, ${input.department.state}` : ""}`,
    `Officer's description:\n"""\n${input.brief}\n"""`,
    transcript ? `Clarifications so far:\n${transcript}` : "No clarifying questions have been asked yet.",
    mustDraft
      ? `You MUST return kind "draft" now. Record any remaining gaps in "assumptions".`
      : `Clarification rounds used: ${input.rounds.length} of ${MAX_CLARIFY_ROUNDS}. Decide whether to ask or to draft.`,
  ].join("\n\n");
}

function normaliseDraft(d: any): ProblemDraft {
  const themes: readonly string[] = THEMES;
  const bands: string[] = BUDGET_BANDS.map((b) => b.value);
  const weeks = Math.round(Number(d.timelineWeeks));
  return {
    title: asText(d.title).slice(0, 200),
    theme: themes.includes(d.theme) ? d.theme : "e-Governance",
    description: asText(d.description),
    scope: asText(d.scope),
    expectedOutcomes: asText(d.expectedOutcomes),
    constraints: asText(d.constraints),
    targetBeneficiaries: asText(d.targetBeneficiaries),
    budgetBand: bands.includes(d.budgetBand) ? d.budgetBand : "INR 10L - 25L",
    timelineWeeks: Number.isFinite(weeks) ? Math.min(52, Math.max(4, weeks)) : 12,
    suggestedKpis: normaliseKpis(d.suggestedKpis),
    assumptions: asStringArray(d.assumptions),
  };
}

function normaliseKpis(value: unknown): KpiSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((k: any): KpiSuggestion[] => {
      const metric = typeof k?.metric === "string" ? k.metric.trim() : "";
      const target = Number(k?.target);
      if (!metric || !Number.isFinite(target)) return [];
      return [{
        metric,
        target,
        unit: typeof k.unit === "string" ? k.unit.trim() : "",
        direction: k.direction === "LOWER_IS_BETTER" ? "LOWER_IS_BETTER" : "HIGHER_IS_BETTER",
      }];
    })
    .slice(0, 6);
}

// Models sometimes return a list where we asked for "- " lines; accept both.
function asText(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => `- ${String(v).replace(/^\s*[-•*]\s*/, "")}`).join("\n");
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

// Canned response used when GEMINI_API_KEY is missing or the call fails, so the demo never dead-ends.
function mockResult(input: AssistantInput, mustDraft: boolean): AssistantResult {
  const wordCount = input.brief.trim().split(/\s+/).length;
  if (!mustDraft && input.rounds.length === 0 && wordCount < 40) {
    return {
      kind: "questions",
      simulated: true,
      understanding: `You want help with: "${truncate(input.brief, 140)}"`,
      questions: [
        "Where does this happen, and roughly how many people or cases are affected each month?",
        "How is this handled today, and what goes wrong with that process?",
        "What result would make you call a pilot successful? A number helps (e.g. cut delay from 30 days to 7).",
      ],
    };
  }

  const answers = input.rounds.flatMap((r) => r.answers).map((a) => a.trim()).filter(Boolean);
  const firstSentence = input.brief.split(/[.!?\n]/)[0] ?? input.brief;
  return {
    kind: "draft",
    simulated: true,
    draft: {
      title: firstSentence.trim().split(/\s+/).slice(0, 12).join(" "),
      theme: "e-Governance",
      description: [input.brief.trim(), ...answers].join("\n\n"),
      scope: [
        "- Must be usable by department staff with minimal training",
        "- Must support Marathi and English",
        "- Must integrate with existing department records where applicable",
        "- Data must be stored in India and handled as per applicable data-protection law",
      ].join("\n"),
      expectedOutcomes: [
        "- Measurable reduction in processing time",
        "- Improved accuracy and transparency for citizens",
        "- Solution ready to scale to other districts",
      ].join("\n"),
      constraints: "- Pilot cost within the selected budget band\n- Pilot to finish within the proposed duration",
      targetBeneficiaries: `Citizens and staff served by the ${input.department.name}.`,
      budgetBand: "INR 10L - 25L",
      timelineWeeks: 12,
      suggestedKpis: [
        { metric: "Average processing time", target: 7, unit: "days", direction: "LOWER_IS_BETTER" },
        { metric: "Cases handled through the new solution", target: 1000, unit: "cases", direction: "HIGHER_IS_BETTER" },
      ],
      assumptions: [
        "The AI assistant was unavailable, so this draft was assembled from your own text using a template. Review and rewrite every field before publishing.",
      ],
    },
  };
}

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
