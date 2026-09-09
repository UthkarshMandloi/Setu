"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { selectPitch, rejectPitch } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PitchActions({ pitchId, problemId }: { pitchId: string; problemId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSelect = async () => {
    if (!confirm("Select this pitch as the winner? This will create a pilot.")) return;
    setLoading(true);
    await selectPitch(pitchId, problemId);
    router.push("/gov/pilots");
  };

  const handleReject = async () => {
    if (!confirm("Reject this pitch?")) return;
    setLoading(true);
    await rejectPitch(pitchId);
    router.push("/gov/pitches");
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Actions</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleSelect}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 size={16} className="mr-2" />
          Select as Winner
        </Button>
        <Button
          onClick={handleReject}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          <XCircle size={16} className="mr-2" />
          Reject Pitch
        </Button>
      </CardContent>
    </Card>
  );
}
