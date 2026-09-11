"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitPitch, updatePitch } from "./actions";
import { TRL_LEVELS } from "@/lib/trl";

export default function PitchForm({ problemId, existingPitch }: { problemId: string; existingPitch: any }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    if (existingPitch) {
      await updatePitch(existingPitch.id, formData);
    } else {
      await submitPitch(problemId, formData);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Solution Summary</Label>
        <Textarea
          name="solutionSummary"
          defaultValue={existingPitch?.solutionSummary || ""}
          placeholder="Describe your solution in 2-3 paragraphs..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trl">Technology Readiness Level (TRL)</Label>
        <select
          id="trl"
          name="trl"
          defaultValue={existingPitch?.techReadinessLevel || 5}
          required
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
        >
          {TRL_LEVELS.map((t) => (
            <option key={t.level} value={t.level}>
              TRL {t.level} — {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          How mature is your solution today? 1–3 research, 4–6 prototype, 7–9 deployment-ready. Officers see this when comparing pitches.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Team Size & Expertise</Label>
          <Input
            name="team"
            defaultValue={existingPitch?.team || ""}
            placeholder="e.g., 5 engineers, 2 domain experts"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Supporting URL (optional)</Label>
        <Input
          name="supportingUrl"
          type="url"
          defaultValue={existingPitch?.supportingUrl || ""}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading} className="bg-[#D97706]">
          {loading ? "Submitting..." : existingPitch ? "Update Pitch" : "Submit Pitch"}
        </Button>
        {existingPitch && (
          <Badge variant="secondary">
            Status: {existingPitch.status}
          </Badge>
        )}
      </div>
    </form>
  );
}
