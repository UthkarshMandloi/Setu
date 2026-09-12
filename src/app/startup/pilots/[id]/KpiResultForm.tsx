"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitKpiResult } from "../actions";

export default function KpiResultForm({ kpiId, unit, directionLabel }: { kpiId: string; unit: string; directionLabel: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);
    try {
      const res = await submitKpiResult(new FormData(e.currentTarget));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      formRef.current?.reset();
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not submit the result. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="kpiId" value={kpiId} />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submit a new result</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor={`actual-${kpiId}`} className="text-xs">Measured value{unit ? ` (${unit})` : ""}</Label>
          <Input id={`actual-${kpiId}`} name="actual" type="number" step="any" min={0} required className="bg-white" />
          <p className="text-[11px] text-slate-500">{directionLabel}</p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`evidence-${kpiId}`} className="text-xs">How was it measured?</Label>
          <Textarea
            id={`evidence-${kpiId}`}
            name="evidence"
            rows={2}
            required
            minLength={15}
            placeholder="e.g. Count of farmers registered in the app between 1 Aug and 10 Sep, exported from the admin dashboard"
            className="bg-white"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`file-${kpiId}`} className="text-xs">Evidence file (optional — PDF, PNG/JPG, CSV or Excel, max 5 MB)</Label>
        <Input id={`file-${kpiId}`} name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" className="bg-white" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && (
        <p className="flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Result submitted — the department has been notified.
        </p>
      )}
      <Button type="submit" size="sm" disabled={busy} className="bg-[#D97706] hover:bg-[#b56305]">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Submit result
      </Button>
    </form>
  );
}
