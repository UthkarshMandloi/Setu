import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TrlBadge from "@/components/TrlBadge";
import { psCode } from "@/lib/problemFields";
import { TRL_LEVELS, TRL_STAGES, trlStage } from "@/lib/trl";

const PITCH_STATUSES = ["SUBMITTED", "SHORTLISTED", "SELECTED", "REJECTED"];
const VERIFICATION_STATUSES = ["VERIFIED", "NEEDS_REVIEW", "PENDING", "REJECTED"];

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-800",
  SHORTLISTED: "bg-blue-100 text-blue-800",
  SELECTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const SORTS: Record<string, Prisma.PitchOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  trl: [{ techReadinessLevel: "desc" }, { createdAt: "desc" }],
  eligibility: [{ startup: { eligibilityScore: "desc" } }, { createdAt: "desc" }],
};

const pitchInclude = {
  problem: { select: { id: true, title: true, psNumber: true, status: true } },
  startup: { select: { companyName: true, sector: true, verificationStatus: true, eligibilityScore: true } },
} satisfies Prisma.PitchInclude;

type PitchWithRelations = Prisma.PitchGetPayload<{ include: typeof pitchInclude }>;

type Search = {
  q?: string;
  ps?: string;
  status?: string;
  minTrl?: string;
  verification?: string;
  sort?: string;
  view?: string;
};

const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

const humanise = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ");

