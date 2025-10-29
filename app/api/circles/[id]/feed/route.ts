import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("v_circle_feed")
    .select("user_id, display_name, task_title, completed_at, xp_awarded, streak_after")
    .eq("circle_id", id)
    .order("completed_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
