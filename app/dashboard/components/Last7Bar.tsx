"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";

type Completion = { completed_at: string; xp_awarded: number };

export default function Last7Bar() {
  const [data, setData] = useState<{ date: string; xp: number; count: number }[]>([]);

  function bucket7daysLocal(completions: Completion[]) {
    const days: { date: string; xp: number; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      days.push({ date: key, xp: 0, count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));

    for (const c of completions) {
      const local = new Date(c.completed_at);
      const key = local.toLocaleDateString("en-CA");
      const i = idx.get(key);
      console.log({ c, local, key, i });
      if (i !== undefined) {
        days[i].xp += c.xp_awarded ?? 0;
        days[i].count += 1;
      }
    }
    return days;
  }

  async function fetchData() {
    const res = await fetch("/api/stats/last7", { cache: "no-store" });
    const json = await res.json();
    setData(bucket7daysLocal(json.completions ?? []));
    console.log(data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  useDashboardRefresh(fetchData);

  const chartConfig = {
    xp: {
      label: "XP",
    },
    count: {
      label: "Completions",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Last 7 days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ChartContainer config={chartConfig}>
            <BarChart data={data} className="fill-accent-2">
              <CartesianGrid vertical={false} opacity={0.1} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date + "T00:00");
                  return d.toLocaleDateString("en-US", { weekday: "short" });
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                interval={0}
                allowDuplicatedCategory={true}
              />
              <Bar dataKey="xp" radius={8} barSize={24} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {data.length > 0 && (
            <>
              <span>Total XP: {data.reduce((s, d) => s + (d.xp || 0), 0)}</span>
              <span className="mx-2">•</span>
              <span>Completions: {data.reduce((s, d) => s + (d.count || 0), 0)}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
