"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Loader2 } from "lucide-react";
import { generatePilotPassport } from "../actions";

export default function GeneratePassportButton({ pilotId }: { pilotId: string }) {
  const router = useRouter();
  const [ipStatus, setIpStatus] = useState<"PROPRIETARY" | "OPEN">("PROPRIETARY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!window.confirm("Generate the Solution Passport? It records today's KPI results, impact score and ROI, and lists the solution on the marketplace.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await generatePilotPassport(pilotId, ipStatus);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not generate the passport. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="ipStatus" className="text-xs font-medium text-slate-600">IP status for reuse</label>
        <select
          id="ipStatus"
          value={ipStatus}
          onChange={(e) => setIpStatus(e.target.value as "PROPRIETARY" | "OPEN")}
          className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm"
        >
          <option value="PROPRIETARY">Proprietary — other departments assign it to this startup</option>
          <option value="OPEN">Open IP — similar startups may also implement it</option>
        </select>
      </div>
      <Button onClick={generate} disabled={busy} className="w-full bg-[#1B3A6B] hover:bg-[#142A4F]">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
        Generate Solution Passport
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
