import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({ name: z.string().min(2).max(50) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = Body.safeParse(await req.json());
  if (!input.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const admin = createAdminClient();
  const { data: circle, error } = await admin
    .from('circles')
    .insert({
      name: input.data.name,
      owner_id: user.id,
      join_code: Math.random().toString(36).slice(2, 10).toLowerCase(),
    })
    .select('id, join_code')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: mErr } = await admin.from('circle_memberships').insert({ circle_id: circle.id, user_id: user.id, role: 'owner' });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json(circle);
}
