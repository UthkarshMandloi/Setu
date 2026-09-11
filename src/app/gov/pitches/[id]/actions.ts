"use server";

import { prisma } from "@/lib/prisma";
import { requireOfficer } from "@/lib/officer";
import { revalidatePath } from "next/cache";

// Officers may only decide on pitches for their own department's problems, and only while still open.
async function loadDecidablePitch(pitchId: string) {
  const officer = await requireOfficer();
  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    include: { problem: { select: { departmentId: true } }, pilot: { select: { id: true } } },
  });
  if (!pitch || pitch.problem.departmentId !== officer.departmentId) throw new Error("Unauthorized");
  if (!["SUBMITTED", "SHORTLISTED"].includes(pitch.status) || pitch.pilot) {
    throw new Error("This pitch has already been decided");
  }
  return { officer, pitch };
}

export async function selectPitch(pitchId: string, problemId: string) {
  const { officer, pitch } = await loadDecidablePitch(pitchId);

  await prisma.pitch.update({
    where: { id: pitchId },
    data: { status: "SELECTED" }
  });

  await prisma.pilot.create({
    data: {
      pitchId: pitchId,
      departmentId: pitch.problem.departmentId,
      status: "DRAFT"
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "PITCH_SELECTED",
      entityType: "Pitch",
      entityId: pitchId,
      actorId: officer.id,
      details: `Selected for problem: ${problemId}`
    }
  });

  revalidatePath("/gov/pitches");
}

export async function rejectPitch(pitchId: string) {
  const { officer } = await loadDecidablePitch(pitchId);

  await prisma.pitch.update({
    where: { id: pitchId },
    data: { status: "REJECTED" }
  });

  await prisma.auditLog.create({
    data: {
      action: "PITCH_REJECTED",
      entityType: "Pitch",
      entityId: pitchId,
      actorId: officer.id
    }
  });

  revalidatePath("/gov/pitches");
}
