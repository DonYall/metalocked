import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Task = {
  id: string;
  user_id: string;
  frequency: "daily" | "weekly" | "none";
  is_active: boolean;
  last_penalized_on: string | null;
  created_at: string;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function localMidnightUTC(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const body = await req.json().catch(() => ({}));
  const clientTz: string | undefined = body?.tz;
  const { data: urow } = await admin.from("users").select("timezone").eq("id", user.id).single();
  const tz = clientTz || urow?.timezone || "UTC";

  const now = new Date();
  const localToday = localMidnightUTC(now, tz);
  const localYesterday = new Date(localToday);
  localYesterday.setUTCDate(localToday.getUTCDate() - 1);
  const yesterdayISO = iso(localYesterday);

  const thisWeekMon = new Date(localToday);
  const dow = thisWeekMon.getUTCDay() || 7;
  thisWeekMon.setUTCDate(thisWeekMon.getUTCDate() - (dow - 1));
  const lastWeekMon = new Date(thisWeekMon);
  lastWeekMon.setUTCDate(thisWeekMon.getUTCDate() - 7);
  const lastWeekISO = iso(lastWeekMon);

  const { data: tasks, error: tErr } = await admin
    .from("tasks")
    .select("id, user_id, frequency, is_active, last_penalized_on, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const daily = (tasks ?? []).filter((t) => t.frequency === "daily");
  const weekly = (tasks ?? []).filter((t) => t.frequency === "weekly");

  const DAILY_DELTA = -3;
  const WEEKLY_DELTA = -5;

  let penalizedDaily = 0;
  let penalizedWeekly = 0;

  if (daily.length) {
    const ids = daily.map((t) => t.id);
    const { data: done } = await admin.from("task_completions").select("task_id").in("task_id", ids).eq("completed_on", yesterdayISO);

    const doneSet = new Set((done ?? []).map((r) => r.task_id as string));

    for (const t of daily) {
      if (t.last_penalized_on && t.last_penalized_on >= yesterdayISO) continue;

      if (!doneSet.has(t.id)) {
        const { error: insErr } = await admin.from("reputation_events").insert({
          user_id: user.id,
          task_id: t.id,
          delta: DAILY_DELTA,
          cause: "task_missed",
          meta: { freq: "daily", tz },
        });
        if (insErr && (insErr as any).code !== "23505") {
          return NextResponse.json({ error: "Failed to record daily penalty", details: insErr.message }, { status: 500 });
        }
        if (!insErr || (insErr as any).code !== "23505") {
          penalizedDaily++;
          await admin.rpc("update_reputation", { p_user_id: user.id, p_delta: DAILY_DELTA });
        }
      }

      await admin.from("tasks").update({ last_penalized_on: yesterdayISO }).eq("id", t.id);
    }
  }

  if (weekly.length) {
    const ids = weekly.map((t) => t.id);
    const { data: done } = await admin.from("task_completions").select("task_id").in("task_id", ids).eq("completed_on", lastWeekISO);

    const doneSet = new Set((done ?? []).map((r) => r.task_id as string));

    for (const t of weekly) {
      if (t.last_penalized_on && t.last_penalized_on >= lastWeekISO) continue;

      if (!doneSet.has(t.id)) {
        const { error: insErr } = await admin.from("reputation_events").insert({
          user_id: user.id,
          task_id: t.id,
          delta: WEEKLY_DELTA,
          cause: "task_missed",
          meta: { freq: "weekly", tz },
        });
        if (insErr && (insErr as any).code !== "23505") {
          return NextResponse.json({ error: "Failed to record weekly penalty", details: insErr.message }, { status: 500 });
        }
        if (!insErr || (insErr as any).code !== "23505") {
          penalizedWeekly++;
          await admin.rpc("update_reputation", { p_user_id: user.id, p_delta: WEEKLY_DELTA });
        }
      }

      await admin.from("tasks").update({ last_penalized_on: lastWeekISO }).eq("id", t.id);
    }
  }

  return NextResponse.json({
    ok: true,
    tz,
    daily_bucket: yesterdayISO,
    weekly_bucket: lastWeekISO,
    penalizedDaily,
    penalizedWeekly,
  });
}
