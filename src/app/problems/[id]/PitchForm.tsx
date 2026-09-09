"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitPitch, updatePitch } from "./actions";

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Technology Readiness Level (1-9)</Label>
          <Input
            name="trl"
            type="number"
            min={1}
            max={9}
            defaultValue={existingPitch?.techReadinessLevel || 5}
            required
          />
        </div>
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
