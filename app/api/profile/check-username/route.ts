import { NextRequest, NextResponse } from "next/server";
import { createClient  } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get("u") || "").toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(u)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").eq("username", u).limit(1);
  const taken = (data ?? []).length > 0;

  return NextResponse.json({ available: !taken });
}
