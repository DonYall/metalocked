import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only."),
  display_name: z.string().min(1).max(40).optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: z.treeifyError(parsed.error) }, { status: 400 });
  }
  const { username, display_name, timezone } = parsed.data;

  const admin = createAdminClient();

  const { data: taken } = await admin.from("users").select("id").eq("username", username).neq("id", user.id).maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const { data: existing } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();

  if (!existing) {
    const { error: insErr } = await admin.from("users").insert({
      id: user.id,
      username,
      display_name: display_name ?? null,
      timezone: timezone ?? null,
    });
    if (insErr) return NextResponse.json({ error: "Failed to create profile", details: insErr.message }, { status: 500 });
  } else {
    const { error: updErr } = await admin
      .from("users")
      .update({
        username,
        display_name: display_name ?? null,
        timezone: timezone ?? null,
      })
      .eq("id", user.id);
    if (updErr) return NextResponse.json({ error: "Failed to update profile", details: updErr.message }, { status: 500 });
  }

  const { data: profile, error: fetchErr } = await admin.from("users").select("id, username, display_name, reputation").eq("id", user.id).single();

  if (fetchErr) return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });

  return NextResponse.json({ profile });
}
