"use client";

import TimeAgo from "react-timeago";
import { useEffect, useMemo, useState, useTransition } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Bell, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";

type Item = {
  id: string;
  ts: string;
  delta: number;
  label: string;
};

export default function NotificationBell({ limit = 10 }: { limit?: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      const res = await fetch(`/api/reputation/feed?limit=${limit}`, { cache: "no-store" });
      const json = await res.json();
      setItems(json.items ?? []);
    });

  useDashboardRefresh(refresh);

  useEffect(() => {
    refresh();
  }, []);

  const newestTs = items[0]?.ts;
  const hasUnread = useMemo(() => {
    if (!newestTs) return false;
    const lastSeen = localStorage.getItem("notif.lastSeen");
    return !lastSeen || new Date(newestTs).getTime() > Number(lastSeen);
  }, [newestTs]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && newestTs) {
      localStorage.setItem("notif.lastSeen", String(new Date(newestTs).getTime()));
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 bg-background border">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-sm font-medium">Reputation Activity</div>
        </div>
        <Separator />

        <ul className="max-h-80 overflow-auto">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm truncate">{it.label}</div>
                <div className="text-xs text-muted-foreground">
                  <TimeAgo date={it.ts} />{" "}
                </div>
              </div>
              <div
                className={cn(
                  "ml-3 shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border",
                  it.delta >= 0 ? "text-green-400 border-green-700" : "text-red-400 border-red-700",
                )}
                title={`${it.delta >= 0 ? "+" : ""}${it.delta} rep`}
              >
                {it.delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {it.delta >= 0 ? `+${it.delta}` : it.delta}
              </div>
            </li>
          ))}
          {items.length === 0 && <div className="px-3 py-6 text-sm text-muted-foreground">No activity yet.</div>}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
