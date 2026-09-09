"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function calculatePilotScore(pilotId: string): Promise<number> {
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      kpis: {
        include: { results: true }
      }
    }
  });

  if (!pilot) throw new Error("Pilot not found");

  if (!pilot.kpis || pilot.kpis.length === 0) {
    return 0;
  }

  let totalWeightedScore = 0;
  let maxPossibleScore = 0;

  for (const kpi of pilot.kpis) {
    const result = pilot.results?.find(r => r.kpiId === kpi.id);
    if (!result) continue;

    const actualValue = result.actual;
    const targetValue = kpi.target;
    const direction = kpi.direction; // "HIGHER_IS_BETTER" or "LOWER_IS_BETTER"
    const weight = kpi.weight || 1.0;

    // Calculate percentage score (0-100)
    let percentageScore = 0;

    if (direction === "HIGHER_IS_BETTER") {
      if (targetValue === 0) {
        percentageScore = actualValue >= 100 ? 100 : (actualValue / 10) * 100;
      } else {
        percentageScore = Math.min(100, (actualValue / targetValue) * 100);
      }
    } else { // LOWER_IS_BETTER
      if (targetValue === 0) {
        percentageScore = actualValue <= 100 ? 100 : 100 - Math.min(100, (actualValue / 10) * 100);
      } else {
        percentageScore = Math.min(100, (targetValue / actualValue) * 100);
      }
    }

    totalWeightedScore += percentageScore * weight;
    maxPossibleScore += 100 * weight;
  }

  const overallScore = maxPossibleScore > 0 ? (totalWeightedScore / maxPossibleScore) * 100 : 0;
  return Math.round(overallScore * 100) / 100;
}

export async function calculateROI(pilotId: string): Promise<number> {
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId }
  });

  if (!pilot?.budget || !pilot?.measuredBenefit) {
    return 0;
  }

  const roi = ((pilot.measuredBenefit - pilot.budget) / pilot.budget) * 100;
  return Math.round(roi * 100) / 100;
}

export function getTrustBadge(score: number): "GREEN" | "YELLOW" | "RED" {
  if (score >= 80) return "GREEN";
  if (score >= 50) return "YELLOW";
  return "RED";
}

export async function generateSolutionPassport(pilotId: string): Promise<any> {
  const pilot = await prisma.pilot.findUnique({
    where: { id: pilotId },
    include: {
      pitch: {
        include: {
          startup: true,
          problem: true
        }
      },
      kpis: {
        include: { results: true }
      },
      passport: true
    }
  });

  if (!pilot) throw new Error("Pilot not found");
  if (pilot.passport) {
    return pilot.passport;
  }

  const [impactScore, roi] = await Promise.all([
    calculatePilotScore(pilotId),
    calculateROI(pilotId)
  ]);

  const trustBadge = getTrustBadge(impactScore);

  const startup = pilot.pitch?.startup;
  const problem = pilot.pitch?.problem;

  const passport = await prisma.solutionPassport.create({
    data: {
      pilotId: pilotId,
      startupId: pilot.pitch?.startupId || startup?.id || "",
      title: `${pilot.pitch?.startup?.companyName || "Startup"}'s Solution for ${problem?.title || "Problem"}`,      summary: pilot.pitch?.solutionSummary || "Innovative solution for government problem",
      impactScore: impactScore,
      trustBadge: trustBadge,
      roiPercent: roi,
      ipStatus: "PROPRIETARY", // This would be configurable
      isPublished: true
    }
  });

  return passport;
}

export async function calculateAllPilotMetrics(pilotId: string) {
  const impactScore = await calculatePilotScore(pilotId);
  const roi = await calculateROI(pilotId);
  const trustBadge = getTrustBadge(impactScore);

  return {
    impactScore,
    roi,
    trustBadge,
    kpiResults: [] // Would include detailed KPI breakdown
  };
}