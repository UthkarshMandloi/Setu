import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdoptForm from "./AdoptForm";

const prisma = new PrismaClient();

export default async function AdoptProblemPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const report = await prisma.unregisteredProblem.findUnique({
    where: { id: params.id }
  });

  if (!report) notFound();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" }
  });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { department: true }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Adopt Community Problem</h1>
        <p className="text-slate-500 mt-1">Convert this citizen report into an official problem.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription className="mt-1">
                Reported by {report.reporter || "Anonymous"} • {report.location || "Location not specified"}
              </CardDescription>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 border-0">PENDING</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
            <p className="text-slate-700">{report.description}</p>
          </div>
          <div className="text-sm text-slate-500">
            Submitted on {new Date(report.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <AdoptForm
        reportId={report.id}
        title={report.title}
        description={report.description}
        departments={departments}
        userDepartmentId={user?.departmentId}
      />
    </div>
  );
}
