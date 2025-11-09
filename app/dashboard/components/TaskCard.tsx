"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TaskEditorDialog from "./TaskEditorDialog";
import { Filter, Plus, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";
import { emitDashboardRefresh } from "@/lib/refreshBus";

type TaskVM = { id: string; title: string; frequency: "daily" | "weekly" | "none"; completedForPeriod: boolean; streakAfterPotential: number };

export default function TaskCard() {
  const [items, setItems] = useState<TaskVM[]>([]);
  const [filter, setFilter] = useState<"all" | "daily" | "weekly" | "oneoff">("all");
  const [sort, setSort] = useState<"Title" | "Streak" | "Completed">("Completed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
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
      case "daily":
        return items.filter((t) => t.frequency === "daily");
      case "weekly":
        return items.filter((t) => t.frequency === "weekly");
      case "oneoff":
        return items.filter((t) => t.frequency === "none");
      default:
        return items;
    }
  }, [items, filter]);

  const displayed = useMemo(() => {
    const arr = [...filtered];

    const cmpTitle = (a: TaskVM, b: TaskVM) => a.title.localeCompare(b.title);
    const cmpStreak = (a: TaskVM, b: TaskVM) => a.streakAfterPotential - b.streakAfterPotential;
    const cmpCompleted = (a: TaskVM, b: TaskVM) => Number(a.completedForPeriod) - Number(b.completedForPeriod);

    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      let r = 0;
      if (sort === "Title") r = cmpTitle(a, b);
      else if (sort === "Streak") r = cmpStreak(a, b);
      else if (sort === "Completed") r = cmpCompleted(a, b);

      if (r === 0) {
        return a.id.localeCompare(b.id);
      }
      return r * dir;
    });

    return arr;
  }, [filtered, sort, sortDir]);

  function TaskTabs({ className }: { className?: string }) {
    return (
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className={`w-full ${className}`}>
        <TabsList className="bg-inherit p-0">
          <TabsTrigger value="all">
            All{" "}
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {items.length > 9 ? "9+" : items.length}
            </div>
          </TabsTrigger>

          <TabsTrigger value="daily">
            Daily{" "}
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {items.filter((t) => t.frequency === "daily").length > 9 ? "9+" : items.filter((t) => t.frequency === "daily").length}
            </div>
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly{" "}
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {items.filter((t) => t.frequency === "weekly").length > 9 ? "9+" : items.filter((t) => t.frequency === "weekly").length}
            </div>
          </TabsTrigger>
          <TabsTrigger value="oneoff">
            One-off{" "}
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {items.filter((t) => t.frequency === "none").length > 9 ? "9+" : items.filter((t) => t.frequency === "none").length}
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-xl">Tasks</h1>
        <TaskTabs className="hidden lg:flex" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" title="Sort" className="border ml-auto">
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuCheckboxItem
              checked={sort === "Title" && sortDir === "asc"}
              onSelect={(e) => {
                e.preventDefault();
                setSort("Title");
                setSortDir("asc");
              }}
              className="cursor-pointer"
            >
              Title
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort === "Streak" && sortDir === "desc"}
              onSelect={(e) => {
                e.preventDefault();
                setSort("Streak");
                setSortDir("desc");
              }}
              className="cursor-pointer"
            >
              Streak
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort === "Completed" && sortDir === "desc"}
              onSelect={(e) => {
                e.preventDefault();
                setSort("Completed");
                setSortDir("desc");
              }}
              className="cursor-pointer"
            >
              Completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort === "Completed" && sortDir === "asc"}
              onSelect={(e) => {
                e.preventDefault();
                setSort("Completed");
                setSortDir("asc");
              }}
              className="cursor-pointer"
            >
              Not completed
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TaskEditorDialog mode="create" initialFrequency={filter === "weekly" ? "weekly" : filter === "oneoff" ? "none" : "daily"} onSaved={refresh}>
          <Button size="sm" className="border p-3">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </TaskEditorDialog>
      </div>
      <TaskTabs className="lg:hidden" />
      <Card className="px-6 py-3 gap-0">
        {" "}
        <ul className="divide-y">
          {displayed.map((t) => (
            <TaskRow key={t.id} task={t} onChanged={emitDashboardRefresh} />
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

      toast.success(`${json.xpAwarded} XP 🎉 · streak ${json.streakAfter}`);

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
            <Badge variant={task.completedForPeriod ? "secondary" : "outline"}>{task.completedForPeriod ? "Done" : task.streakAfterPotential}</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="border" onClick={onComplete} disabled={loading || task.completedForPeriod}>
          <CheckCircle2 className="w-4 h-4" />
          {task.completedForPeriod ? "Completed" : loading ? "Completing…" : "Complete"}
        </Button>

        {task.frequency === "none" && task.completedForPeriod ? (
          <Button variant="ghost" size="icon" className="text-red-600" onClick={onDelete} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
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
        )}
      </div>
    </li>
  );
}