function hrefWith(current: Search, patch: Partial<Search>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/gov/pitches?${qs}` : "/gov/pitches";
}

export default async function PitchReviewPage({ searchParams }: { searchParams: Search }) {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const view = searchParams.view === "list" ? "list" : "grouped";
  const sort = searchParams.sort && SORTS[searchParams.sort] ? searchParams.sort : "newest";
  const q = searchParams.q?.trim() ?? "";
  const ps = searchParams.ps ?? "";
  const status = PITCH_STATUSES.includes(searchParams.status ?? "") ? searchParams.status! : "";
  const verification = VERIFICATION_STATUSES.includes(searchParams.verification ?? "") ? searchParams.verification! : "";
  const minTrl = Number(searchParams.minTrl);
  const hasMinTrl = Number.isInteger(minTrl) && minTrl >= 1 && minTrl <= 9;

  // Officers only ever see pitches for their own department's problems.
  const departmentId = officer.departmentId ?? "__none__";
  const scope: Prisma.PitchWhereInput = { problem: { departmentId } };

  const filters: Prisma.PitchWhereInput[] = [];
  if (q) {
    const psMatch = q.match(/^ps-?0*(\d+)$/i);
    filters.push({
      OR: [
        { startup: { companyName: { contains: q, mode: "insensitive" } } },
        { solutionSummary: { contains: q, mode: "insensitive" } },
        { problem: { title: { contains: q, mode: "insensitive" } } },
        ...(psMatch ? [{ problem: { psNumber: Number(psMatch[1]) } }] : []),
      ],
    });
  }
  if (ps) filters.push({ problemId: ps });
  if (status) filters.push({ status });
  if (hasMinTrl) filters.push({ techReadinessLevel: { gte: minTrl } });
  if (verification) filters.push({ startup: { verificationStatus: verification } });

  const [pitches, problemOptions, statusCounts] = await Promise.all([
    prisma.pitch.findMany({ where: { ...scope, AND: filters }, include: pitchInclude, orderBy: SORTS[sort] }),
    prisma.problem.findMany({
      where: { departmentId, pitches: { some: {} } },
      select: { id: true, title: true, psNumber: true },
      orderBy: { psNumber: "asc" },
    }),
    prisma.pitch.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);

  const countOf = (s: string) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;
  const total = statusCounts.reduce((sum, c) => sum + c._count._all, 0);
  const filtersActive = !!(q || ps || status || verification || hasMinTrl);

  // Group by problem statement, keeping the order of the chosen sort.
  const groups = new Map<string, { problem: PitchWithRelations["problem"]; pitches: PitchWithRelations[] }>();
  for (const pitch of pitches) {
    const group = groups.get(pitch.problemId) ?? { problem: pitch.problem, pitches: [] };
    group.pitches.push(pitch);
    groups.set(pitch.problemId, group);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Pitches</h1>
          <p className="text-slate-500">
            Solutions submitted to problems posted by {officer.department?.name ?? "your department"}.
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-white p-0.5 text-sm shadow-sm">
          <Link
            href={hrefWith(searchParams, { view: undefined })}
            className={`rounded px-3 py-1.5 ${view === "grouped" ? "bg-[#1B3A6B] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            By problem statement
          </Link>
          <Link
            href={hrefWith(searchParams, { view: "list" })}
            className={`rounded px-3 py-1.5 ${view === "list" ? "bg-[#1B3A6B] text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            All pitches
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip href={hrefWith(searchParams, { status: undefined })} active={!status} label="All" count={total} />
        {PITCH_STATUSES.map((s) => (
          <StatusChip
            key={s}
            href={hrefWith(searchParams, { status: s })}
            active={status === s}
            label={humanise(s)}
            count={countOf(s)}
          />
        ))}
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-4 lg:grid-cols-6">
        {view === "list" && <input type="hidden" name="view" value="list" />}
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Startup, solution, problem or PS ID" className="bg-white" />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="ps">Problem statement</label>
          <select id="ps" name="ps" defaultValue={ps} className={FIELD}>
            <option value="">All problem statements</option>
            {problemOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {psCode(p.psNumber)} — {p.title.length > 55 ? `${p.title.slice(0, 55)}…` : p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="status">Pitch status</label>
          <select id="status" name="status" defaultValue={status} className={FIELD}>
            <option value="">Any status</option>
            {PITCH_STATUSES.map((s) => (
              <option key={s} value={s}>{humanise(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="minTrl">Minimum TRL</label>
          <select id="minTrl" name="minTrl" defaultValue={hasMinTrl ? String(minTrl) : ""} className={FIELD}>
            <option value="">Any TRL</option>
            {TRL_LEVELS.map((t) => (
              <option key={t.level} value={t.level}>TRL {t.level}+ ({trlStage(t.level).stage})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="verification">Startup verification</label>
          <select id="verification" name="verification" defaultValue={verification} className={FIELD}>
            <option value="">Any</option>
            {VERIFICATION_STATUSES.map((v) => (
              <option key={v} value={v}>{humanise(v)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort} className={FIELD}>
            <option value="newest">Newest first</option>
            <option value="trl">Highest TRL</option>
            <option value="eligibility">Highest eligibility</option>
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
          {filtersActive && (
            <Link href={hrefWith({}, { view: view === "list" ? "list" : undefined })}>
              <Button type="button" size="sm" variant="ghost">Clear</Button>
            </Link>
          )}
        </div>
      </form>

      <TrlLegend />

      {pitches.length === 0 ? (
        <div className="rounded-md border bg-white p-10 text-center text-slate-500 shadow-sm">
          {filtersActive ? "No pitches match these filters." : "No pitches submitted yet."}
        </div>
      ) : view === "grouped" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {pitches.length} pitch{pitches.length === 1 ? "" : "es"} across {groups.size} problem statement{groups.size === 1 ? "" : "s"}
          </p>
          {Array.from(groups.values()).map(({ problem, pitches: groupPitches }) => (
            <section key={problem.id} className="overflow-hidden rounded-md border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                    {psCode(problem.psNumber)}
                  </span>
                  <Link href={`/problems/${problem.id}`} className="font-semibold text-[#1B3A6B] hover:underline">
                    {problem.title}
                  </Link>
                  <Badge variant="outline" className="text-xs">{problem.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {PITCH_STATUSES.map((s) => {
                    const n = groupPitches.filter((p) => p.status === s).length;
                    return n ? (
                      <span key={s} className={`rounded-full px-2 py-0.5 ${STATUS_TONE[s]}`}>{n} {s.toLowerCase()}</span>
                    ) : null;
                  })}
                </div>
              </div>
              <PitchTable pitches={groupPitches} showProblem={false} />
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-white shadow-sm">
          <PitchTable pitches={pitches} showProblem />
        </div>
      )}
    </div>
  );
}

function StatusChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        active ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-xs font-semibold ${active ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
    </Link>
  );
}

function PitchTable({ pitches, showProblem }: { pitches: PitchWithRelations[]; showProblem: boolean }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showProblem && <TableHead>Problem statement</TableHead>}
            <TableHead>Startup &amp; solution</TableHead>
            <TableHead>Eligibility</TableHead>
            <TableHead>TRL</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pitches.map((pitch) => (
            <TableRow key={pitch.id}>
              {showProblem && (
                <TableCell className="max-w-[16rem]">
                  <span className="font-mono text-xs font-semibold text-[#1B3A6B]">{psCode(pitch.problem.psNumber)}</span>
                  <p className="line-clamp-1 text-sm">{pitch.problem.title}</p>
                </TableCell>
              )}
              <TableCell className="max-w-md">
                <p className="font-medium">{pitch.startup.companyName}</p>
                <p className="text-xs text-slate-500">{pitch.startup.sector ?? "—"}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{pitch.solutionSummary}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{pitch.startup.eligibilityScore}</span>
                  <Badge variant="outline" className="whitespace-nowrap text-xs">
                    {humanise(pitch.startup.verificationStatus)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <TrlBadge level={pitch.techReadinessLevel} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {pitch.createdAt.toLocaleDateString("en-IN")}
              </TableCell>
              <TableCell>
                <Badge className={`${STATUS_TONE[pitch.status] ?? "bg-slate-100 text-slate-800"} border-0`}>{pitch.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/gov/pitches/${pitch.id}`}>
                  <Button size="sm" variant="outline">Review</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TrlLegend() {
  return (
    <details className="rounded-md border bg-white p-3 text-sm shadow-sm">
      <summary className="cursor-pointer font-medium text-[#1B3A6B]">What is TRL (Technology Readiness Level)?</summary>
      <p className="mt-2 text-slate-600">
        A standard 1–9 scale (used by NASA, the EU and India&apos;s DST) describing how mature a technology is. The
        startup self-declares it when pitching — a higher TRL means less risk for a pilot. Hover any TRL badge for its definition.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {TRL_STAGES.map((s, i) => (
          <div key={s.stage} className="rounded-md border border-slate-100 p-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.tone}`}>{s.range} · {s.stage}</span>
            <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
            <ul className="mt-2 space-y-0.5 text-xs text-slate-700">
              {TRL_LEVELS.slice(i * 3, i * 3 + 3).map((t) => (
                <li key={t.level}><span className="font-semibold">{t.level}.</span> {t.label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
