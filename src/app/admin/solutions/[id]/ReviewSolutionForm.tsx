"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { rejectSolution, verifySolution } from "../actions";

export default function ReviewSolutionForm({ solutionId }: { solutionId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function handleVerify() {
    setBusy("verify");
    setError("");
    try {
      await verifySolution(solutionId, notes);
      router.push("/admin/solutions");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Could not verify this solution.");
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      setError("Please explain what the startup should fix before rejecting.");
      return;
    }
    setBusy("reject");
    setError("");
    try {
      await rejectSolution(solutionId, notes);
      router.push("/admin/solutions");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Could not reject this solution.");
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Verification decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Notes {`(required if rejecting)`}</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Verification notes, or the reason for rejection..." rows={4} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={!!busy} className="flex-1 bg-green-600 hover:bg-green-700">
            {busy === "verify" ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
            Verify &amp; list
          </Button>
          <Button onClick={handleReject} disabled={!!busy} variant="destructive" className="flex-1">
            {busy === "reject" ? <Loader2 size={16} className="mr-2 animate-spin" /> : <XCircle size={16} className="mr-2" />}
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
