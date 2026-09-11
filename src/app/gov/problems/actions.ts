"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOfficer } from "@/lib/officer";
import { dbErrorMessage, parseProblemInput, type ProblemInput } from "@/lib/problemInput";

// Problem lifecycle: DRAFT (dept-only, editable) → PUBLISHED (visible to startups, locked) → CLOSED (no new pitches).

type Result = { ok: true } | { ok: false; error: string };

const NOT_FOUND = { ok: false as const, error: "Problem not found, or it belongs to another department." };

async function loadOwnedProblem(problemId: string) {
  const user = await requireOfficer();
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { _count: { select: { pitches: true } } },
  });
  const owned = problem && user.departmentId && problem.departmentId === user.departmentId ? problem : null;
  return { user, problem: owned };
}

async function recordAndRefresh(problemId: string, action: string, actorId: string, details?: string) {
  await prisma.auditLog.create({ data: { action, entityType: "Problem", entityId: problemId, actorId, details } });
  revalidatePath("/gov/problems");
  revalidatePath("/problems");
  revalidatePath(`/problems/${problemId}`);
}

async function transition(
  problemId: string,
  from: string,
  to: string,
  action: string,
  guard?: (pitchCount: number) => string | null
): Promise<Result> {
  const { user, problem } = await loadOwnedProblem(problemId);
  if (!problem) return NOT_FOUND;
  if (problem.status !== from) return { ok: false, error: `Only ${from.toLowerCase()} problems can do this (this one is ${problem.status.toLowerCase()}).` };
  const blocked = guard?.(problem._count.pitches);
  if (blocked) return { ok: false, error: blocked };

  await prisma.problem.update({ where: { id: problemId }, data: { status: to } });
  await recordAndRefresh(problemId, action, user.id);
  return { ok: true };
}

export async function publishProblem(problemId: string): Promise<Result> {
  return transition(problemId, "DRAFT", "PUBLISHED", "PROBLEM_PUBLISHED");
}

export async function closeProblem(problemId: string): Promise<Result> {
  return transition(problemId, "PUBLISHED", "CLOSED", "PROBLEM_CLOSED");
}

export async function revertProblemToDraft(problemId: string): Promise<Result> {
  return transition(problemId, "PUBLISHED", "DRAFT", "PROBLEM_UNPUBLISHED", (pitches) =>
    pitches > 0 ? "Startups have already pitched against this problem, so it can't go back to draft. Close it instead." : null
  );
}

export async function deleteProblem(problemId: string): Promise<Result> {
  const { user, problem } = await loadOwnedProblem(problemId);
  if (!problem) return NOT_FOUND;
  if (problem.status !== "DRAFT" || problem._count.pitches > 0) {
    return { ok: false, error: "Only drafts without pitches can be deleted. Close a published problem instead." };
  }

  await prisma.problem.delete({ where: { id: problemId } });
  // The problem row is gone, so keep its title in the audit trail.
  await recordAndRefresh(problemId, "PROBLEM_DELETED", user.id, `Deleted draft: ${problem.title}`);
  return { ok: true };
}

export async function updateProblem(
  problemId: string,
  input: ProblemInput,
  status: "DRAFT" | "PUBLISHED"
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { user, problem } = await loadOwnedProblem(problemId);
  if (!problem) return NOT_FOUND;
  if (problem.status !== "DRAFT") {
    return { ok: false, error: "Only drafts can be edited. Published problems are locked so every startup pitches against the same statement." };
  }

  const parsed = parseProblemInput(input);
  if (!parsed.ok) return parsed;
  const finalStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  try {
    await prisma.problem.update({ where: { id: problemId }, data: { ...parsed.data, status: finalStatus } });
  } catch (err) {
    console.error("updateProblem failed:", err);
    return { ok: false, error: dbErrorMessage(err) };
  }

  await recordAndRefresh(problemId, finalStatus === "PUBLISHED" ? "PROBLEM_PUBLISHED" : "PROBLEM_UPDATED", user.id);
  return { ok: true, id: problemId };
}
