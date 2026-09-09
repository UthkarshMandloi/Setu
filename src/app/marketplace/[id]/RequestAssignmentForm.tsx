"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestAssignment } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";

export default function RequestAssignmentForm({
  passportId,
  existingRequests
}: {
  passportId: string;
  existingRequests: any[];
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert("Please provide a note explaining why you want this solution.");
      return;
    }

    setLoading(true);
    try {
      await requestAssignment(passportId, notes);
      setSuccess(true);
      setTimeout(() => router.refresh(), 1000);
    } catch (error: any) {
      alert(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-sm">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="text-green-600 mx-auto mb-2" size={32} />
          <p className="font-medium text-green-800">Request Submitted</p>
          <p className="text-sm text-green-600 mt-1">
            The startup will be notified of your interest.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Request Assignment</CardTitle>
        <p className="text-sm text-slate-500">
          Deploy this proven solution in your department without re-running procurement.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes">Why do you need this solution?</Label>
            <Textarea
              id="notes"
              placeholder="Describe how this solution fits your department's needs..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#D97706] hover:bg-[#b56305]"
            disabled={loading}
          >
            <Send size={14} className="mr-2" />
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
