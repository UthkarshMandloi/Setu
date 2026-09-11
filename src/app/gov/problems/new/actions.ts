"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runProblemAssistant } from "@/lib/ai/problemAssistant";
import { requireOfficer } from "@/lib/officer";
import { dbErrorMessage, parseProblemInput, type ProblemInput } from "@/lib/problemInput";
import type { AssistantResult, ClarifyRound } from "@/lib/problemFields";

export async function askProblemAssistant(input: {
  brief: string;
  rounds: ClarifyRound[];
  forceDraft?: boolean;
}): Promise<AssistantResult | { kind: "error"; error: string }> {
  const user = await requireOfficer();

  const brief = (input.brief ?? "").trim();
  if (brief.length < 15) return { kind: "error", error: "Please describe the problem in at least one full sentence." };
  if (brief.length > 6000) return { kind: "error", error: "Please keep the description under 6000 characters." };

  const rounds: ClarifyRound[] = (input.rounds ?? []).slice(0, 3).map((r) => ({
    questions: (r.questions ?? []).slice(0, 4).map((q) => String(q).slice(0, 500)),
    answers: (r.answers ?? []).slice(0, 4).map((a) => String(a ?? "").slice(0, 2000)),
  }));

  return runProblemAssistant({
    brief,
    rounds,
    forceDraft: !!input.forceDraft,
    department: { name: user.department?.name ?? "Government department", state: user.department?.state ?? null },
  });
}

export async function createProblem(
  input: ProblemInput,
  status: "DRAFT" | "PUBLISHED"
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireOfficer();
  if (!user.departmentId) {
    return { ok: false, error: "Your account is not linked to a department, so it cannot post problems." };
  }

  const parsed = parseProblemInput(input);
  if (!parsed.ok) return parsed;
  const finalStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  let problem: { id: string };
  try {
    problem = await prisma.problem.create({
      data: {
        ...parsed.data,
        status: finalStatus,
        sourceType: "OFFICIAL",
        departmentId: user.departmentId,
        authorId: user.id,
      },
    });
  } catch (err) {
    console.error("createProblem failed:", err);
    return { ok: false, error: dbErrorMessage(err) };
  }

  await prisma.auditLog.create({
    data: {
      action: finalStatus === "PUBLISHED" ? "PROBLEM_PUBLISHED" : "PROBLEM_DRAFTED",
      entityType: "Problem",
      entityId: problem.id,
      actorId: user.id,
      details: input.aiAssisted ? "Drafted with the AI problem-framing assistant" : null,
    },
  });

  revalidatePath("/gov/problems");
  revalidatePath("/problems");
  return { ok: true, id: problem.id };
}
