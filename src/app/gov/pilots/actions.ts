"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculatePilotScore, calculateROI, getTrustBadge, generateSolutionPassport } from "@/lib/scoring/calculateScore";



export async function calculateMetrics(pilotId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      pitch: {
        include: { startup: true, problem: true }
      },
      kpis: {
        include: { results: true }
      },
      passport: true
    }
  });

  if (!pilot) throw new Error("Pilot not found");

  const [impactScore, roi, trustBadge] = await Promise.all([
    calculatePilotScore(pilotId),
    calculateROI(pilotId),
    getTrustBadge(await calculatePilotScore(pilotId))
  ]);

  return {
    impactScore,
    roi,
    trustBadge,
    hasPassport: !!pilot.passport,
    passport: pilot.passport,
    kpis: pilot.kpis?.map(kpi => {
      const result = (kpi as any).results ? (kpi as any).results[0] : undefined;
      return {
        id: kpi.id,
        metric: kpi.metric,
        target: kpi.target,
        unit: kpi.unit,
        weight: kpi.weight,
        direction: kpi.direction,
        actual: result?.actual || 0,
        achievedPercentage: result?.actual && kpi.target ?
          (kpi.direction === "HIGHER_IS_BETTER" ?
            Math.min(100, (result.actual / kpi.target) * 100) :
            Math.min(100, (kpi.target / result.actual) * 100)
          ) : 0
      };
    }) || []
  };
}

export async function generatePilotPassport(pilotId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: { passport: true, pitch: true }
  });

  if (!pilot) throw new Error("Pilot not found");
  if (pilot.passport) throw new Error("Passport already exists");

  const passport = await generateSolutionPassport(pilotId);
  revalidatePath(`/gov/pilots/${pilotId}`);
  revalidatePath(`/marketplace`);

  return passport;
}

export async function addKPIResult(kpiId: string, actual: number, evidence?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  const result = await prisma.kPIResult.create({
    data: {
      kpiId,
      actual,
      evidence
    }
  });

  revalidatePath("/gov/pilots");
  return result;
}