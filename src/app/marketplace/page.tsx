import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Unlock, Users } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import SolutionFinder from "./SolutionFinder";
import { psCode } from "@/lib/problemFields";
import { SECTORS } from "@/lib/solutionFields";
import type { TrustBadge } from "@/lib/scoring/kpi";

const BADGES = ["GREEN", "YELLOW", "RED"];
const SORTS = ["impact", "roi", "newest", "requests"];

const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

type Search = {
  q?: string; badge?: string; ip?: string; theme?: string; state?: string; minImpact?: string; sort?: string;
  sq?: string; sector?: string;
};

function hrefWith(current: Search, patch: Partial<Search>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export default async function MarketplacePage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const [passports, verifiedSolutions, officer] = await Promise.all([
    prisma.solutionPassport.findMany({
      where: { isPublished: true },
      include: {
        startup: { select: { companyName: true, sector: true } },
        pilot: {
          include: {
            department: { select: { name: true, state: true } },
            pitch: { include: { problem: { select: { title: true, theme: true, psNumber: true } } } },
          },
        },
        marketplaceRequests: { select: { id: true } },
      },
      orderBy: { impactScore: "desc" },
    }),
    prisma.startupSolution.findMany({
      where: { status: "VERIFIED", isListed: true },
      include: { startup: { select: { companyName: true, sector: true } }, requests: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getOfficer(),
  ]);

  // Officers can seed the AI finder with one of their own problem statements.
  const ownProblems = officer?.departmentId
    ? await prisma.problem.findMany({
        where: { departmentId: officer.departmentId },
        select: { id: true, title: true, description: true, psNumber: true },
        orderBy: { psNumber: "desc" },
      })
    : [];
  const problemOptions = ownProblems.map((p) => ({
    id: p.id,
    label: `${psCode(p.psNumber)} — ${p.title.length > 60 ? `${p.title.slice(0, 60)}…` : p.title}`,
    text: `${p.title}\n\n${p.description}`.slice(0, 3500),
  }));

  const q = searchParams.q?.trim() ?? "";
  const badge = BADGES.includes(searchParams.badge ?? "") ? searchParams.badge! : "";
  const ip = searchParams.ip === "OPEN" || searchParams.ip === "PROPRIETARY" ? searchParams.ip : "";
  const theme = searchParams.theme ?? "";
  const state = searchParams.state ?? "";
  const minImpact = Number(searchParams.minImpact) || 0;
  const sort = SORTS.includes(searchParams.sort ?? "") ? searchParams.sort! : "impact";

  const themes = Array.from(new Set(passports.map((p) => p.pilot.pitch.problem.theme).filter(Boolean))) as string[];
  const states = Array.from(new Set(passports.map((p) => p.pilot.department.state).filter(Boolean))) as string[];

  const psMatch = q.match(/^ps-?0*(\d+)$/i);
  const needle = q.toLowerCase();
  const matchesAllButBadge = (p: (typeof passports)[number]) =>
    (!q ||
      (psMatch
        ? p.pilot.pitch.problem.psNumber === Number(psMatch[1])
        : [p.title, p.summary, p.startup.companyName, p.pilot.pitch.problem.title].some((s) => s.toLowerCase().includes(needle)))) &&
    (!ip || p.ipStatus === ip) &&
    (!theme || p.pilot.pitch.problem.theme === theme) &&
    (!state || p.pilot.department.state === state) &&
    p.impactScore >= minImpact;

  const beforeBadge = passports.filter(matchesAllButBadge);
  const filtered = beforeBadge.filter((p) => !badge || p.trustBadge === badge);
  if (sort === "roi") filtered.sort((a, b) => (b.roiPercent ?? -1e15) - (a.roiPercent ?? -1e15));
  if (sort === "newest") filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (sort === "requests") filtered.sort((a, b) => b.marketplaceRequests.length - a.marketplaceRequests.length);

  const filtersActive = !!(q || badge || ip || theme || state || minImpact);
  const avgImpact = passports.length ? passports.reduce((sum, p) => sum + p.impactScore, 0) / passports.length : 0;

  const stats = [
    { icon: CheckCircle2, tone: "text-green-600", value: String(passports.length), label: "Pilot-proven solutions" },
    { icon: TrendingUp, tone: "text-[#D97706]", value: passports.length ? `${avgImpact.toFixed(1)} / 100` : "—", label: "Average impact score" },
    { icon: Users, tone: "text-blue-600", value: String(passports.reduce((sum, p) => sum + p.marketplaceRequests.length, 0)), label: "Reuse requests" },
    { icon: Unlock, tone: "text-[#1B3A6B]", value: String(passports.filter((p) => p.ipStatus === "OPEN").length), label: "Open-IP solutions" },
  ];

  // Startup-submitted solutions: admin-verified, but never piloted through PilotSetu, so they get their
  // own section rather than being mixed into the KPI-scored passport grid above.
  const sq = searchParams.sq?.trim().toLowerCase() ?? "";
  const sector = searchParams.sector ?? "";
  const sectors = Array.from(new Set(verifiedSolutions.map((s) => s.sector).filter(Boolean))) as string[];
  const filteredSolutions = verifiedSolutions.filter(
    (s) =>
      (!sq || [s.title, s.description, s.problemSolved, s.startup.companyName].some((v) => v.toLowerCase().includes(sq))) &&
      (!sector || s.sector === sector)
  );
  const solutionFiltersActive = !!(sq || sector);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Solution Marketplace</h1>
        <p className="text-slate-500 mt-1">Browse proven solutions with verified ROI. Request direct assignment without re-running procurement.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-slate-200/80 shadow-gov-card bg-white/95">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shadow-xs">
                  <s.icon className={s.tone} size={19} aria-hidden />
                </div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-2">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SolutionFinder problemOptions={problemOptions} canPostProblems={!!officer} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#1B3A6B]">Browse all solutions</h2>
          <div className="flex flex-wrap gap-2">
            <BadgeChip href={hrefWith(searchParams, { badge: undefined })} active={!badge} label="All" count={beforeBadge.length} />
            {BADGES.map((b) => (
              <BadgeChip
                key={b}
                href={hrefWith(searchParams, { badge: b })}
                active={badge === b}
                label={b.charAt(0) + b.slice(1).toLowerCase()}
                count={beforeBadge.filter((p) => p.trustBadge === b).length}
              />
            ))}
          </div>
        </div>

        <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
          {badge && <input type="hidden" name="badge" value={badge} />}
          <div className="md:col-span-2">
            <label className={LABEL} htmlFor="q">Search</label>
            <Input id="q" name="q" defaultValue={q} placeholder="Solution, startup, original problem or PS ID" className="bg-white" />
          </div>
          <div>
            <label className={LABEL} htmlFor="ip">IP status</label>
            <select id="ip" name="ip" defaultValue={ip} className={FIELD}>
              <option value="">Any</option>
              <option value="OPEN">Open IP</option>
              <option value="PROPRIETARY">Proprietary</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="theme">Theme</label>
            <select id="theme" name="theme" defaultValue={theme} className={FIELD}>
              <option value="">Any theme</option>
              {themes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="state">Piloted in</label>
            <select id="state" name="state" defaultValue={state} className={FIELD}>
              <option value="">Any state</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="minImpact">Minimum impact</label>
            <select id="minImpact" name="minImpact" defaultValue={minImpact ? String(minImpact) : ""} className={FIELD}>
              <option value="">Any score</option>
              <option value="50">50+ (Yellow or better)</option>
              <option value="80">80+ (Green only)</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" defaultValue={sort} className={FIELD}>
              <option value="impact">Highest impact</option>
              <option value="roi">Highest ROI</option>
              <option value="newest">Newest</option>
              <option value="requests">Most requested</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
            {filtersActive && (
              <Link href="/marketplace">
                <Button type="button" size="sm" variant="ghost">Clear</Button>
              </Link>
            )}
          </div>
        </form>

        {filtered.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-12 text-center text-slate-500">
              {passports.length === 0
                ? "No proven solutions available yet. Complete pilots to generate passports."
                : "No solutions match these filters."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((passport) => (
              <Card key={passport.id} className="flex flex-col rounded-3xl border border-slate-200/80 shadow-gov-card hover:shadow-gov-card-hover transition-all duration-300 overflow-hidden bg-white">
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#1B3A6B] border border-slate-200">
                      {psCode(passport.pilot.pitch.problem.psNumber)}
                    </span>
                    <TrustBadgeChip badge={passport.trustBadge as TrustBadge} />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-1">{passport.title}</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">
                    {passport.startup.companyName} • {passport.startup.sector}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3 px-5 pb-5 pt-0">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{passport.summary}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Impact score</span>
                      <div className="font-bold text-lg text-slate-900 mt-0.5">
                        {passport.impactScore}
                        <span className="text-xs font-normal text-slate-400"> / 100</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified ROI</span>
                      <div className="font-bold text-lg text-slate-900 mt-0.5">
                        {passport.roiPercent !== null
                          ? `${passport.roiPercent >= 0 ? "+" : "−"}${Math.abs(passport.roiPercent).toFixed(0)}%`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline" className="text-xs rounded-full">
                      {passport.ipStatus === "OPEN" ? "Open IP" : "Proprietary"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Piloted by {passport.pilot.department.name}
                      {passport.pilot.department.state ? `, ${passport.pilot.department.state}` : ""}
                    </span>
                  </div>

                  {passport.marketplaceRequests.length > 0 && (
                    <div className="text-xs text-blue-700 font-medium">
                      {passport.marketplaceRequests.length} reuse request{passport.marketplaceRequests.length === 1 ? "" : "s"}
                    </div>
                  )}

                  <Link href={`/marketplace/${passport.id}`} className="mt-auto pt-2">
                    <Button className="w-full rounded-full bg-[#1B3A6B] hover:bg-[#142A4F] text-xs font-semibold">
                      View Details <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1B3A6B]">Startup-Submitted Solutions</h2>
          <p className="text-sm text-slate-500">
            Solutions startups have already built and listed directly, verified by a platform admin — not yet
            measured through a PilotSetu pilot, so no impact score or trust badge yet.
          </p>
        </div>

        <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-3">
          <div className="md:col-span-2">
            <label className={LABEL} htmlFor="sq">Search</label>
            <Input id="sq" name="sq" defaultValue={sq} placeholder="Solution, startup, or problem it solves" className="bg-white" />
          </div>
          <div>
            <label className={LABEL} htmlFor="sector">Sector</label>
            <select id="sector" name="sector" defaultValue={sector} className={FIELD}>
              <option value="">Any sector</option>
              {(sectors.length ? sectors : SECTORS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-3">
            <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
            {solutionFiltersActive && (
              <Link href="/marketplace">
                <Button type="button" size="sm" variant="ghost">Clear</Button>
              </Link>
            )}
          </div>
        </form>

        {filteredSolutions.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-10 text-center text-slate-500">
              {verifiedSolutions.length === 0 ? "No startup-submitted solutions listed yet." : "No solutions match these filters."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSolutions.map((s) => (
              <Card key={s.id} className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className="border-0 bg-blue-100 text-blue-800 gap-1"><ShieldCheck size={12} /> Platform Verified</Badge>
                    {s.sector && <Badge variant="outline" className="text-xs">{s.sector}</Badge>}
                  </div>
                  <CardTitle className="text-lg text-[#1B3A6B]">{s.title}</CardTitle>
                  <CardDescription className="text-sm">{s.startup.companyName}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3">
                  <p className="text-sm text-slate-600 line-clamp-2">{s.description}</p>
                  <p className="text-xs text-slate-500 line-clamp-2"><span className="font-medium text-slate-600">Solves:</span> {s.problemSolved}</p>
                  {s.requests.length > 0 && (
                    <div className="text-xs text-blue-700">{s.requests.length} department{s.requests.length === 1 ? "" : "s"} interested</div>
                  )}
                  <Link href={`/marketplace/solutions/${s.id}`} className="mt-auto pt-2">
                    <Button className="w-full bg-[#1B3A6B] hover:bg-[#142A4F]">
                      View Details <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
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
