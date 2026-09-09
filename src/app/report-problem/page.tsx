import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportProblemForm from "./ReportProblemForm";

export default function ReportProblemPage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Report a Problem</h1>
          <p className="text-slate-500 mt-2">
            Help us identify unaddressed challenges in your community. Your report will be reviewed by government officials.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Community Problem Report</CardTitle>
            <p className="text-sm text-slate-500">
              Describe the problem you're facing. If validated, it may be adopted into the official problem registry.
            </p>
          </CardHeader>
          <CardContent>
            <ReportProblemForm />
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Your report is submitted to the platform admin for review</li>
            <li>If validated, it will be adopted into the official problem registry</li>
            <li>Verified startups can then pitch solutions</li>
            <li>You can check back to see if your problem has been addressed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
