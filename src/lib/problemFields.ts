// Shared between the Post Problem UI (client) and the AI problem assistant (server).

export const THEMES = [
  "e-Governance",
  "Smart Cities",
  "Healthcare",
  "Agriculture",
  "Infrastructure",
  "Education",
  "Environment",
  "Transport",
  "Water & Sanitation",
  "Public Safety",
] as const;

export const BUDGET_BANDS = [
  { value: "INR < 10L", label: "Less than ₹10 Lakhs" },
  { value: "INR 10L - 25L", label: "₹10L – ₹25L" },
  { value: "INR 25L - 50L", label: "₹25L – ₹50L" },
  { value: "INR 50L+", label: "More than ₹50L" },
] as const;

export const MAX_CLARIFY_ROUNDS = 2;

export type KpiDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export type KpiSuggestion = {
  metric: string;
  target: number;
  unit: string;
  direction: KpiDirection;
};

export type ProblemDraft = {
  title: string;
  theme: string;
  description: string;
  scope: string;
  expectedOutcomes: string;
  constraints: string;
  targetBeneficiaries: string;
  budgetBand: string;
  timelineWeeks: number;
  suggestedKpis: KpiSuggestion[];
  assumptions: string[];
};

export type ClarifyRound = { questions: string[]; answers: string[] };

export type AssistantResult =
  | { kind: "questions"; understanding: string; questions: string[]; simulated: boolean }
  | { kind: "draft"; draft: ProblemDraft; simulated: boolean };

export function emptyDraft(): ProblemDraft {
  return {
    title: "",
    theme: "e-Governance",
    description: "",
    scope: "",
    expectedOutcomes: "",
    constraints: "",
    targetBeneficiaries: "",
    budgetBand: "INR 10L - 25L",
    timelineWeeks: 12,
    suggestedKpis: [],
    assumptions: [],
  };
}

/** Human-readable problem statement ID, e.g. PS-0017. */
export function psCode(psNumber: number): string {
  return `PS-${String(psNumber).padStart(4, "0")}`;
}

/** Splits "- a\n- b" style text into clean display lines. */
export function toLines(text: string | null | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}
