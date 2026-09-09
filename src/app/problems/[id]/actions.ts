"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function submitPitch(problemId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STARTUP") {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.startupProfile.findUnique({
    where: { userId: (session.user as any).id }
  });

  if (!profile) throw new Error("Startup profile not found");

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
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STARTUP") {
    throw new Error("Unauthorized");
  }

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
