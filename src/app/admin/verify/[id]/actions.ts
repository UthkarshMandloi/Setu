"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function approveStartup(startupId: string, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['GOV_ADMIN', 'PLATFORM_ADMIN'].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await prisma.startupProfile.update({
    where: { id: startupId },
    data: {
      verificationStatus: "VERIFIED",
      eligibilityScore: 100
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "MANUAL_APPROVE",
      entityType: "StartupProfile",
      entityId: startupId,
      actorId: (session.user as any).id,
      details: notes || "Manually approved by admin"
    }
  });

  revalidatePath("/admin/verify");
  redirect("/admin/verify");
}

export async function rejectStartup(startupId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['GOV_ADMIN', 'PLATFORM_ADMIN'].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await prisma.startupProfile.update({
    where: { id: startupId },
    data: {
      verificationStatus: "REJECTED"
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "MANUAL_REJECT",
      entityType: "StartupProfile",
      entityId: startupId,
      actorId: (session.user as any).id,
      details: reason
    }
  });

  revalidatePath("/admin/verify");
  redirect("/admin/verify");
}
