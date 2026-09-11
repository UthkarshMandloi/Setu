"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireStartupProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STARTUP") {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.startupProfile.findUnique({
    where: { userId: (session.user as any).id }
  });

  if (!profile) throw new Error("Startup profile not found");
  return profile;
}

export async function submitPitch(problemId: string, formData: FormData) {
  const profile = await requireStartupProfile();

  // Drafts are private and closed problems no longer accept pitches.
  const problem = await prisma.problem.findUnique({ where: { id: problemId }, select: { status: true } });
  if (problem?.status !== "PUBLISHED") throw new Error("This problem is not accepting pitches");

  const solutionSummary = formData.get("solutionSummary") as string;
  const techReadinessLevel = parseInt(formData.get("trl") as string) || 5;
  const team = formData.get("team") as string;
  const supportingUrl = formData.get("supportingUrl") as string;

  await prisma.pitch.create({
    data: {
      problemId,
      startupId: profile.id,
      solutionSummary,
      techReadinessLevel,
      team,
      supportingUrl,
      status: "SUBMITTED"
    }
  });

  revalidatePath(`/problems/${problemId}`);
}

export async function updatePitch(pitchId: string, formData: FormData) {
  const profile = await requireStartupProfile();

  // Startups may only edit their own pitches.
  const pitch = await prisma.pitch.findUnique({ where: { id: pitchId }, select: { startupId: true } });
  if (!pitch || pitch.startupId !== profile.id) throw new Error("Unauthorized");

  await prisma.pitch.update({
    where: { id: pitchId },
    data: {
      solutionSummary: formData.get("solutionSummary") as string,
      techReadinessLevel: parseInt(formData.get("trl") as string) || 5,
      team: formData.get("team") as string,
      supportingUrl: formData.get("supportingUrl") as string
    }
  });

  revalidatePath(`/problems`);
}
