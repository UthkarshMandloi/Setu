import { Prisma } from "@prisma/client";
import type { KpiSuggestion } from "@/lib/problemFields";

// Officer-entered problem fields, shared by the create and edit flows.
export type ProblemInput = {
  title: string;
  description: string;
  theme: string;
  budgetBand: string;
  deadline: string;
  pilotDurationWeeks: number | null;
  expectedOutcomes: string;
  scope: string;
  constraints: string;
  targetBeneficiaries: string;
  suggestedKpis: KpiSuggestion[];
  originalBrief: string;
  aiAssisted: boolean;
};

export function parseProblemInput(input: ProblemInput) {
  const title = input.title?.trim();
  const description = input.description?.trim();
  if (!title || !description) {
    return { ok: false as const, error: "Title and technical description are required." };
  }

  const deadline = input.deadline ? new Date(input.deadline) : null;
  if (deadline && Number.isNaN(deadline.getTime())) {
    return { ok: false as const, error: "Deadline is not a valid date." };
  }

  const weeks = Number(input.pilotDurationWeeks);
  const kpis: KpiSuggestion[] = (input.suggestedKpis ?? [])
    .filter((k) => k.metric?.trim() && Number.isFinite(Number(k.target)))
    .slice(0, 6)
    .map((k) => ({
      metric: k.metric.trim(),
      target: Number(k.target),
      unit: k.unit?.trim() ?? "",
      direction: k.direction === "LOWER_IS_BETTER" ? "LOWER_IS_BETTER" : "HIGHER_IS_BETTER",
    }));
  const optional = (value: string | undefined) => value?.trim() || null;

  return {
    ok: true as const,
    data: {
      title: title.slice(0, 200),
      description,
      theme: optional(input.theme),
      budgetBand: optional(input.budgetBand),
      deadline,
      pilotDurationWeeks: Number.isInteger(weeks) && weeks > 0 && weeks <= 104 ? weeks : null,
      expectedOutcomes: optional(input.expectedOutcomes),
      scope: optional(input.scope),
      constraints: optional(input.constraints),
      targetBeneficiaries: optional(input.targetBeneficiaries),
      suggestedKpis: kpis.length ? kpis : Prisma.DbNull,
      originalBrief: optional(input.originalBrief),
      aiAssisted: !!input.aiAssisted,
    },
  };
}

export function dbErrorMessage(err: unknown): string {
  // A dev server started before the last migration keeps the old Prisma client in memory.
  if (err instanceof Error && err.message.includes("Unknown argument")) {
    return "The server is running an outdated database client. Restart the dev server (Ctrl+C, then npm run dev) and try again.";
  }
  return "The database rejected this change. Please try again — if it keeps failing, check the server log.";
}
