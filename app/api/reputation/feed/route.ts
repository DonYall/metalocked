import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Number(new URL(req.url).searchParams.get("limit") || 20);

  const { data, error } = await supabase
    .from("reputation_events")
    .select("id, created_at, delta, cause, task_id, meta, tasks(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log(data);

  const items = (data ?? []).map((e) => ({
    id: e.id,
    ts: e.created_at,
    delta: e.delta,
    cause: e.cause,
    label:
      e.cause === "task_completion"
        ? `Completed “${e.tasks?.title ?? "a task"}”`
        : e.cause === "task_missed"
        ? `Missed “${e.tasks?.title ?? "a task"}”`
        : e.cause,
  }));

  return NextResponse.json({ items });
}
