"use client";
import { useState, useEffect, type ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TaskShape = { id: string; title: string; frequency: "daily" | "weekly" | "none"; is_active: boolean };

type Props = {
  children: ReactElement;
  mode: "create" | "edit";
  task?: TaskShape;
  initialFrequency?: "daily" | "weekly" | "none";
  onSaved?: () => void;
};

export default function TaskEditorDialog({ children, mode, task, initialFrequency, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "none">(task?.frequency ?? initialFrequency ?? "daily");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setFrequency(task?.frequency ?? (mode === "create" ? initialFrequency ?? "daily" : "daily"));
    }
  }, [open, task, mode]);

  const onSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/tasks" : `/api/tasks/${task!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, frequency }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(mode === "create" ? "Task created" : "Task updated");
      setOpen(false);
      onSaved?.();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create task" : "Edit task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </div>

          <div className="grid gap-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="none">No recurrence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="border" onClick={onSubmit} disabled={saving || title.trim().length < 2}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
