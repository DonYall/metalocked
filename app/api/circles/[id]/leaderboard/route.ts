import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("v_circle_leaderboard")
    .select("user_id, name, xp_total")
    .eq("circle_id", id)
    .order("xp_total", { ascending: false })
    .limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}
