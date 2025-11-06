import { NextRequest, NextResponse } from "next/server";
import { createClient  } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - 6);

  const { data, error: qErr } = await supabase
    .from("task_completions")
    .select("completed_at, xp_awarded")
    .eq("user_id", user.id)
    .gte("completed_at", start.toISOString())
    .order("completed_at", { ascending: true });

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ completions: data ?? [] });
}
