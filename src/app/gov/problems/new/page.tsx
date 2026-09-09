import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProblemForm from "./ProblemForm";

export default async function NewProblemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Post a New Problem</h1>
        <p className="text-slate-500">Describe the challenge your department needs solved.</p>
      </div>

      <ProblemForm />
    </div>
  );
}
