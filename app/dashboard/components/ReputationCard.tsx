"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { ReputationIcon, tierName } from "./ReputationBadge";

export default function ReputationCard() {
  const [reputation, setReputation] = useState(0);

  const refresh = async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };
    const [{ data: profile }] = await Promise.all([supabase.from("users").select("reputation, display_name").eq("id", user.id).single()]);
    const rep = profile?.reputation ?? 50;
    setReputation(rep);
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
            <ReputationIcon reputation={reputation} size={64} />
            <div className="flex gap-2 items-center">
              <h1 className="text-lg font-semibold">{tierName(reputation)}</h1>
              <span className="text-sm text-muted-foreground">{reputation} rep</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={reputation} className="bg-background [&>div]:bg-accent-2" />
        </CardContent>
      </Card>
    </div>
  );
}
