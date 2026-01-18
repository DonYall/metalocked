"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, CartesianGrid, Cell, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboardRefresh } from "@/lib/useDashboardRefresh";

type Completion = { created_at: string; delta: number };

export default function Last7Bar() {
  const [data, setData] = useState<{ date: string; rep: number; count: number }[]>([]);

  function bucket7daysLocal(completions: Completion[]) {
    const days: { date: string; rep: number; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      days.push({ date: key, rep: 0, count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));

    for (const c of completions) {
      const local = new Date(c.created_at);
      const key = local.toLocaleDateString("en-CA");
      const i = idx.get(key);
      if (i !== undefined) {
        days[i].rep += c.delta ?? 0;
        days[i].count += 1;
      }
    }
    return days;
  }

  async function fetchData() {
    const res = await fetch("/api/stats/last7", { cache: "no-store" });
    const json = await res.json();
    setData(bucket7daysLocal(json.completions ?? []));
  }

  useEffect(() => {
    fetchData();
  }, []);

  useDashboardRefresh(fetchData);

  const chartConfig = {
    rep: {
      label: "rep",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Last 7 days</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-32 w-full max-h-48">
          <BarChart data={data}>
            <CartesianGrid vertical={false} opacity={0.1} />
            <ReferenceLine y={0} stroke="gray" strokeDasharray="3 3" />
            <YAxis hide interval={0} />
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
            <Bar dataKey="rep" radius={6} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.rep >= 0 ? "var(--accent-2)" : "var(--destructive-2)"} />
              ))}
            </Bar>
            <ChartTooltip
              labelFormatter={(date) => {
                const d = new Date(date + "T00:00");
                return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
              }}
              cursor={false}
              content={<ChartTooltipContent hideIndicator />}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
