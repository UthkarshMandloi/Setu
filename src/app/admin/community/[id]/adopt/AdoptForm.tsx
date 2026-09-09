"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adoptProblem } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function AdoptForm({
  reportId,
  title,
  description,
  departments,
  userDepartmentId
}: {
  reportId: string;
  title: string;
  description: string;
  departments: any[];
  userDepartmentId?: string;
}) {
  const [problemTitle, setProblemTitle] = useState(title);
  const [problemDesc, setProblemDesc] = useState(description);
  const [departmentId, setDepartmentId] = useState(userDepartmentId || "");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemTitle.trim() || !problemDesc.trim() || !departmentId) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await adoptProblem({
        reportId,
        title: problemTitle,
        description: problemDesc,
        departmentId,
        budgetBand: budget || undefined
      });
      setSuccess(true);
      setTimeout(() => router.push("/admin/community"), 1500);
    } catch (error: any) {
      alert(error.message || "Failed to adopt problem");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-sm">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="text-green-600 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-semibold text-green-800">Problem Adopted</h3>
          <p className="text-sm text-green-600 mt-2">
            Redirecting to community reports...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Create Official Problem</CardTitle>
        <p className="text-sm text-slate-500">
          Fill in the details to adopt this report into the official registry.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Problem Title *</Label>
            <Input
              id="title"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={problemDesc}
              onChange={(e) => setProblemDesc(e.target.value)}
              rows={5}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="department">Responsible Department *</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} • {dept.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="budget">Budget Band</Label>
            <Input
              id="budget"
              placeholder="e.g., INR 10L - 25L"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once adopted, this problem will be visible to verified startups for pitching solutions.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Adopting..." : "Adopt into Registry"} <ArrowRight size={14} className="ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
}

function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className || ""}`}>{children}</h3>;
}

function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-6 pt-0 ${className || ""}`}>{children}</div>;
}
