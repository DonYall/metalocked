"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RefreshCw, Plus, Users, Crown, Trophy, Copy as CopyIcon, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";

type CircleVM = {
  id: string;
  name: string;
  myRank?: number | null;
  myXp?: number | null;
  memberCount?: number | null;
  joinCode?: string | null;
  isOwner?: boolean;
};

export default function CircleCard() {
  const [items, setItems] = useState<CircleVM[]>([]);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      const res = await fetch("/api/circles/mine", { cache: "no-store" });
      const json = await res.json();
      setItems(json.circles ?? []);
    });

  useDashboardRefresh(refresh);

  useEffect(() => {
    refresh();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.myRank && b.myRank) return a.myRank - b.myRank;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-xl">Circles</h1>
        <div className="ml-auto flex items-center gap-2">
          <CreateCircleDialog onCreated={refresh}>
            <Button size="sm" className="border">
              <Plus className="w-4 h-4" />
              <span>New Circle</span>
            </Button>
          </CreateCircleDialog>

          <JoinCircleDialog onJoined={refresh}>
            <Button size="sm" variant="secondary" className="border">
              <Users className="w-4 h-4" />
              <span>Join</span>
            </Button>
          </JoinCircleDialog>
        </div>
      </div>

      <Card className="px-6 py-3">
        <ul className="divide-y">
          {sorted.map((c) => (
            <CircleRow key={c.id} circle={c} onChanged={refresh} />
          ))}
          {sorted.length === 0 && <div className="text-sm text-muted-foreground">You haven’t joined any circles yet.</div>}
        </ul>
      </Card>
    </div>
  );
}

function CircleRow({ circle, onChanged }: { circle: CircleVM; onChanged: () => void }) {
  const copyCode = async () => {
    if (!circle.joinCode) {
      toast.info("Only owners can see the join code.");
      return;
    }
    try {
      await navigator.clipboard.writeText(circle.joinCode);
      toast.success("Join code copied");
    } catch {
      toast.error("Could not copy join code");
    }
  };

  return (
    <li className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/circles/${circle.id}`} className="font-medium truncate hover:underline">
            {circle.name}
          </Link>
          {circle.isOwner && (
            <Badge variant="secondary" className="gap-1 lg:hidden">
              <Crown className="w-3 h-3" />
              Owner
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {typeof circle.memberCount === "number" && (
            <span className="inline-flex items-center gap-1 lg:hidden">
              <Users className="w-3 h-3" />
              {circle.memberCount} members
            </span>
          )}
          {typeof circle.myRank === "number" && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Rank #{circle.myRank}
            </span>
          )}
          {typeof circle.myXp === "number" && <span>{circle.myXp} XP</span>}
          {circle.joinCode && circle.isOwner && (
            <span className="truncate lg:hidden">
              Code: <code className="text-muted-foreground">{circle.joinCode}</code>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/circles/${circle.id}`}>
          <Button size="sm" variant="ghost">
            View
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
        {circle.isOwner && (
          <Button size="sm" className="border lg:hidden" onClick={copyCode}>
            <CopyIcon className="w-4 h-4" />
            Copy code
          </Button>
        )}
      </div>
    </li>
  );
}

function CreateCircleDialog({ children, onCreated }: { children: React.ReactNode; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");
      toast.success("Circle created");
      setOpen(false);
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New circle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="circle-name" className="text-sm font-medium">
              Name
            </label>
            <Input id="circle-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Morning Crew" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving || name.trim().length < 2}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function JoinCircleDialog({ children, onJoined }: { children: React.ReactNode; onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/circles/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to join");
      toast.success("Joined circle");
      setOpen(false);
      onJoined();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a circle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="join-code" className="text-sm font-medium">
              Join code
            </label>
            <Input id="join-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., ab12cd34" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving || code.trim().length < 4}>
              {saving ? "Joining…" : "Join"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
