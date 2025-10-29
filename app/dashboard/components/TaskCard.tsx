"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TaskEditorDialog from "./TaskEditorDialog";
import { Plus, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";

type TaskVM = { id: string; title: string; frequency: "daily" | "weekly" | "none"; completedForPeriod: boolean; streakAfterPotential: number };

export default function TaskCard() {
  const [items, setItems] = useState<TaskVM[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "weekly" | "oneoff">("today");
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      const res = await fetch("/api/tasks/today", { cache: "no-store" });
      const json = await res.json();
      setItems(json.tasks ?? []);
    });

  useDashboardRefresh(refresh);

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "today":
        return items.filter((t) => t.frequency === "daily" || t.frequency === "none");
      case "weekly":
        return items.filter((t) => t.frequency === "weekly");
      case "oneoff":
        return items.filter((t) => t.frequency === "none");
      default:
        return items;
    }
  }, [items, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-xl">Tasks</h1>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="bg-inherit">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="oneoff">One-off</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* <Button className="border" size="sm" onClick={refresh} disabled={isPending}>
          <RefreshCw className="w-4 h-4" /> {isPending ? "Refreshing…" : "Refresh"}
        </Button> */}
        <TaskEditorDialog mode="create">
          <Button size="sm" className="border">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </TaskEditorDialog>
      </div>

      <Card className="px-6 py-3">
        <div className="flex items-center gap-2"></div>
        <ul className="divide-y">
          {filtered.map((t) => (
            <TaskRow key={t.id} task={t} onChanged={refresh} />
          ))}
          {filtered.length === 0 && <div className="text-sm text-muted-foreground">Nothing here yet.</div>}
        </ul>
      </Card>
    </div>
  );
}

type Props = {
  task: { id: string; title: string; frequency: "daily" | "weekly" | "none"; completedForPeriod: boolean; streakAfterPotential: number };
  onChanged?: () => void;
};

function TaskRow({ task, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const onComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      toast.success(`+${json.xpAwarded} XP · streak ${json.streakAfter}`);
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Task deleted");
      onChanged?.();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <li className="flex items-center justify-between py-3">
      <div className="min-w-0 flex gap-2">
        <div className="font-medium text-xl truncate">{task.title}</div>
        <div className="flex items-center gap-2">
          {/* <Badge variant="secondary" className="capitalize">
            {task.frequency}
          </Badge> */}
          {task.frequency !== "none" && (
            <Badge variant={task.completedForPeriod ? "default" : "outline"}>{task.completedForPeriod ? "Done" : task.streakAfterPotential}</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="border" onClick={onComplete} disabled={loading || task.completedForPeriod}>
          <CheckCircle2 className="w-4 h-4" />
          {task.completedForPeriod ? "Completed" : loading ? "Completing…" : "Complete"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <TaskEditorDialog mode="edit" task={task as any} onSaved={onChanged}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </DropdownMenuItem>
            </TaskEditorDialog>
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
