"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveStartup, rejectStartup } from "./actions";
import { Bot, CheckCircle2, XCircle } from "lucide-react";

export default function ReviewForm({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    await approveStartup(profile.id, notes);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setLoading(true);
    await rejectStartup(profile.id, notes);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED": return "bg-green-100 text-green-800";
      case "NEEDS_REVIEW": return "bg-yellow-100 text-yellow-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Company:</span>
              <p className="font-medium">{profile.companyName}</p>
            </div>
            <div>
              <span className="text-slate-500">Sector:</span>
              <p className="font-medium">{profile.sector || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">CIN:</span>
              <p className="font-medium">{profile.cinNumber || "Not provided"}</p>
            </div>
            <div>
              <span className="text-slate-500">DPIIT:</span>
              <p className="font-medium">{profile.dpiitNumber || "Not provided"}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Description:</span>
              <p className="font-medium">{profile.description || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Uploaded Documents
              <Badge variant="outline" className="text-xs font-normal">
                <Bot size={12} className="mr-1" /> AI-Assisted
              </Badge>
            </CardTitle>
            <CardDescription>Review AI verdicts and override if needed.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.documents.length === 0 ? (
              <p className="text-slate-500 text-sm">No documents uploaded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>AI Verdict</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Fields Found</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-xs">{doc.type}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(doc.aiVerdict)} border-0`}>
                          {doc.aiVerdict}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.round((doc.aiConfidence || 0) * 100)}%</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {JSON.parse(doc.extractedFields || "[]").join(", ") || "None"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-slate-50 border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Current Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-bold text-[#1B3A6B] mb-4">
              {profile.eligibilityScore}<span className="text-lg text-slate-400">/100</span>
            </div>
            <Badge className={`${getStatusColor(profile.verificationStatus)} border-0`}>
              {profile.verificationStatus.replace("_", " ")}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notes / Reason</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes or rejection reason..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
