"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { closeProblem, deleteProblem, publishProblem, revertProblemToDraft } from "./actions";

type Action = "publish" | "delete" | "close" | "revert";

const RUN = { publish: publishProblem, delete: deleteProblem, close: closeProblem, revert: revertProblemToDraft };

const CONFIRM: Record<Action, string> = {
  publish: "Publish this problem? It becomes visible to all verified startups and can no longer be edited.",
  delete: "Delete this draft permanently? This cannot be undone.",
  close: "Close this problem to new pitches? Pitches already received stay available for review.",
  revert: "Move this problem back to draft? It will be hidden from startups until you publish it again.",
};

export default function ProblemManageActions({
  problemId,
  status,
  pitchCount,
  className = "",
}: {
  problemId: string;
  status: string;
  pitchCount: number;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function run(action: Action) {
    if (!window.confirm(CONFIRM[action])) return;
    setBusy(action);
    setError("");
    try {
      const res = await RUN[action](problemId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (action === "delete") router.push("/gov/problems");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const icon = (action: Action, Icon: typeof Send) =>
    busy === action ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icon className="mr-1.5 h-4 w-4" />;

  if (status === "CLOSED") return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <>
            <Link href={`/gov/problems/${problemId}/edit`}>
              <Button size="sm" variant="outline" disabled={!!busy}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            </Link>
            <Button size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]" onClick={() => run("publish")} disabled={!!busy}>
              {icon("publish", Send)} Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => run("delete")}
              disabled={!!busy}
            >
              {icon("delete", Trash2)} Delete
            </Button>
          </>
        )}
        {status === "PUBLISHED" && (
          <>
            {pitchCount === 0 && (
              <Button size="sm" variant="outline" onClick={() => run("revert")} disabled={!!busy}>
                {icon("revert", Undo2)} Move to draft
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => run("close")} disabled={!!busy}>
              {icon("close", Lock)} Close to pitches
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
