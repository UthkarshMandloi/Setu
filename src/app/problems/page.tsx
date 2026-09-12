import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { psCode } from "@/lib/problemFields";
import { Lightbulb, Building2, MapPin, ArrowRight } from "lucide-react";

const FIELD = "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm shadow-xs focus:ring-2 focus:ring-sky-500/20";
const LABEL = "mb-1 block text-xs font-semibold text-slate-600";
const SORTS = ["newest", "deadline", "pitches"];

type Search = { q?: string; theme?: string; budget?: string; state?: string; sort?: string };

function hrefWith(current: Search, patch: Partial<Search>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/problems?${qs}` : "/problems";
}

export default async function ProblemsPage({ searchParams }: { searchParams: Search }) {
  const problems = await prisma.problem.findMany({
    where: { status: 'PUBLISHED' },
    include: { department: true, _count: { select: { pitches: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const q = searchParams.q?.trim() ?? "";
  const theme = searchParams.theme ?? "";
  const budget = searchParams.budget ?? "";
  const state = searchParams.state ?? "";
  const sort = SORTS.includes(searchParams.sort ?? "") ? searchParams.sort! : "newest";

  const themes = Array.from(new Set(problems.map((p) => p.theme).filter(Boolean))) as string[];
  const budgets = Array.from(new Set(problems.map((p) => p.budgetBand).filter(Boolean))) as string[];
  const states = Array.from(new Set(problems.map((p) => p.department?.state).filter(Boolean))) as string[];

  const psMatch = q.match(/^ps-?0*(\d+)$/i);
  const needle = q.toLowerCase();
  const filtered = problems.filter((p) =>
    (!q ||
      (psMatch
        ? p.psNumber === Number(psMatch[1])
        : [p.title, p.description, p.department?.name].filter(Boolean).some((s) => (s as string).toLowerCase().includes(needle)))) &&
    (!theme || p.theme === theme) &&
    (!budget || p.budgetBand === budget) &&
    (!state || p.department?.state === state)
  );
  if (sort === "deadline") {
    filtered.sort((a, b) => (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));
  } else if (sort === "pitches") {
    filtered.sort((a, b) => b._count.pitches - a._count.pitches);
  }

  const filtersActive = !!(q || theme || budget || state);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            GOVERNMENT INNOVATION CHALLENGES
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1B3A6B] mt-0.5">
            Do & Contribute
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse open government challenges, innovate for the nation, and submit your proposal.
          </p>
        </div>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-gov-card md:grid-cols-3 lg:grid-cols-5">
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search Challenges</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Title, department, keywords or PS code..." className="bg-slate-50/70 rounded-lg border-slate-200" />
        </div>
        <div>
          <label className={LABEL} htmlFor="theme">Sector / Theme</label>
          <select id="theme" name="theme" defaultValue={theme} className={FIELD}>
            <option value="">Any theme</option>
            {themes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="budget">Budget Band</label>
          <select id="budget" name="budget" defaultValue={budget} className={FIELD}>
            <option value="">Any budget</option>
            {budgets.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="state">State / Region</label>
          <select id="state" name="state" defaultValue={state} className={FIELD}>
            <option value="">Any state</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="sort">Sort By</label>
          <select id="sort" name="sort" defaultValue={sort} className={FIELD}>
            <option value="newest">Newest first</option>
            <option value="deadline">Deadline soonest</option>
            <option value="pitches">Most pitched</option>
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-3 lg:col-span-3">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F] text-white rounded-full px-5">
            Apply filters
          </Button>
          {filtersActive && (
            <Link href="/problems">
              <Button type="button" size="sm" variant="ghost" className="rounded-full">
                Clear
              </Button>
            </Link>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>Showing {filtered.length} of {problems.length} open problems</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-14 text-center text-slate-500">
            {problems.length === 0 ? "No open problems right now — check back soon." : "No problems match these filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((problem) => (
            <Card key={problem.id} className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-gov-card hover:shadow-gov-card-hover transition-all duration-300 overflow-hidden group">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  {/* MyGov "Submission Open" badge with lightbulb */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8bb76e] text-white text-[11px] font-semibold tracking-wide shadow-xs">
                    <Lightbulb size={13} className="text-yellow-200 fill-yellow-200 shrink-0" />
                    <span>Submission Open</span>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#1B3A6B] border border-slate-200">
                    {psCode(problem.psNumber)}
                  </span>
                </div>

                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-[#1B3A6B] transition-colors line-clamp-2 leading-snug">
                  {problem.title}
                </CardTitle>

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-1">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{problem.department?.name || "Government Department"}</span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-0">
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {problem.description}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      {problem._count.pitches} Pitch{problem._count.pitches === 1 ? "" : "es"}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {problem.budgetBand || "Budget TBD"}
                    </span>
                  </div>

                  {/* MyGov Terracotta Pill CTA Button */}
                  <Link href={`/problems/${problem.id}`}>
                    <button className="btn-gov-cta text-xs px-4 py-2 flex items-center gap-1.5 font-semibold">
                      <span>Make Contribution</span>
                      <ArrowRight size={13} />
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
