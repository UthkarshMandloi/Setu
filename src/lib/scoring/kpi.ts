// KPI scoring rules (CLAUDE.md "Scoring logic"):
// - achievement = actual / target, inverted (target / actual) for LOWER_IS_BETTER KPIs
// - Met ≥ 100%, Partial 50–99%, Not met < 50%
// - Impact Score = weight-averaged achievement across reported KPIs, capped at 100
// - Trust badge: Green 80–100, Yellow 50–79, Red 0–49
// - ROI = (measured benefit − pilot cost) / pilot cost × 100
// Pure functions only — safe to import from server and client components.

export type KpiStatus = "MET" | "PARTIAL" | "NOT_MET" | "PENDING";
export type TrustBadge = "GREEN" | "YELLOW" | "RED";

// Checked with the dataviz palette validator on white cards: all pass contrast and lightness
// (#c98500 replaces the sub-3:1 #fab219 amber), but green vs amber is NOT separable under
// protan/deutan colour-blindness. So status is never shown by colour alone — every use pairs it
// with an icon or a text label (chart bars are labelled e.g. "70% · Partial").
export const KPI_STATUS_META: Record<KpiStatus, { label: string; color: string; tone: string }> = {
  MET: { label: "Met", color: "#0ca30c", tone: "bg-green-100 text-green-800" },
  PARTIAL: { label: "Partial", color: "#c98500", tone: "bg-amber-100 text-amber-800" },
  NOT_MET: { label: "Not met", color: "#d03b3b", tone: "bg-red-100 text-red-800" },
  PENDING: { label: "Awaiting result", color: "#898781", tone: "bg-slate-100 text-slate-600" },
};

export const TRUST_BADGE_META: Record<TrustBadge, { label: string; range: string; tone: string; color: string }> = {
  GREEN: { label: "Green", range: "80–100", tone: "border-green-200 bg-green-100 text-green-800", color: "#0ca30c" },
  YELLOW: { label: "Yellow", range: "50–79", tone: "border-amber-200 bg-amber-100 text-amber-800", color: "#c98500" },
  RED: { label: "Red", range: "0–49", tone: "border-red-200 bg-red-100 text-red-800", color: "#d03b3b" },
};

type ResultLike = { actual: number; evidence: string | null; attachmentUrl: string | null; createdAt: Date };
type KpiLike = {
  id: string;
  metric: string;
  target: number;
  unit: string;
  weight: number;
  direction: string;
  results: ResultLike[];
};

export type KpiEvaluation = {
  id: string;
  metric: string;
  unit: string;
  target: number;
  weight: number;
  direction: string;
  actual: number | null;
  achievementPct: number | null;
  status: KpiStatus;
  evidence: string | null;
  attachmentUrl: string | null;
  reportedAt: Date | null;
  resultCount: number;
};

export function kpiAchievement(target: number, actual: number, direction: string): number {
  if (direction === "LOWER_IS_BETTER") {
    // Reaching zero on a lower-is-better metric (e.g. zero errors) fully meets any target.
    if (actual <= 0) return 100;
    return (target / actual) * 100;
  }
  if (target === 0) return actual >= 0 ? 100 : 0;
  return (actual / target) * 100;
}

export function kpiStatus(achievementPct: number | null): KpiStatus {
  if (achievementPct === null) return "PENDING";
  if (achievementPct >= 100) return "MET";
  if (achievementPct >= 50) return "PARTIAL";
  return "NOT_MET";
}

export function trustBadgeFor(impactScore: number): TrustBadge {
  if (impactScore >= 80) return "GREEN";
  if (impactScore >= 50) return "YELLOW";
  return "RED";
}

export function roiPercent(measuredBenefit: number | null | undefined, pilotCost: number | null | undefined): number | null {
  if (measuredBenefit === null || measuredBenefit === undefined || !pilotCost || pilotCost <= 0) return null;
  return ((measuredBenefit - pilotCost) / pilotCost) * 100;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Scores a pilot's KPIs using the latest reported result for each. */
export function evaluateKpis(kpis: KpiLike[]) {
  const evaluations: KpiEvaluation[] = kpis.map((kpi) => {
    const latest = [...kpi.results].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const achievementPct = latest ? kpiAchievement(kpi.target, latest.actual, kpi.direction) : null;
    return {
      id: kpi.id,
      metric: kpi.metric,
      unit: kpi.unit,
      target: kpi.target,
      weight: kpi.weight > 0 ? kpi.weight : 1,
      direction: kpi.direction,
      actual: latest?.actual ?? null,
      achievementPct: achievementPct === null ? null : round1(achievementPct),
      status: kpiStatus(achievementPct),
      evidence: latest?.evidence ?? null,
      attachmentUrl: latest?.attachmentUrl ?? null,
      reportedAt: latest?.createdAt ?? null,
      resultCount: kpi.results.length,
    };
  });

  const reported = evaluations.filter((e) => e.achievementPct !== null);
  const totalWeight = reported.reduce((sum, e) => sum + e.weight, 0);
  const rawImpact =
    totalWeight > 0 ? reported.reduce((sum, e) => sum + (e.achievementPct as number) * e.weight, 0) / totalWeight : null;
  const impactScore = rawImpact === null ? null : round1(Math.min(100, rawImpact));

  const counts: Record<KpiStatus, number> = { MET: 0, PARTIAL: 0, NOT_MET: 0, PENDING: 0 };
  for (const e of evaluations) counts[e.status]++;

  return {
    kpis: evaluations,
    impactScore,
    trustBadge: impactScore === null ? null : trustBadgeFor(impactScore),
    reportedCount: reported.length,
    totalCount: evaluations.length,
    counts,
  };
}
