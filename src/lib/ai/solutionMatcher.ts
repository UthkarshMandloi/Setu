import { generateJson } from "./gemini";

// Finds proven solutions (Solution Passports) whose ORIGINAL problem is closest to a newly described
// one, and what would need to change to reuse them. Eligibility (badge, IP route) is decided by the
// platform, not the model — see app/marketplace/actions.ts.

export type PassportCandidate = {
  id: string;
  title: string;
  summary: string;
  problemTitle: string;
  problemDescription: string;
  problemScope: string | null;
  expectedOutcomes: string | null;
  theme: string | null;
  originDepartment: string;
  originState: string | null;
  sector: string | null;
  kpis: { metric: string; target: number; unit: string; actual: number | null }[];
  trustBadge: string;
  impactScore: number;
  ipStatus: string;
};

export type Modification = { change: string; effort: "LOW" | "MEDIUM" | "HIGH" };

export type SolutionMatch = {
  passportId: string;
  similarity: number;
  fit: "DIRECT" | "ADAPT";
  whyItMatches: string;
  gaps: string[];
  modifications: Modification[];
};

export type MatchResult = { understanding: string; matches: SolutionMatch[]; simulated: boolean };

// Beyond this many passports, only the keyword-closest are sent to the model.
const SHORTLIST_SIZE = 12;
const MIN_SIMILARITY = 30;

const SYSTEM_PROMPT = `You are the Solution-Reuse Advisor on PilotSetu, a Government of Maharashtra platform. Government departments pilot startup solutions; each successful pilot becomes a "Solution Passport" with measured KPI results that other departments can adopt without a fresh procurement round.

A user describes a NEW problem (possibly in Hindi, Marathi or mixed English). You receive candidate passports. For each candidate, judge how well that proven solution could solve the new problem.

RULES
- similarity (0-100) measures how close the candidate's ORIGINAL problem and context are to the new problem: domain, affected users, workflow, scale, data and constraints. Shared words alone are not similarity.
- fit: "DIRECT" only if the solution could be deployed for the new problem with configuration alone; "ADAPT" if concrete modifications would close the gap; "NOT_SUITABLE" otherwise.
- whyItMatches: 1-2 sentences naming the concrete overlap.
- gaps: up to 4 differences that matter (language, integration with other state systems, geography, scale, regulation, data availability, users).
- modifications: up to 5 concrete changes specific to THIS solution that would make it fit the new problem, each with effort LOW, MEDIUM or HIGH. Example: "Retrain the pothole detection model on Nashik district road imagery" (MEDIUM).
- Never invent capabilities the candidate does not describe. Do not judge trust badge or IP — the platform handles eligibility.
- Write in English. Rank matches by similarity, highest first.

OUTPUT only JSON:
{"understanding":"<one sentence restating the new problem>","matches":[{"candidate":"S1","similarity":0,"fit":"DIRECT","whyItMatches":"","gaps":[""],"modifications":[{"change":"","effort":"LOW"}]}]}`;

export async function matchSolutions(query: string, candidates: PassportCandidate[]): Promise<MatchResult> {
  const shortlist =
    candidates.length <= SHORTLIST_SIZE
      ? candidates
      : scoreByKeywords(query, candidates).slice(0, SHORTLIST_SIZE).map((s) => s.candidate);
  if (!shortlist.length) return { understanding: "", matches: [], simulated: false };

  // Short keys keep the prompt compact and stop the model echoing database ids.
  const keyed = shortlist.map((candidate, i) => ({ key: `S${i + 1}`, candidate }));
  const raw = await generateJson<any>(SYSTEM_PROMPT, buildPrompt(query, keyed));

  if (raw && Array.isArray(raw.matches)) {
    const idByKey = new Map(keyed.map((k) => [k.key, k.candidate.id]));
    const seen = new Set<string>();
    const matches = raw.matches
      .flatMap((m: any): SolutionMatch[] => {
        const passportId = idByKey.get(String(m?.candidate));
        const similarity = Math.round(Number(m?.similarity));
        if (!passportId || seen.has(passportId) || !Number.isFinite(similarity) || similarity < MIN_SIMILARITY) return [];
        if (m.fit !== "DIRECT" && m.fit !== "ADAPT") return [];
        seen.add(passportId);
        return [{
          passportId,
          similarity: Math.min(100, similarity),
          fit: m.fit,
          whyItMatches: asText(m.whyItMatches),
          gaps: asStrings(m.gaps).slice(0, 4),
          modifications: asModifications(m.modifications),
        }];
      })
      .sort((a: SolutionMatch, b: SolutionMatch) => b.similarity - a.similarity);
    return { understanding: asText(raw.understanding), matches, simulated: false };
  }

  return keywordFallback(query, shortlist);
}

