"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Send } from "lucide-react";
import { requestSolutionPilot } from "../actions";
import { useRouter } from "next/navigation";

export default function RequestSolutionForm({ solutionId }: { solutionId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await requestSolutionPilot(solutionId, notes);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Could not submit the request.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-sm">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="text-green-600 mx-auto mb-2" size={32} />
          <p className="font-medium text-green-800">Request sent</p>
          <p className="text-sm text-green-600 mt-1">The startup will be notified of your interest in a pilot.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Request a Pilot</CardTitle>
        <p className="text-sm text-slate-500">This solution hasn&apos;t been piloted through PilotSetu yet — requesting starts a conversation with the startup about a pilot.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes">Why does your department need this?</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1" placeholder="Describe your use case..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-[#D97706] hover:bg-[#b56305]" disabled={loading}>
            <Send size={14} className="mr-2" /> {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
