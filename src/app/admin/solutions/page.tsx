import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SECTORS, SOLUTION_STATUS_META, type SolutionStatus } from "@/lib/solutionFields";

const STATUSES: SolutionStatus[] = ["PENDING", "REJECTED", "VERIFIED", "DRAFT"];
const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

type Search = { q?: string; status?: string; sector?: string };

export default async function AdminSolutionsPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  // Default view is the review queue (Pending/Rejected); "Any status" opens it up to everything.
  const status = STATUSES.includes(searchParams.status as SolutionStatus) ? searchParams.status! : "";
  const q = searchParams.q?.trim() ?? "";
  const sector = searchParams.sector ?? "";

  const all = await prisma.startupSolution.findMany({
    where: status ? { status } : { status: { in: ["PENDING", "REJECTED"] } },
    include: { startup: { select: { companyName: true, sector: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const needle = q.toLowerCase();
  const filtered = all.filter(
    (s) =>
      (!needle || [s.title, s.description, s.startup.companyName].some((v) => v.toLowerCase().includes(needle))) &&
      (!sector || s.sector === sector)
  );
  const filtersActive = !!(q || status || sector);
  const pendingCount = await prisma.startupSolution.count({ where: { status: "PENDING" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solution Submissions</h1>
        <p className="text-slate-500">Review solutions startups have listed independent of any problem statement. Verified ones appear on the marketplace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Awaiting Review</div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Solution title, description or startup" className="bg-white" />
        </div>
        <div>
          <label className={LABEL} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className={FIELD}>
            <option value="">Review queue (Pending + Rejected)</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{SOLUTION_STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="sector">Sector</label>
          <select id="sector" name="sector" defaultValue={sector} className={FIELD}>
            <option value="">Any sector</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-4">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
          {filtersActive && (
            <Link href="/admin/solutions">
              <Button type="button" size="sm" variant="ghost">Clear</Button>
            </Link>
          )}
        </div>
      </form>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solution</TableHead>
              <TableHead>Startup</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {all.length === 0 ? "No solutions pending review." : "No solutions match these filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const meta = SOLUTION_STATUS_META[s.status as SolutionStatus] ?? { label: s.status, tone: "bg-slate-100 text-slate-700" };
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.title}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{s.description}</div>
                    </TableCell>
                    <TableCell>{s.startup.companyName}</TableCell>
                    <TableCell>{s.sector || s.startup.sector || "N/A"}</TableCell>
                    <TableCell><Badge className={`${meta.tone} border-0`}>{meta.label}</Badge></TableCell>
                    <TableCell>
                      <Link href={`/admin/solutions/${s.id}`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
