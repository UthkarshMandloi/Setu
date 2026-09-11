"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireOfficer } from "@/lib/officer";
import { generateSolutionPassport } from "@/lib/scoring/calculateScore";
import { evaluateKpis } from "@/lib/scoring/kpi";

// Only officers of the pilot's own department may change it (evaluators can view, not act).
async function loadManagedPilot(pilotId: string) {
  const officer = await requireOfficer();
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: { kpis: { include: { results: true } }, passport: { select: { id: true } } },
  });
  if (!pilot || pilot.departmentId !== officer.departmentId) throw new Error("Unauthorized");
  return { officer, pilot };
}

export async function generatePilotPassport(
  pilotId: string,
  ipStatus: "OPEN" | "PROPRIETARY" = "PROPRIETARY"
): Promise<{ ok: true; passportId: string } | { ok: false; error: string }> {
  const { officer, pilot } = await loadManagedPilot(pilotId);

  if (pilot.passport) return { ok: false, error: "A Solution Passport already exists for this pilot." };
  if (pilot.status !== "COMPLETED") return { ok: false, error: "Passports can only be generated for completed pilots." };

  const { reportedCount, totalCount } = evaluateKpis(pilot.kpis);
  if (totalCount === 0 || reportedCount < totalCount) {
    return { ok: false, error: "Every KPI needs a reported result before the passport can be generated." };
  }

  const passport = await generateSolutionPassport(pilotId, ipStatus === "OPEN" ? "OPEN" : "PROPRIETARY");

  await prisma.auditLog.create({
    data: {
      action: "PASSPORT_GENERATED",
      entityType: "Pilot",
      entityId: pilotId,
      actorId: officer.id,
      details: `Solution Passport ${passport.id} issued (${passport.trustBadge}, impact ${passport.impactScore}, IP ${passport.ipStatus})`,
    },
  });

  revalidatePath(`/gov/pilots/${pilotId}`);
  revalidatePath("/gov/pilots");
  revalidatePath("/marketplace");
  return { ok: true, passportId: passport.id };
}

export async function addKPIResult(kpiId: string, actual: number, evidence?: string) {
  const officer = await requireOfficer();
  const kpi = await prisma.kPI.findUnique({ where: { id: kpiId }, include: { pilot: { select: { id: true, departmentId: true } } } });
  if (!kpi || kpi.pilot.departmentId !== officer.departmentId) throw new Error("Unauthorized");
  if (!Number.isFinite(actual)) throw new Error("Actual value must be a number");

  const result = await prisma.kPIResult.create({
    data: {
      kpiId,
      actual,
      evidence
    }
  });

  revalidatePath(`/gov/pilots/${kpi.pilot.id}`);
  revalidatePath("/gov/pilots");
  return result;
}
