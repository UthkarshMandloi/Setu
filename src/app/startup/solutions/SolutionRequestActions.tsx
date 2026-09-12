"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { respondToSolutionRequest } from "../../marketplace/solutions/actions";

export default function SolutionRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");

  async function respond(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError("");
    try {
      const res = await respondToSolutionRequest(requestId, accept);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save your response.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button size="sm" variant="outline" onClick={() => respond(false)} disabled={!!busy}>
        {busy === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
      </Button>
      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => respond(true)} disabled={!!busy}>
        {busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
      </Button>
    </div>
  );
}
