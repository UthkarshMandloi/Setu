"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { createProblem } from "./actions";
import { updateProblem } from "../actions";
import { BUDGET_BANDS, THEMES, type KpiDirection, type ProblemDraft } from "@/lib/problemFields";

type Props = {
  initial: ProblemDraft;
  aiAssisted: boolean;
  simulated: boolean;
  originalBrief: string;
  /** Set when editing an existing draft; otherwise a new problem is created. */
  problemId?: string;
  initialDeadline?: string;
  onBack?: () => void;
  backHref?: string;
  backLabel: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
};

// Target kept as text while editing so partial input like "0." isn't lost.
type KpiRow = { metric: string; target: string; unit: string; direction: KpiDirection };

const NATIVE_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ProblemForm({
  initial,
  aiAssisted,
  simulated,
  originalBrief,
  problemId,
  initialDeadline,
  onBack,
  backHref,
  backLabel,
  onRegenerate,
  regenerating,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial.title,
    theme: initial.theme,
    budgetBand: initial.budgetBand,
    deadline: initialDeadline ?? daysFromNow(30),
    pilotDurationWeeks: String(initial.timelineWeeks),
    description: initial.description,
    scope: initial.scope,
    expectedOutcomes: initial.expectedOutcomes,
    constraints: initial.constraints,
    targetBeneficiaries: initial.targetBeneficiaries,
  });
  const [kpis, setKpis] = useState<KpiRow[]>(initial.suggestedKpis.map((k) => ({ ...k, target: String(k.target) })));
  const [saving, setSaving] = useState<null | "DRAFT" | "PUBLISHED">(null);
  const [error, setError] = useState("");

  type TextField = Exclude<keyof typeof form, "theme" | "budgetBand">;
  const bind = (key: TextField) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const updateKpi = (i: number, patch: Partial<KpiRow>) =>
    setKpis((rows) => rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const goBack = () => (onBack ? onBack() : router.push(backHref ?? "/gov/problems"));

  async function save(status: "DRAFT" | "PUBLISHED") {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and technical description are required.");
      return;
    }
    if (status === "PUBLISHED" && !window.confirm("Publish this problem? It becomes visible to all verified startups and can no longer be edited.")) {
      return;
    }
    setSaving(status);
    setError("");
    const payload = {
      ...form,
      pilotDurationWeeks: form.pilotDurationWeeks ? Number(form.pilotDurationWeeks) : null,
      suggestedKpis: kpis
        .filter((k) => k.metric.trim() && k.target.trim() && Number.isFinite(Number(k.target)))
        .map((k) => ({ ...k, target: Number(k.target) })),
      originalBrief,
      aiAssisted,
    };
    try {
      const res = problemId ? await updateProblem(problemId, payload, status) : await createProblem(payload, status);
      if (!res.ok) {
        setError(res.error);
        setSaving(null);
        return;
      }
      router.push(`/problems/${res.id}`);
      router.refresh();
    } catch {
      setError("Could not save the problem. Please try again.");
      setSaving(null);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[#1B3A6B]">Review &amp; edit problem statement</CardTitle>
            <CardDescription>Every field is editable. Startups will see exactly what you publish.</CardDescription>
          </div>
          {onRegenerate && (
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating || !!saving}>
              {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate draft
            </Button>
          )}
        </div>
        {aiAssisted && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-medium">AI-assisted draft — review every field before publishing.</span>
            {simulated && <Badge className="border-0 bg-yellow-100 text-yellow-800">Simulated for demo — AI offline</Badge>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {initial.assumptions.length > 0 && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-medium text-[#1B3A6B]">Assumptions the assistant made — please confirm or correct them:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
              {initial.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Problem title" className="md:col-span-2">
            <Input {...bind("title")} placeholder="Short, specific title" />
          </Field>

          <Field label="Theme">
            <Select value={form.theme} onValueChange={(v) => setForm((f) => ({ ...f, theme: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Budget band">
            <Select value={form.budgetBand} onValueChange={(v) => setForm((f) => ({ ...f, budgetBand: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_BANDS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Pitch submission deadline">
            <Input type="date" {...bind("deadline")} />
          </Field>

          <Field label="Proposed pilot duration (weeks)">
            <Input type="number" min={1} max={104} {...bind("pilotDurationWeeks")} />
          </Field>

          <Field label="Technical problem description" className="md:col-span-2">
            <Textarea rows={10} {...bind("description")} placeholder="Context, current process and pain points, scale" />
          </Field>

          <Field label="Scope & technical requirements" hint="One requirement per line" className="md:col-span-2">
            <Textarea rows={6} {...bind("scope")} />
          </Field>

          <Field label="Expected outcomes" hint="One outcome per line — measurable where possible" className="md:col-span-2">
            <Textarea rows={5} {...bind("expectedOutcomes")} />
          </Field>

          <Field label="Constraints" hint="Budget, timeline, systems to integrate with, infrastructure" className="md:col-span-2">
            <Textarea rows={4} {...bind("constraints")} />
          </Field>

          <Field label="Target beneficiaries" className="md:col-span-2">
            <Input {...bind("targetBeneficiaries")} placeholder="Who benefits if this is solved?" />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <Label>Success KPIs (proposed)</Label>
              <p className="text-xs text-slate-500">Carried forward as the pilot&apos;s KPI targets — can be finalised when a startup is selected.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKpis((rows) => [...rows, { metric: "", target: "", unit: "", direction: "HIGHER_IS_BETTER" }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add KPI
            </Button>
          </div>
          {kpis.length === 0 ? (
            <p className="text-sm text-slate-500">No KPIs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Metric</th>
                    <th className="w-28 pb-2 font-medium">Target</th>
                    <th className="w-28 pb-2 font-medium">Unit</th>
                    <th className="w-44 pb-2 font-medium">Direction</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k, i) => (
                    <tr key={i} className="align-top">
                      <td className="pb-2 pr-2">
                        <Input value={k.metric} onChange={(e) => updateKpi(i, { metric: e.target.value })} placeholder="e.g. Average processing time" />
                      </td>
                      <td className="pb-2 pr-2">
                        <Input type="number" value={k.target} onChange={(e) => updateKpi(i, { target: e.target.value })} />
                      </td>
                      <td className="pb-2 pr-2">
                        <Input value={k.unit} onChange={(e) => updateKpi(i, { unit: e.target.value })} placeholder="days, %, count" />
                      </td>
                      <td className="pb-2 pr-2">
                        <select
                          className={NATIVE_SELECT}
                          value={k.direction}
                          onChange={(e) => updateKpi(i, { direction: e.target.value as KpiDirection })}
                        >
                          <option value="HIGHER_IS_BETTER">Higher is better</option>
                          <option value="LOWER_IS_BETTER">Lower is better</option>
                        </select>
                      </td>
                      <td className="pb-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove KPI"
                          onClick={() => setKpis((rows) => rows.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {originalBrief && (
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Your original description</summary>
            <p className="mt-2 whitespace-pre-line text-slate-600">{originalBrief}</p>
          </details>
        )}

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button onClick={() => save("PUBLISHED")} disabled={!!saving} className="bg-[#1B3A6B] hover:bg-[#142A4F]">
            {saving === "PUBLISHED" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : "Publish problem"}
          </Button>
          <Button variant="outline" onClick={() => save("DRAFT")} disabled={!!saving}>
            {saving === "DRAFT" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : problemId ? "Save draft" : "Save as draft"}
          </Button>
          <Button variant="ghost" onClick={goBack} disabled={!!saving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
