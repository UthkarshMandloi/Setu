"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { deleteSolution, setSolutionListed, updateSolution } from "./actions";
import type { SolutionDraft } from "@/lib/solutionFields";

type Action = "submit" | "delete" | "list" | "unlist";

export default function SolutionActions({
  id,
  status,
  isListed,
  draft,
}: {
  id: string;
  status: string;
  isListed: boolean;
  draft: SolutionDraft;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function run(action: Action) {
    setBusy(action);
    setError("");
    try {
      const res =
        action === "delete"
          ? await deleteSolution(id)
          : action === "submit"
            ? await updateSolution(id, draft, "PENDING")
            : await setSolutionListed(id, action === "list");
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const icon = (action: Action, Icon: typeof Send) =>
    busy === action ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icon className="mr-1.5 h-4 w-4" />;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {(status === "DRAFT" || status === "REJECTED") && (
          <>
            <Link href={`/startup/solutions/${id}/edit`}>
              <Button size="sm" variant="outline" disabled={!!busy}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            </Link>
            <Button size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]" onClick={() => run("submit")} disabled={!!busy}>
              {icon("submit", Send)} {status === "REJECTED" ? "Resubmit" : "Submit for review"}
            </Button>
          </>
        )}
        {status === "DRAFT" && (
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={() => { if (window.confirm("Delete this draft permanently?")) run("delete"); }}
            disabled={!!busy}
          >
            {icon("delete", Trash2)} Delete
          </Button>
        )}
        {status === "VERIFIED" && (
          <Button size="sm" variant="outline" onClick={() => run(isListed ? "unlist" : "list")} disabled={!!busy}>
            {isListed ? icon("unlist", EyeOff) : icon("list", Eye)} {isListed ? "Unlist from marketplace" : "List on marketplace"}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
