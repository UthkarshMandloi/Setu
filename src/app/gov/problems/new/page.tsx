import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProblemAssistant from "./ProblemAssistant";

export default async function NewProblemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { department: true },
  });
  const departmentName = user?.department
    ? `${user.department.name}${user.department.state ? `, ${user.department.state}` : ""}`
    : "your department";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Post a New Problem</h1>
        <p className="text-slate-500">
          Describe the challenge in plain words — the AI assistant clarifies what&apos;s missing and drafts a
          structured problem statement you can edit before publishing.
        </p>
      </div>

      {!user?.departmentId ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Your account is not linked to a department, so it cannot post problems. Ask a platform admin to assign one.
        </div>
      ) : (
        <ProblemAssistant departmentName={departmentName} />
      )}
    </div>
  );
}
