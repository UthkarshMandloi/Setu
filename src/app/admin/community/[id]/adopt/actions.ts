"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function adoptProblem(data: {
  reportId: string;
  title: string;
  description: string;
  departmentId: string;
  budgetBand?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  // Update the report status
  await prisma.unregisteredProblem.update({
    where: { id: data.reportId },
    data: { status: "ADOPTED" }
  });

  // Create the official problem
  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      description: data.description,
      departmentId: data.departmentId,
      authorId: (session.user as any).id,
      status: "PUBLISHED",
      sourceType: "COMMUNITY",
      budgetBand: data.budgetBand || null
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "COMMUNITY_PROBLEM_ADOPTED",
      entityType: "UnregisteredProblem",
      entityId: data.reportId,
      actorId: (session.user as any).id,
      details: `Created problem: ${problem.id}`
    }
  });

  revalidatePath("/admin/community");
  revalidatePath("/problems");
  return problem;
}

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
}