function buildPrompt(query: string, keyed: { key: string; candidate: PassportCandidate }[]): string {
  const blocks = keyed.map(({ key, candidate: c }) => {
    const kpis = c.kpis
      .map((k) => `${k.metric}: target ${k.target} ${k.unit}${k.actual !== null ? `, achieved ${k.actual} ${k.unit}` : ""}`)
      .join("; ");
    return [
      `[${key}] Solution: ${c.title}`,
      `What it does: ${truncate(c.summary, 400)}`,
      `Piloted by: ${c.originDepartment}${c.originState ? `, ${c.originState}` : ""} | Startup sector: ${c.sector ?? "n/a"} | Theme: ${c.theme ?? "n/a"}`,
      `Original problem: ${c.problemTitle} — ${truncate(c.problemDescription, 600)}`,
      c.problemScope ? `Original requirements: ${truncate(c.problemScope, 300)}` : "",
      kpis ? `Measured KPIs: ${kpis}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `New problem described by the user:\n"""\n${query}\n"""\n\nCandidate proven solutions:\n\n${blocks.join("\n\n")}`;
}

// ---------- Keyword scoring (shortlist + offline fallback) ----------

const STOPWORDS = new Set(
  "a an the and or of to in for on with by from is are be been this that it its as at we our they their there which who how what when need needs want wants system systems solution solutions problem problems department departments government citizens citizen use using used based across more less than into per also very can will should must about over under".split(" ")
);

const stem = (t: string) => t.slice(0, 6);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function candidateText(c: PassportCandidate): string {
  return [c.title, c.summary, c.problemTitle, c.problemDescription, c.problemScope, c.expectedOutcomes, c.theme, c.sector, ...c.kpis.map((k) => k.metric)]
    .filter(Boolean)
    .join(" ");
}

function scoreByKeywords(query: string, candidates: PassportCandidate[]) {
  const queryStems = Array.from(new Set(tokens(query).map(stem)));
  const docs = candidates.map((c) => {
    const words = tokens(candidateText(c));
    return { candidate: c, words, stems: new Set(words.map(stem)) };
  });
  // Rarer shared terms count for more (inverse document frequency).
  const idf = (s: string) => Math.log(1 + docs.length / (1 + docs.filter((d) => d.stems.has(s)).length));
  const totalWeight = queryStems.reduce((sum, s) => sum + idf(s), 0) || 1;

  return docs
    .map(({ candidate, words, stems }) => {
      const sharedStems = queryStems.filter((s) => stems.has(s));
      const score = sharedStems.reduce((sum, s) => sum + idf(s), 0) / totalWeight;
      const shared = Array.from(new Set(words.filter((w) => sharedStems.includes(stem(w)))));
      return { candidate, score, shared };
    })
    .sort((a, b) => b.score - a.score);
}

function keywordFallback(query: string, candidates: PassportCandidate[]): MatchResult {
  const scored = scoreByKeywords(query, candidates).filter((s) => s.score >= 0.1).slice(0, 5);
  return {
    understanding: "",
    simulated: true,
    matches: scored.map(({ candidate, score, shared }) => ({
      passportId: candidate.id,
      similarity: Math.min(90, Math.round(MIN_SIMILARITY + score * 60)),
      fit: "ADAPT",
      whyItMatches: shared.length
        ? `Both problems involve ${shared.slice(0, 4).join(", ")}.`
        : "The problems are in a related domain.",
      gaps: ["Estimated from shared keywords only — the AI assistant was unavailable, so review the fit manually."],
      modifications: [
        { change: "Re-baseline the KPI targets for your department's scale and region", effort: "LOW" },
        { change: "Integrate with your department's existing records and workflows", effort: "MEDIUM" },
        { change: "Confirm language and accessibility needs (e.g. a Marathi interface) with the startup", effort: "LOW" },
      ],
    })),
  };
}

// ---------- Output normalisation ----------

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

function asModifications(value: unknown): Modification[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((m: any): Modification[] => {
      const change = typeof m?.change === "string" ? m.change.trim() : typeof m === "string" ? m.trim() : "";
      if (!change) return [];
      const effort = m?.effort === "LOW" || m?.effort === "HIGH" ? m.effort : "MEDIUM";
      return [{ change, effort }];
    })
    .slice(0, 5);
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
