import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, computeAwardedRep } from "@/lib/reputation";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profErr } = await supabase.from("users").select("reputation, timezone").eq("id", user.id).single();

  if (profErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 500 });
  }

  const timezone = profile?.timezone ?? undefined;

  const Body = z.object({
    taskId: z.uuid(),
    completedAt: z.iso.datetime().optional(),
  });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: z.treeifyError(parsed.error) }, { status: 400 });

  const { taskId, completedAt } = parsed.data;
  const completedAtDate = completedAt ? new Date(completedAt) : new Date();

  const { data: task, error: taskErr } = await supabase.from("tasks").select("id, user_id, frequency").eq("id", taskId).single();

  if (taskErr || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: last, error: lastErr } = await supabase
    .from("task_completions")
    .select("completed_on")
    .eq("task_id", taskId)
    .order("completed_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastCompletedOnISO = last?.completed_on ?? null;
  const { completedOn, streakAfter } = computeStreak(task.frequency as any, lastCompletedOnISO, completedAtDate, timezone);
  const repAwarded = computeAwardedRep(task.frequency as any, streakAfter);

  const { data: completion, error: completionErr } = await supabase
    .from("task_completions")
    .insert({
      task_id: taskId,
      user_id: user.id,
      completed_on: completedOn,
      completed_at: completedAtDate.toISOString(),
      rep_awarded: repAwarded,
      streak_after: streakAfter,
    })
    .select("id")
    .single();

  if (completionErr) {
    if ((completionErr as any).code === "23505") {
      return NextResponse.json({ error: "Already completed for this period" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to record completion", details: completionErr.message }, { status: 500 });
  }

  const { error: repErr } = await supabase.from("reputation_events").insert({
    user_id: user.id,
    cause: "task_completion",
    delta: repAwarded,
    task_id: taskId,
  });

  if (repErr) {
    return NextResponse.json({ error: "Failed to record reputation event", details: repErr.message }, { status: 500 });
  }

  const { error: repUpdateErr } = await supabase.rpc("update_reputation", { p_user_id: user.id, p_delta: repAwarded });

  if (repUpdateErr) {
    return NextResponse.json({ error: "Failed to update user reputation", details: repUpdateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    completionId: completion.id,
    repAwarded: repAwarded,
    streakAfter,
  });
}
