"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscores only"),
  display_name: z.string().min(1).max(40).optional(),
});

export default function UsernameForm({ initialDisplayName = "" }: { initialDisplayName?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<null | boolean>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkAvailability(u: string) {
    setAvailable(null);
    if (!schema.shape.username.safeParse(u).success) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/profile/check-username?u=${encodeURIComponent(u)}`, { cache: "no-store" });
      const json = await res.json();
      setAvailable(json.available === true);
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ username, display_name: displayName });
    if (!parsed.success) {
      setError(parsed.error.issues?.[0]?.message ?? "Invalid input");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex gap-2">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            onBlur={(e) => checkAvailability(e.target.value.toLowerCase())}
          />
          {available && <Check className="w-5 h-5 text-green-500 self-center" />}
        </div>
        <p className={cn("text-xs", available === false ? "text-red-400" : "text-muted-foreground")}>
          {available === false ? "That username is taken." : "3–20 chars: lowercase, numbers, underscores."}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="display">Display name (optional)</Label>
        <Input id="display" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <Button type="submit" disabled={saving || available === false || username.length < 3}>
        {saving ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
