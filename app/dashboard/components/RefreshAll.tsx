"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { emitDashboardRefresh } from "@/lib/refreshBus";

export default function RefreshAll() {
  const [isPending, startTransition] = useTransition();
  const onClick = () => startTransition(() => emitDashboardRefresh());

  return (
    <Button className="p-3 ml-auto" onClick={onClick} disabled={isPending}>
      <RefreshCw className={isPending ? "animate-spin" : ""} />
    </Button>
  );
}
