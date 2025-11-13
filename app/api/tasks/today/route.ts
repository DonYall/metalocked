import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, title, frequency, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const { data: userData, error: uErr } = await supabase.from("users").select("timezone").eq("id", user.id).single();

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const userTimezone = userData?.timezone || "UTC";

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const now = new Date(`${year}-${month}-${day}T00:00:00Z`);

  const todayISO = now.toISOString().slice(0, 10);

  const getWeekMondayISO = (d: Date) => {
    const day = d.getUTCDay();
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - day + 1);
    return monday.toISOString().slice(0, 10);
  };
  const weekISO = getWeekMondayISO(now);

  const { data: compsDaily } = await supabase
    .from("task_completions")
    .select("task_id, completed_on")
    .eq("user_id", user.id)
    .eq("completed_on", todayISO);

  const { data: compsWeekly } = await supabase
    .from("task_completions")
    .select("task_id, completed_on")
    .eq("user_id", user.id)
    .eq("completed_on", weekISO);

  const completedTodaySet = new Set((compsDaily ?? []).map((c) => c.task_id));
  const completedThisWeekSet = new Set((compsWeekly ?? []).map((c) => c.task_id));

  const { data: lastComps } = await supabase
    .from("task_completions")
    .select("task_id, completed_on")
    .eq("user_id", user.id)
    .order("completed_on", { ascending: false });

  const lastByTask = new Map<string, string>();
  (lastComps ?? []).forEach((c) => {
    if (!lastByTask.has(c.task_id)) lastByTask.set(c.task_id, c.completed_on);
  });

  const items = (tasks ?? []).map((t) => {
    let completedForPeriod = false;
    if (t.frequency === "daily") completedForPeriod = completedTodaySet.has(t.id);
    else if (t.frequency === "weekly") completedForPeriod = completedThisWeekSet.has(t.id);
    else if (t.frequency === "none") {
      completedForPeriod = lastByTask.has(t.id);
    } else completedForPeriod = false;

    let streakAfterPotential = 1;
    const last = lastByTask.get(t.id) ?? null;
    if (t.frequency === "daily" && last) {
      const [ly, lm, ld] = last.split("-").map(Number);
      const lastD = new Date(ly, lm - 1, ld);
      const [ty, tm, td] = todayISO.split("-").map(Number);
      const todayD = new Date(ty, tm - 1, td);
      const diff = Math.round((todayD.getTime() - lastD.getTime()) / (24 * 3600 * 1000));
      streakAfterPotential = diff === 1 ? 2 : 1;
    }
    if (t.frequency === "weekly" && last) {
      const [ly, lm, ld] = last.split("-").map(Number);
      const lastW = new Date(ly, lm - 1, ld);
      const [wy, wm, wd] = weekISO.split("-").map(Number);
      const thisW = new Date(wy, wm - 1, wd);
      const diff = Math.round((thisW.getTime() - lastW.getTime()) / (7 * 24 * 3600 * 1000));
      streakAfterPotential = diff === 1 ? 2 : 1;
    }

    return { ...t, completedForPeriod, streakAfterPotential };
  });

  return NextResponse.json({ tasks: items });
}
