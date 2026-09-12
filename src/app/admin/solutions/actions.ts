"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = ["GOV_ADMIN", "PLATFORM_ADMIN"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ADMIN_ROLES.includes((session.user as any).role)) throw new Error("Unauthorized");
  return session.user as any;
}

async function loadPendingSolution(id: string) {
  const solution = await prisma.startupSolution.findUnique({ where: { id }, include: { startup: { select: { userId: true, companyName: true } } } });
  if (!solution || solution.status !== "PENDING") throw new Error("This solution is not awaiting review");
  return solution;
}

export async function verifySolution(id: string, notes: string) {
  const admin = await requireAdmin();
  const solution = await loadPendingSolution(id);

  await prisma.startupSolution.update({
    where: { id },
    data: { status: "VERIFIED", isListed: true, reviewNotes: notes || null, reviewedById: admin.id, reviewedAt: new Date() },
  });

  await prisma.$transaction([
    prisma.auditLog.create({
      data: { action: "SOLUTION_VERIFIED", entityType: "StartupSolution", entityId: id, actorId: admin.id, details: notes || undefined },
    }),
    prisma.notification.create({
      data: {
        userId: solution.startup.userId,
        title: "Solution verified",
        message: `"${solution.title}" was verified and is now listed on the marketplace.`,
        type: "SUCCESS",
        link: "/startup/solutions",
      },
    }),
  ]);

  revalidatePath("/admin/solutions");
  revalidatePath("/marketplace");
}

export async function rejectSolution(id: string, reason: string) {
  const admin = await requireAdmin();
  const solution = await loadPendingSolution(id);
  if (!reason?.trim()) throw new Error("A reason is required so the startup knows what to fix");

  await prisma.startupSolution.update({
    where: { id },
    data: { status: "REJECTED", reviewNotes: reason.trim(), reviewedById: admin.id, reviewedAt: new Date() },
  });

  await prisma.$transaction([
    prisma.auditLog.create({
      data: { action: "SOLUTION_REJECTED", entityType: "StartupSolution", entityId: id, actorId: admin.id, details: reason.trim() },
    }),
    prisma.notification.create({
      data: {
        userId: solution.startup.userId,
        title: "Solution needs changes",
        message: `"${solution.title}" was sent back for changes: ${reason.trim()}`,
        type: "WARNING",
        link: "/startup/solutions",
      },
    }),
  ]);

  revalidatePath("/admin/solutions");
}
