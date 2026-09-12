"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { createSolution, updateSolution } from "./actions";
import { SECTORS, type SolutionDraft } from "@/lib/solutionFields";

export default function SolutionForm({ initial, solutionId }: { initial: SolutionDraft; solutionId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState<null | "DRAFT" | "PENDING">(null);
  const [error, setError] = useState("");

  type TextField = Exclude<keyof SolutionDraft, "sector">;
  const bind = (key: TextField) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function save(status: "DRAFT" | "PENDING") {
    if (!form.title.trim() || !form.description.trim() || !form.problemSolved.trim()) {
      setError("Title, description and the problem it solves are required.");
      return;
    }
    if (status === "PENDING" && !window.confirm("Submit this solution for admin verification? You won't be able to edit it while it's under review.")) {
      return;
    }
    setSaving(status);
    setError("");
    try {
      const res = solutionId ? await updateSolution(solutionId, form, status) : await createSolution(form, status);
      if (!res.ok) {
        setError(res.error);
        setSaving(null);
        return;
      }
      router.push("/startup/solutions");
      router.refresh();
    } catch {
      setError("Could not save the solution. Please try again.");
      setSaving(null);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1B3A6B]">{solutionId ? "Edit solution" : "List a solution"}</CardTitle>
        <CardDescription>
          Describe a solution you&apos;ve already built — not tied to any specific problem statement. Once submitted, an
          admin reviews it; verified solutions appear on the marketplace for departments to discover directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Solution title" className="md:col-span-2">
            <Input {...bind("title")} placeholder="e.g. AI-powered crop yield predictor" />
          </Field>

          <Field label="Sector">
            <Select value={form.sector} onValueChange={(v) => setForm((f) => ({ ...f, sector: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Evidence link (optional)">
            <Input {...bind("evidenceUrl")} type="url" placeholder="Demo video, case study or spec sheet URL" />
          </Field>

          <Field label="What does it do?" className="md:col-span-2">
            <Textarea rows={5} {...bind("description")} placeholder="Describe the solution — what it is, how it works" />
          </Field>

          <Field label="What problem does it solve?" hint="A generic pain point, not tied to one department" className="md:col-span-2">
            <Textarea rows={3} {...bind("problemSolved")} />
          </Field>

          <Field label="Key features" hint="One per line" className="md:col-span-2">
            <Textarea rows={4} {...bind("keyFeatures")} />
          </Field>

          <Field label="Existing deployments / proof" hint="Other clients, states, pilots elsewhere — one per line" className="md:col-span-2">
            <Textarea rows={4} {...bind("deploymentProof")} />
          </Field>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button onClick={() => save("PENDING")} disabled={!!saving} className="bg-[#1B3A6B] hover:bg-[#142A4F]">
            {saving === "PENDING" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="mr-2 h-4 w-4" /> Submit for verification</>}
          </Button>
          <Button variant="outline" onClick={() => save("DRAFT")} disabled={!!saving}>
            {saving === "DRAFT" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save as draft"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/startup/solutions")} disabled={!!saving}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
