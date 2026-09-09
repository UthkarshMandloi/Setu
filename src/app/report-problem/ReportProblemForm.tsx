"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitProblemReport } from "./actions";
import { CheckCircle2, Send } from "lucide-react";

export default function ReportProblemForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [reporter, setReporter] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      await submitProblemReport({ title, description, location, reporter });
      setSuccess(true);
    } catch (error: any) {
      alert(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="text-green-600 mx-auto mb-3" size={48} />
        <h3 className="text-lg font-semibold text-green-800">Report Submitted</h3>
        <p className="text-sm text-green-600 mt-2">
          Thank you for your contribution. Government officials will review your submission.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Problem Title *</Label>
        <Input
          id="title"
          placeholder="Brief title of the problem"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the problem in detail. What is the issue? Who is affected? How long has it been happening?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="City, district, or area affected"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="reporter">Your Name (Optional)</Label>
        <Input
          id="reporter"
          placeholder="Anonymous reports are accepted"
          value={reporter}
          onChange={(e) => setReporter(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#D97706] hover:bg-[#b56305]"
        disabled={loading}
      >
        <Send size={14} className="mr-2" />
        {loading ? "Submitting..." : "Submit Report"}
      </Button>
    </form>
  );
}
