import { redirect } from "next/navigation";
import { getStartupProfile } from "@/lib/startup";
import SolutionForm from "../SolutionForm";
import { emptySolutionDraft } from "@/lib/solutionFields";

export default async function NewSolutionPage() {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">List a Solution</h1>
        <p className="text-slate-500">Showcase something you&apos;ve already built, independent of any posted problem statement.</p>
      </div>
      <SolutionForm initial={emptySolutionDraft(profile.sector)} />
    </div>
  );
}
