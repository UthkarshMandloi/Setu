"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, PenLine, Sparkles } from "lucide-react";
import { askProblemAssistant } from "./actions";
import ProblemForm from "./ProblemForm";
import { MAX_CLARIFY_ROUNDS, emptyDraft, type ClarifyRound, type ProblemDraft } from "@/lib/problemFields";

type Step = "describe" | "clarify" | "review";
type Busy = null | "analyse" | "answers" | "draft";

const PROMPT_CHIPS = [
  "What is going wrong?",
  "Who is affected?",
  "Where, and how many?",
  "How is it handled today?",
  "What would success look like?",
];

export default function ProblemAssistant({ departmentName }: { departmentName: string }) {
  const [step, setStep] = useState<Step>("describe");
  const [brief, setBrief] = useState("");
  const [rounds, setRounds] = useState<ClarifyRound[]>([]);
  const [pending, setPending] = useState<{ understanding: string; questions: string[]; answers: string[] } | null>(null);
  const [draft, setDraft] = useState<ProblemDraft | null>(null);
  const [draftVersion, setDraftVersion] = useState(0); // remounts the form whenever a fresh draft arrives
  const [aiAssisted, setAiAssisted] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");

  const wordCount = brief.trim() ? brief.trim().split(/\s+/).length : 0;

  async function ask(nextRounds: ClarifyRound[], forceDraft: boolean, mode: Exclude<Busy, null>) {
    setBusy(mode);
    setError("");
    try {
      const res = await askProblemAssistant({ brief, rounds: nextRounds, forceDraft });
      if (res.kind === "error") {
        setError(res.error);
        return;
      }
      setRounds(nextRounds);
      setSimulated(res.simulated);
      if (res.kind === "questions") {
        setPending({ understanding: res.understanding, questions: res.questions, answers: res.questions.map(() => "") });
        setStep("clarify");
      } else {
        setDraft(res.draft);
        setAiAssisted(true);
        setDraftVersion((v) => v + 1);
        setPending(null);
        setStep("review");
      }
    } catch {
      setError("The assistant could not be reached. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const roundsWithPendingAnswers = (): ClarifyRound[] =>
    pending ? [...rounds, { questions: pending.questions, answers: pending.answers }] : rounds;

  function startManual() {
    setDraft(emptyDraft());
    setAiAssisted(false);
    setSimulated(false);
    setDraftVersion((v) => v + 1);
    setStep("review");
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {step === "describe" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1B3A6B]">
              <Sparkles size={18} className="text-[#D97706]" /> Describe the problem in your own words
            </CardTitle>
            <CardDescription>
              Posting for <span className="font-medium text-slate-700">{departmentName}</span>. Write it the way you
              would explain it to a colleague — English, Hindi or Marathi is fine. The assistant will ask follow-up
              questions if anything is unclear, then draft a structured problem statement for you to edit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PROMPT_CHIPS.map((chip) => (
                <span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  {chip}
                </span>
              ))}
            </div>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={9}
              placeholder="e.g. After every hailstorm, farmers in Vidarbha wait 3–4 months for crop-loss compensation because talathis survey each field by hand and the paperwork moves through three offices…"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{wordCount} words</span>
              <span>More detail means fewer follow-up questions</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => ask([], false, "analyse")}
                disabled={!!busy || brief.trim().length < 15}
                className="bg-[#D97706] hover:bg-[#b56305]"
              >
                {busy === "analyse" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your description…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Analyse with AI</>
                )}
              </Button>
              <Button variant="ghost" onClick={startManual} disabled={!!busy}>
                <PenLine className="mr-2 h-4 w-4" /> Skip AI and fill the form manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "clarify" && pending && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-[#1B3A6B]">A few questions before drafting</CardTitle>
              <div className="flex items-center gap-2">
                {simulated && <Badge className="border-0 bg-yellow-100 text-yellow-800">Simulated for demo — AI offline</Badge>}
                <Badge variant="outline">Round {rounds.length + 1} of {MAX_CLARIFY_ROUNDS}</Badge>
              </div>
            </div>
            <CardDescription>Answer what you can in a line or two. Leave anything you don&apos;t know blank.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {pending.understanding && (
              <div className="rounded-md border-l-4 border-[#1B3A6B] bg-blue-50/60 p-3 text-sm text-slate-700">
                <span className="font-semibold text-[#1B3A6B]">What I understood: </span>
                {pending.understanding}
              </div>
            )}
            {pending.questions.map((question, i) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={`answer-${i}`} className="text-sm font-medium text-slate-800">
                  {i + 1}. {question}
                </Label>
                <Textarea
                  id={`answer-${i}`}
                  rows={2}
                  value={pending.answers[i]}
                  onChange={(e) =>
                    setPending((p) => p && { ...p, answers: p.answers.map((a, j) => (j === i ? e.target.value : a)) })
                  }
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => ask(roundsWithPendingAnswers(), false, "answers")}
                disabled={!!busy}
                className="bg-[#1B3A6B] hover:bg-[#142A4F]"
              >
                {busy === "answers" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking…</> : "Continue"}
              </Button>
              <Button variant="outline" onClick={() => ask(roundsWithPendingAnswers(), true, "draft")} disabled={!!busy}>
                {busy === "draft" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting…</> : "Skip remaining questions — draft now"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("describe")} disabled={!!busy}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Edit description
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && draft && (
        <ProblemForm
          key={draftVersion}
          initial={draft}
          aiAssisted={aiAssisted}
          simulated={simulated}
          originalBrief={aiAssisted ? brief : ""}
          onBack={() => setStep("describe")}
          backLabel={aiAssisted ? "Edit description" : "Back"}
          onRegenerate={aiAssisted ? () => ask(rounds, true, "draft") : undefined}
          regenerating={busy === "draft"}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: [Step, string][] = [
    ["describe", "Describe"],
    ["clarify", "Clarify"],
    ["review", "Review & publish"],
  ];
  const current = steps.findIndex(([s]) => s === step);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i < current ? "bg-green-600 text-white" : i === current ? "bg-[#1B3A6B] text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </span>
          <span className={i === current ? "font-medium text-[#1B3A6B]" : "text-slate-500"}>{label}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-slate-300" />}
        </li>
      ))}
    </ol>
  );
}
