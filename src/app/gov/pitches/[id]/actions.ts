"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";



export async function selectPitch(pitchId: string, problemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  // Update pitch status
  await prisma.pitch.update({
    where: { id: pitchId },
    data: { status: "SELECTED" }
  });

  // Create pilot
  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    include: { problem: true }
  });

  if (pitch) {
    await prisma.pilot.create({
      data: {
        pitchId: pitchId,
        departmentId: pitch.problem.departmentId,
        status: "DRAFT"
      }
    });
  }

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "PITCH_SELECTED",
      entityType: "Pitch",
      entityId: pitchId,
      actorId: (session.user as any).id,
      details: `Selected for problem: ${problemId}`
    }
  });

  revalidatePath("/gov/pitches");
}

export async function rejectPitch(pitchId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await prisma.pitch.update({
    where: { id: pitchId },
    data: { status: "REJECTED" }
  });

  await prisma.auditLog.create({
    data: {
      action: "PITCH_REJECTED",
      entityType: "Pitch",
      entityId: pitchId,
      actorId: (session.user as any).id
    }
  });

  revalidatePath("/gov/pitches");
}
