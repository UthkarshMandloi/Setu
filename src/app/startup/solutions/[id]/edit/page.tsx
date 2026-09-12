import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import SolutionForm from "../../SolutionForm";
import type { SolutionDraft } from "@/lib/solutionFields";

export default async function EditSolutionPage({ params }: { params: { id: string } }) {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const solution = await prisma.startupSolution.findUnique({ where: { id: params.id } });
  if (!solution || solution.startupId !== profile.id) notFound();
  if (!["DRAFT", "REJECTED"].includes(solution.status)) redirect("/startup/solutions");

  const initial: SolutionDraft = {
    title: solution.title,
    sector: solution.sector ?? "",
    description: solution.description,
    problemSolved: solution.problemSolved,
    keyFeatures: solution.keyFeatures ?? "",
    deploymentProof: solution.deploymentProof ?? "",
    evidenceUrl: solution.evidenceUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Edit Solution</h1>
        {solution.status === "REJECTED" && solution.reviewNotes && (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Admin feedback: </span>{solution.reviewNotes}
          </p>
        )}
      </div>
      <SolutionForm initial={initial} solutionId={solution.id} />
    </div>
  );
}
