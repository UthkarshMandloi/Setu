"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProblem } from "./actions";
import { useRouter } from "next/navigation";

export default function ProblemForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createProblem(formData);
    setLoading(false);
    router.push("/gov/problems");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-lg p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 space-y-2">
          <Label>Title</Label>
          <Input name="title" placeholder="e.g., AI-based Traffic Signal Optimization" required />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            placeholder="Describe the problem in detail..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <Select name="theme" defaultValue="e-Governance">
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="e-Governance">e-Governance</SelectItem>
              <SelectItem value="Smart Cities">Smart Cities</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Agriculture">Agriculture</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Budget Band</Label>
          <Select name="budgetBand" defaultValue="INR 10L - 25L">
            <SelectTrigger>
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR < 10L">Less than ₹10 Lakhs</SelectItem>
              <SelectItem value="INR 10L - 25L">₹10L - ₹25L</SelectItem>
              <SelectItem value="INR 25L - 50L">₹25L - ₹50L</SelectItem>
              <SelectItem value="INR 50L+">More than ₹50L</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <Input name="deadline" type="date" />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" defaultValue="DRAFT">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Expected Outcomes</Label>
          <Textarea
            name="expectedOutcomes"
            placeholder="What should the solution achieve?"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="bg-[#1B3A6B]">
          {loading ? "Creating..." : "Create Problem"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
