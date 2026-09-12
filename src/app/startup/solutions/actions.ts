"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getStartupProfile } from "@/lib/startup";
import type { SolutionDraft } from "@/lib/solutionFields";

type Result = { ok: true; id: string } | { ok: false; error: string };

function parseInput(input: SolutionDraft) {
  const title = input.title?.trim();
  const description = input.description?.trim();
  const problemSolved = input.problemSolved?.trim();
  if (!title || !description || !problemSolved) {
    return { ok: false as const, error: "Title, description and the problem it solves are required." };
  }
  const optional = (v: string | undefined) => v?.trim() || null;
  return {
    ok: true as const,
    data: {
      title: title.slice(0, 200),
      sector: optional(input.sector),
      description,
      problemSolved,
      keyFeatures: optional(input.keyFeatures),
      deploymentProof: optional(input.deploymentProof),
      evidenceUrl: optional(input.evidenceUrl),
    },
  };
}

async function loadOwnedDraft(id: string) {
  const profile = await getStartupProfile();
  if (!profile) throw new Error("Unauthorized");
  const solution = await prisma.startupSolution.findUnique({ where: { id } });
  const owned = solution && solution.startupId === profile.id ? solution : null;
  return { profile, solution: owned };
}

export async function createSolution(input: SolutionDraft, status: "DRAFT" | "PENDING"): Promise<Result> {
  const profile = await getStartupProfile();
  if (!profile) throw new Error("Unauthorized");

  const parsed = parseInput(input);
  if (!parsed.ok) return parsed;

  const solution = await prisma.startupSolution.create({
    data: { ...parsed.data, startupId: profile.id, status },
  });

  if (status === "PENDING") {
    await prisma.auditLog.create({
      data: { action: "SOLUTION_SUBMITTED", entityType: "StartupSolution", entityId: solution.id, actorId: profile.userId },
    });
  }

  revalidatePath("/startup/solutions");
  return { ok: true, id: solution.id };
}

export async function updateSolution(id: string, input: SolutionDraft, status: "DRAFT" | "PENDING"): Promise<Result> {
  const { profile, solution } = await loadOwnedDraft(id);
  if (!solution) return { ok: false, error: "Solution not found." };
  if (!["DRAFT", "REJECTED"].includes(solution.status)) {
    return { ok: false, error: "Only drafts or solutions that need changes can be edited." };
  }

  const parsed = parseInput(input);
  if (!parsed.ok) return parsed;

  await prisma.startupSolution.update({ where: { id }, data: { ...parsed.data, status } });

  if (status === "PENDING") {
    await prisma.auditLog.create({
      data: {
        action: "SOLUTION_SUBMITTED",
        entityType: "StartupSolution",
        entityId: id,
        actorId: profile.userId,
        details: solution.status === "REJECTED" ? "Resubmitted after changes" : undefined,
      },
    });
  }

  revalidatePath("/startup/solutions");
  revalidatePath(`/startup/solutions/${id}/edit`);
  return { ok: true, id };
}

export async function deleteSolution(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { solution } = await loadOwnedDraft(id);
  if (!solution) return { ok: false, error: "Solution not found." };
  if (solution.status !== "DRAFT") return { ok: false, error: "Only drafts can be deleted." };

  await prisma.startupSolution.delete({ where: { id } });
  revalidatePath("/startup/solutions");
  return { ok: true };
}

export async function setSolutionListed(id: string, isListed: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const { solution } = await loadOwnedDraft(id);
  if (!solution) return { ok: false, error: "Solution not found." };
  if (solution.status !== "VERIFIED") return { ok: false, error: "Only verified solutions can be listed or unlisted." };

  await prisma.startupSolution.update({ where: { id }, data: { isListed } });
  revalidatePath("/startup/solutions");
  revalidatePath("/marketplace");
  return { ok: true };
}
