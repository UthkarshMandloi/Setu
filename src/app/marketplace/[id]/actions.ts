"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function requestAssignment(passportId: string, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { department: true }
  });

  if (!user?.departmentId) {
    throw new Error("User has no department assigned");
  }

  // Check if already requested
  const existing = await prisma.marketplaceRequest.findFirst({
    where: {
      passportId,
      departmentId: user.departmentId
    }
  });

  if (existing) {
    throw new Error("Your department has already requested this solution");
  }

  const request = await prisma.marketplaceRequest.create({
    data: {
      passportId,
      departmentId: user.departmentId,
      notes,
      status: "PENDING"
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "MARKETPLACE_REQUEST_CREATED",
      entityType: "SolutionPassport",
      entityId: passportId,
      actorId: (session.user as any).id,
      details: `Department ${user.department?.name} requested assignment`
    }
  });

  revalidatePath(`/marketplace/${passportId}`);
  revalidatePath("/marketplace");
  return request;
}

export async function acceptRequest(requestId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const request = await prisma.marketplaceRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "MARKETPLACE_REQUEST_ACCEPTED",
      entityType: "MarketplaceRequest",
      entityId: requestId,
      actorId: (session.user as any).id
    }
  });

  revalidatePath(`/marketplace/${request.passportId}`);
  return request;
}

export async function rejectRequest(requestId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const request = await prisma.marketplaceRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "MARKETPLACE_REQUEST_REJECTED",
      entityType: "MarketplaceRequest",
      entityId: requestId,
      actorId: (session.user as any).id
    }
  });

  revalidatePath(`/marketplace/${request.passportId}`);
  return request;
}
