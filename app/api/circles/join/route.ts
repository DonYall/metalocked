import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({ code: z.string().min(4).max(20) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = Body.safeParse(await req.json());
  if (!input.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const admin = createAdminClient();
  const { data: circle, error } = await admin.from('circles').select('id, join_code').eq('join_code', input.data.code).single();
  if (error || !circle) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });

  const { error: mErr } = await admin.from('circle_memberships').insert({ circle_id: circle.id, user_id: user.id, role: 'member' });
  if (mErr && (mErr as any).code !== '23505') {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  return NextResponse.json({ circleId: circle.id });
}
