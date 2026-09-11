"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchSolutions, type SolutionMatch } from "@/lib/ai/solutionMatcher";
import { psCode } from "@/lib/problemFields";

export type SolutionMatchView = SolutionMatch & {
  title: string;
  startupName: string;
  sector: string | null;
  originDepartment: string;
  originState: string | null;
  psCode: string;
  trustBadge: string;
  impactScore: number;
  roiPercent: number | null;
  ipStatus: string;
  reusable: boolean;
  route: string;
  routeDetail: string;
};

type FinderResult =
  | { ok: true; understanding: string; simulated: boolean; matches: SolutionMatchView[] }
  | { ok: false; error: string };

export async function findSimilarSolutions(query: string): Promise<FinderResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const text = (query ?? "").trim();
  if (text.length < 20) return { ok: false, error: "Describe the problem in a sentence or two so it can be compared." };
  if (text.length > 4000) return { ok: false, error: "Please keep the description under 4000 characters." };

  const passports = await prisma.solutionPassport.findMany({
    where: { isPublished: true },
    include: {
      startup: { select: { companyName: true, sector: true } },
      pilot: {
        include: {
          department: { select: { name: true, state: true } },
          pitch: {
            include: {
              problem: { select: { title: true, description: true, scope: true, expectedOutcomes: true, theme: true, psNumber: true } },
            },
          },
          kpis: { include: { results: { orderBy: { createdAt: "desc" }, take: 1 } } },
        },
      },
    },
  });

  const result = await matchSolutions(
    text,
    passports.map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      problemTitle: p.pilot.pitch.problem.title,
      problemDescription: p.pilot.pitch.problem.description,
      problemScope: p.pilot.pitch.problem.scope,
      expectedOutcomes: p.pilot.pitch.problem.expectedOutcomes,
      theme: p.pilot.pitch.problem.theme,
      originDepartment: p.pilot.department.name,
      originState: p.pilot.department.state,
      sector: p.startup.sector,
      kpis: p.pilot.kpis.map((k) => ({ metric: k.metric, target: k.target, unit: k.unit, actual: k.results[0]?.actual ?? null })),
      trustBadge: p.trustBadge,
      impactScore: p.impactScore,
      ipStatus: p.ipStatus,
    }))
  );

  const byId = new Map(passports.map((p) => [p.id, p]));
  const matches: SolutionMatchView[] = result.matches.flatMap((m) => {
    const p = byId.get(m.passportId);
    if (!p) return [];
    return [{
      ...m,
      title: p.title,
      startupName: p.startup.companyName,
      sector: p.startup.sector,
      originDepartment: p.pilot.department.name,
      originState: p.pilot.department.state,
      psCode: psCode(p.pilot.pitch.problem.psNumber),
      trustBadge: p.trustBadge,
      impactScore: p.impactScore,
      roiPercent: p.roiPercent,
      ipStatus: p.ipStatus,
      ...adoptionRoute(p.trustBadge, p.ipStatus, p.startup.companyName),
    }];
  });

  return { ok: true, understanding: result.understanding, simulated: result.simulated, matches };
}

// Reuse eligibility is a platform rule, never the model's call.
function adoptionRoute(trustBadge: string, ipStatus: string, startupName: string) {
  if (trustBadge === "RED") {
    return {
      reusable: false,
      route: "Not recommended for direct reuse",
      routeDetail: "The original pilot missed most of its targets (Red badge). Use it as a reference only, or post a fresh problem statement.",
    };
  }
  if (ipStatus === "OPEN") {
    return {
      reusable: true,
      route: "Open IP — reuse without a new pitch round",
      routeDetail: `Request assignment from ${startupName}, or assign the open solution to a verified startup in your own state.`,
    };
  }
  return {
    reusable: true,
    route: "Proprietary — request direct assignment",
    routeDetail: `Request assignment from ${startupName}; no fresh procurement round is needed.`,
  };
}
