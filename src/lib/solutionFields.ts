// Shared between the "My Solutions" startup UI and the admin verification queue.

export const SECTORS = [
  "Agritech",
  "Govtech",
  "Healthtech",
  "Smart Cities",
  "Fintech",
  "Cleantech",
  "Edtech",
  "Logistics",
  "Other",
] as const;

export type SolutionStatus = "DRAFT" | "PENDING" | "VERIFIED" | "REJECTED";

export const SOLUTION_STATUS_META: Record<SolutionStatus, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "bg-slate-200 text-slate-700" },
  PENDING: { label: "Pending review", tone: "bg-blue-100 text-blue-800" },
  VERIFIED: { label: "Verified", tone: "bg-green-100 text-green-800" },
  REJECTED: { label: "Needs changes", tone: "bg-red-100 text-red-800" },
};

export type SolutionDraft = {
  title: string;
  sector: string;
  description: string;
  problemSolved: string;
  keyFeatures: string;
  deploymentProof: string;
  evidenceUrl: string;
};

export function emptySolutionDraft(defaultSector?: string | null): SolutionDraft {
  return {
    title: "",
    sector: defaultSector ?? "",
    description: "",
    problemSolved: "",
    keyFeatures: "",
    deploymentProof: "",
    evidenceUrl: "",
  };
}
