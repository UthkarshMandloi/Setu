"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Sparkles, Wrench } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import { findSimilarSolutions, type SolutionMatchView } from "./actions";
import type { TrustBadge } from "@/lib/scoring/kpi";

type ProblemOption = { id: string; label: string; text: string };
type FinderState = { understanding: string; simulated: boolean; matches: SolutionMatchView[] };

const EFFORT_TONE: Record<string, string> = {
  LOW: "border-green-200 bg-green-50 text-green-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-red-200 bg-red-50 text-red-800",
};

export default function SolutionFinder({ problemOptions, canPostProblems }: { problemOptions: ProblemOption[]; canPostProblems: boolean }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FinderState | null>(null);

  async function search() {
    setBusy(true);
    setError("");
    try {
      const res = await findSimilarSolutions(query);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
    } catch {
      setError("The AI search could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-[#1B3A6B]/20 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#1B3A6B]">
          <Sparkles size={18} className="text-[#D97706]" /> Find a proven solution for your problem
        </CardTitle>
        <CardDescription>
          Describe the problem you face — English, Hindi or Marathi. The AI compares it with the problems that proven
          solutions have already solved, and tells you what would need to change to reuse them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {problemOptions.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="fromPs" className="text-xs font-medium text-slate-600">
              Start from one of your problem statements (optional)
            </label>
            <select
              id="fromPs"
              defaultValue=""
              onChange={(e) => {
                const option = problemOptions.find((o) => o.id === e.target.value);
                if (option) setQuery(option.text);
              }}
              className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm"
            >
              <option value="">— or describe a new problem below —</option>
              {problemOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="e.g. In Nashik district, PWD engineers inspect roads manually and potholes stay unreported for weeks during the monsoon…"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={search}
            disabled={busy || query.trim().length < 20}
            className="bg-[#D97706] hover:bg-[#b56305]"
          >
            {busy ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Comparing with proven solutions…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Find similar solutions</>
            )}
          </Button>
          {result?.simulated && <Badge className="border-0 bg-yellow-100 text-yellow-800">Simulated for demo — AI offline, keyword match only</Badge>}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {result && (
          <div className="space-y-4 border-t pt-5">
            {result.understanding && (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">Your problem, as understood: </span>
                {result.understanding}
              </p>
            )}

            {result.matches.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No proven solution is close enough to this problem yet.
                {canPostProblems && (
                  <>
                    {" "}
                    <Link href="/gov/problems/new" className="font-medium text-[#1B3A6B] hover:underline">
                      Post it as a new problem statement
                    </Link>{" "}
                    so startups can pitch.
                  </>
                )}
              </div>
            ) : (
              result.matches.map((match, i) => <MatchCard key={match.passportId} match={match} rank={i + 1} />)
            )}

            <p className="text-xs text-slate-500">
              AI-assisted, simulated for demo — confirm the fit with the originating department before adopting.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchCard({ match: m, rank }: { match: SolutionMatchView; rank: number }) {
  const direct = m.fit === "DIRECT";
  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">#{rank}</span>
            <Link href={`/marketplace/${m.passportId}`} className="font-semibold text-[#1B3A6B] hover:underline">
              {m.title}
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            {m.startupName}
            {m.sector ? ` · ${m.sector}` : ""} · piloted by {m.originDepartment}
            {m.originState ? `, ${m.originState}` : ""} for <span className="font-mono">{m.psCode}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <TrustBadgeChip badge={m.trustBadge as TrustBadge} />
            <Badge variant="outline">{m.ipStatus === "OPEN" ? "Open IP" : "Proprietary"}</Badge>
            <span className="text-xs text-slate-500">
              Impact {m.impactScore}/100
              {m.roiPercent !== null && ` · ROI ${m.roiPercent >= 0 ? "+" : "−"}${Math.abs(m.roiPercent).toFixed(0)}%`}
            </span>
          </div>
        </div>
        <div className="w-36 shrink-0 space-y-1 text-right">
          <p className="text-2xl font-semibold text-slate-900">{m.similarity}%</p>
          <div className="h-1.5 rounded-full bg-slate-100" aria-hidden>
            <div className="h-full rounded-full bg-[#1B3A6B]" style={{ width: `${m.similarity}%` }} />
          </div>
          <p className="text-xs text-slate-500">problem similarity</p>
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          direct ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
        }`}
      >
        {direct ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Wrench className="h-3.5 w-3.5" aria-hidden />}
        {direct ? "Direct fit — can be adopted as-is" : "Adaptable — fits with the modifications below"}
      </span>

      {m.whyItMatches && (
        <p className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">Why it matches: </span>
          {m.whyItMatches}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {m.gaps.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What&apos;s different</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
              {m.gaps.map((gap, j) => (
                <li key={j}>{gap}</li>
              ))}
            </ul>
          </div>
        )}
        {m.modifications.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modifications to make it fit</p>
            <ul className="mt-1 space-y-1.5">
              {m.modifications.map((mod, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className={`mt-0.5 shrink-0 whitespace-nowrap rounded border px-1.5 text-[10px] font-semibold uppercase ${EFFORT_TONE[mod.effort]}`}>
                    {mod.effort.toLowerCase()} effort
                  </span>
                  {mod.change}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm ${
          m.reusable ? "border-blue-200 bg-blue-50 text-blue-900" : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <div>
          <p className="flex items-center gap-1.5 font-medium">
            {!m.reusable && <AlertCircle className="h-4 w-4" aria-hidden />}
            {m.route}
          </p>
          <p className="text-xs">{m.routeDetail}</p>
        </div>
        <Link href={`/marketplace/${m.passportId}`}>
          <Button size="sm" variant="outline" className="bg-white">
            View passport <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
