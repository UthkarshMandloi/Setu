"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestSolutionPilot(solutionId: string, notes: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) throw new Error("Unauthorized");
  if (!notes?.trim()) return { ok: false, error: "Please explain why you want to pilot this solution." };

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, include: { department: true } });
  if (!user?.departmentId) return { ok: false, error: "Your account is not linked to a department." };

  const solution = await prisma.startupSolution.findUnique({ where: { id: solutionId }, select: { status: true, isListed: true, title: true, startup: { select: { userId: true } } } });
  if (!solution || solution.status !== "VERIFIED" || !solution.isListed) return { ok: false, error: "This solution is not currently listed." };

  const existing = await prisma.startupSolutionRequest.findFirst({ where: { solutionId, departmentId: user.departmentId } });
  if (existing) return { ok: false, error: "Your department has already requested this solution." };

  await prisma.$transaction([
    prisma.startupSolutionRequest.create({ data: { solutionId, departmentId: user.departmentId, notes: notes.trim() } }),
    prisma.auditLog.create({
      data: { action: "SOLUTION_REQUEST_CREATED", entityType: "StartupSolution", entityId: solutionId, actorId: user.id, details: `Department ${user.department?.name} requested a pilot` },
    }),
    prisma.notification.create({
      data: { userId: solution.startup.userId, title: "New pilot request", message: `${user.department?.name} wants to pilot "${solution.title}".`, type: "INFO", link: "/startup/solutions" },
    }),
  ]);

  revalidatePath(`/marketplace/solutions/${solutionId}`);
  return { ok: true };
}

// The startup that owns the solution decides whether to work with the requesting department.
export async function respondToSolutionRequest(requestId: string, accept: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STARTUP") throw new Error("Unauthorized");

  const profile = await prisma.startupProfile.findUnique({ where: { userId: (session.user as any).id } });
  if (!profile) throw new Error("Unauthorized");

  const request = await prisma.startupSolutionRequest.findUnique({ where: { id: requestId }, include: { solution: { select: { startupId: true } }, department: { select: { name: true } } } });
  if (!request || request.solution.startupId !== profile.id) return { ok: false, error: "Request not found." };
  if (request.status !== "PENDING") return { ok: false, error: "This request has already been decided." };

  await prisma.startupSolutionRequest.update({ where: { id: requestId }, data: { status: accept ? "ACCEPTED" : "REJECTED" } });
  await prisma.auditLog.create({
    data: { action: accept ? "SOLUTION_REQUEST_ACCEPTED" : "SOLUTION_REQUEST_DECLINED", entityType: "StartupSolutionRequest", entityId: requestId, actorId: profile.userId, details: `Request from ${request.department.name}` },
  });

  revalidatePath("/startup/solutions");
  return { ok: true };
}
