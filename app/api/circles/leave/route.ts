import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({ circleId: z.uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input = Body.safeParse(await req.json());
  if (!input.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const admin = createAdminClient();

  const { data: circle } = await admin.from("circles").select("owner_id").eq("id", input.data.circleId).single();
  if (circle?.owner_id === user.id) {
    return NextResponse.json({ error: "Owner cannot leave (transfer ownership first)" }, { status: 400 });
  }

  const { error } = await admin.from("circle_memberships").delete().match({ circle_id: input.data.circleId, user_id: user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
