import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const OFFICER_ROLES = ["GOV_OFFICER", "GOV_ADMIN"];

/**
 * The signed-in government officer with their department, or null.
 * The session doesn't carry departmentId, so it is read from the DB.
 */
export async function getOfficer() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !OFFICER_ROLES.includes((session.user as any).role)) return null;
  return prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { department: true },
  });
}

// ASSUMPTION: GOV_ADMIN acts as the Government Admin/Evaluator from the PRD, so it may VIEW
// every department's pilots (read-only oversight). Changing pilots stays with the owning department.
export function canViewDepartment(officer: { role: string; departmentId: string | null }, departmentId: string): boolean {
  return officer.role === "GOV_ADMIN" || officer.departmentId === departmentId;
}

export async function requireOfficer() {
  const officer = await getOfficer();
  if (!officer) throw new Error("Unauthorized");
  return officer;
}
