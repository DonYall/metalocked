import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: memberships, error: mErr } = await admin
    .from("circle_memberships")
    .select("circle_id, role, circles(name, owner_id, join_code)")
    .eq("user_id", user.id);
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const circleIds = (memberships ?? []).map((m: any) => m.circle_id);
  if (circleIds.length === 0) return NextResponse.json({ circles: [] });

  const { data: counts } = await admin.from("circle_memberships").select("circle_id, user_id").in("circle_id", circleIds);

  const countsMap = new Map<string, number>();
  (counts ?? []).forEach((r: any) => {
    countsMap.set(r.circle_id, (countsMap.get(r.circle_id) ?? 0) + 1);
  });

  const { data: lb } = await admin
    .from("v_circle_leaderboard")
    .select("circle_id, user_id, xp_total")
    .in("circle_id", circleIds)
    .order("xp_total", { ascending: false });

  const rankMap = new Map<string, number>();
  const xpMap = new Map<string, number>();
  (lb ?? []).forEach((row: any, idx: number, arr: any[]) => {
    const pos = arr.filter((x) => x.circle_id === row.circle_id).findIndex((x) => x.user_id === user.id) + 1;
    if (!rankMap.has(row.circle_id) && pos > 0) {
      rankMap.set(row.circle_id, pos);
    }
    if (row.user_id === user.id) xpMap.set(row.circle_id, row.xp_total);
  });

  const circles = (memberships ?? []).map((m: any) => ({
    id: m.circle_id,
    name: m.circles.name,
    myRank: rankMap.get(m.circle_id) ?? null,
    myXp: xpMap.get(m.circle_id) ?? null,
    memberCount: countsMap.get(m.circle_id) ?? null,
    joinCode: m.circles.owner_id === user.id ? m.circles.join_code : null,
    isOwner: m.circles.owner_id === user.id,
  }));

  return NextResponse.json({ circles });
}
