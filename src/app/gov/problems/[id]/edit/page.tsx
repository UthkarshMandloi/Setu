import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import ProblemForm from "../../new/ProblemForm";
import type { KpiSuggestion, ProblemDraft } from "@/lib/problemFields";

export default async function EditProblemPage({ params }: { params: { id: string } }) {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const problem = await prisma.problem.findUnique({ where: { id: params.id } });
  if (!problem || problem.departmentId !== officer.departmentId) notFound();
  // Published problems are locked so every startup pitches against the same statement.
  if (problem.status !== "DRAFT") redirect(`/problems/${problem.id}`);

  const initial: ProblemDraft = {
    title: problem.title,
    theme: problem.theme ?? "e-Governance",
    description: problem.description,
    scope: problem.scope ?? "",
    expectedOutcomes: problem.expectedOutcomes ?? "",
    constraints: problem.constraints ?? "",
    targetBeneficiaries: problem.targetBeneficiaries ?? "",
    budgetBand: problem.budgetBand ?? "INR 10L - 25L",
    timelineWeeks: problem.pilotDurationWeeks ?? 12,
    suggestedKpis: (problem.suggestedKpis as unknown as KpiSuggestion[] | null) ?? [],
    assumptions: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Edit Draft Problem</h1>
        <p className="text-slate-500">Only officers of your department can see this draft until it is published.</p>
      </div>
      <ProblemForm
        initial={initial}
        problemId={problem.id}
        initialDeadline={problem.deadline ? problem.deadline.toISOString().slice(0, 10) : ""}
        aiAssisted={problem.aiAssisted}
        simulated={false}
        originalBrief={problem.originalBrief ?? ""}
        backHref={`/problems/${problem.id}`}
        backLabel="Cancel"
      />
    </div>
  );
}
