import { prisma } from "@/lib/prisma";
import { evaluateKpis, roiPercent } from "./kpi";

// Server-only helper. Deliberately NOT a "use server" module: exported server actions are
// callable by any client, which would bypass the auth checks in app/gov/pilots/actions.ts.
export async function generateSolutionPassport(pilotId: string, ipStatus: "OPEN" | "PROPRIETARY" = "PROPRIETARY") {
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      pitch: { include: { startup: true, problem: true } },
      kpis: { include: { results: true } },
      passport: true,
    },
  });

  if (!pilot) throw new Error("Pilot not found");
  if (pilot.passport) return pilot.passport;

  const evaluation = evaluateKpis(pilot.kpis);

  return prisma.solutionPassport.create({
    data: {
      pilotId,
      startupId: pilot.pitch.startupId,
      title: `${pilot.pitch.problem.title} — ${pilot.pitch.startup.companyName}`,
      summary: pilot.pitch.solutionSummary,
      impactScore: evaluation.impactScore ?? 0,
      trustBadge: evaluation.trustBadge ?? "RED",
      roiPercent: roiPercent(pilot.measuredBenefit, pilot.budget),
      ipStatus,
      isPublished: true,
    },
  });
}
