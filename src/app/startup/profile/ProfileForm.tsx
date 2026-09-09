"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateProfile, uploadDocument } from "./actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProfileForm({ initialProfile }: { initialProfile: any }) {
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "NEEDS_REVIEW": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "REJECTED": return "bg-red-100 text-red-800 hover:bg-red-100";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-100";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateProfile(formData);
    setLoading(false);
  };

  const handleUploadDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDocLoading(true);
    const formData = new FormData(e.currentTarget);
    await uploadDocument(formData);
    e.currentTarget.reset();
    setDocLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <form onSubmit={handleSaveProfile}>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic details required for Setu eligibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input name="companyName" defaultValue={initialProfile?.companyName || ""} required />
                </div>
                <div className="space-y-2">
                  <Label>Sector</Label>
                  <Input name="sector" defaultValue={initialProfile?.sector || ""} required />
                </div>
                <div className="space-y-2">
                  <Label>CIN Number</Label>
                  <Input name="cinNumber" defaultValue={initialProfile?.cinNumber || ""} />
                </div>
                <div className="space-y-2">
                  <Label>DPIIT Recognition Number</Label>
                  <Input name="dpiitNumber" defaultValue={initialProfile?.dpiitNumber || ""} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Website</Label>
                  <Input name="website" defaultValue={initialProfile?.website || ""} type="url" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="bg-[#1B3A6B]">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {initialProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Upload docs to get verified. Evaluated instantly via AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadDoc} className="flex gap-4 mb-6 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Document Type</Label>
                  <Select name="type" required defaultValue="INCORPORATION">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCORPORATION">Certificate of Incorporation</SelectItem>
                      <SelectItem value="PAN">Company PAN</SelectItem>
                      <SelectItem value="DPIIT">DPIIT Certificate</SelectItem>
                      <SelectItem value="GST">GST Registration</SelectItem>
                      <SelectItem value="FINANCIALS">Audited Financials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1">
                  <Label>File Upload (Simulated)</Label>
                  <Input type="file" name="file" required />
                </div>
                <Button type="submit" disabled={docLoading} className="bg-[#D97706]">
                  {docLoading ? "Uploading & Analyzing..." : "Upload"}
                </Button>
              </form>

              {initialProfile.documents && initialProfile.documents.length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>AI Verdict</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialProfile.documents.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium text-xs">{doc.type}</TableCell>
                          <TableCell className="text-blue-600 text-xs truncate max-w-[120px]">
                            <a href="#">{doc.url.split("/").pop()}</a>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(doc.aiVerdict)} border-0 shadow-none font-medium`}>
                                {doc.aiVerdict}
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Bot size={16} className="text-slate-400" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs mb-1 font-semibold text-yellow-500">AI Assisted (Simulated)</p>
                                    <p className="text-xs text-slate-300">
                                      Confidence: {Math.round(doc.aiConfidence * 100)}%
                                      <br/> Extracted: {JSON.parse(doc.extractedFields || "[]").join(", ") || "None"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="bg-slate-50 border-slate-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              Eligibility Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle size={16} className="text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Score ≥80 required for verified status. Documents flagged as NEEDS_REVIEW drop score by half weight and require manual verification.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-6xl font-bold text-[#1B3A6B] mb-4">
              {initialProfile?.eligibilityScore || 0}<span className="text-xl text-slate-400 font-normal">/100</span>
            </div>
            <Badge className={`${getStatusColor(initialProfile?.verificationStatus || "PENDING")} text-sm px-4 py-1 border-0 shadow-none`}>
              {initialProfile?.verificationStatus ? initialProfile.verificationStatus.replace("_", " ") : "PENDING"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
