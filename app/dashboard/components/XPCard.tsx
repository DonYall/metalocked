"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { levelFromXp, xpForLevel } from "@/lib/xp";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { LevelIcon } from "./LevelBadge";

export default function XPCard() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [need, setNeed] = useState(100);
  const [progress, setProgress] = useState(0);

  const refresh = async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };
    const [{ data: profile }] = await Promise.all([supabase.from("users").select("xp_total, level, display_name").eq("id", user.id).single()]);
    const xp = profile?.xp_total ?? 0;
    const level = profile?.level ?? levelFromXp(xp);
    const nextLevel = level + 1;
    const floor = xpForLevel(level);
    const need = xpForLevel(nextLevel);
    const progress = Math.min(100, Math.round(((xp - floor) / (need - floor)) * 100));
    setXp(xp);
    setLevel(level);
    setNeed(need);
    setProgress(progress);
  };

  useDashboardRefresh(refresh);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h1 className="font-semibold text-xl">Progress</h1>
        <Button className="border">
          <Share2 /> Share
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LevelIcon level={level} size={64} />
            <div className="flex flex-col justify-between">
              <h1 className="text-lg font-semibold">Level {level}</h1>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="bg-background [&>div]:bg-accent-2" />
        </CardContent>
      </Card>
    </div>
  );
}
