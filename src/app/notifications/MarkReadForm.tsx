"use client";

import { markAllRead } from "./actions";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MarkReadForm() {
  const router = useRouter();

  const handleMarkAllRead = async () => {
    await markAllRead();
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleMarkAllRead} className="gap-2">
      <CheckCheck size={16} />
      Mark All Read
    </Button>
  );
}
