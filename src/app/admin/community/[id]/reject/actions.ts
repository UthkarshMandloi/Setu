"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function rejectProblem(reportId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await prisma.unregisteredProblem.update({
    where: { id: reportId },
    data: { status: "REJECTED" }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "COMMUNITY_PROBLEM_REJECTED",
      entityType: "UnregisteredProblem",
      entityId: reportId,
      actorId: (session.user as any).id
    }
  });

  revalidatePath("/admin/community");
  redirect("/admin/community");
}