import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { computeStreak, computeAwardedXp, levelFromXp } from '@/lib/xp';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const Body = z.object({
    taskId: z.uuid(),
    completedAt: z.iso.datetime().optional(),
  });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: z.treeifyError(parsed.error) }, { status: 400 });

  const { taskId, completedAt } = parsed.data;
  const completedAtDate = completedAt ? new Date(completedAt) : new Date();

  const { data: task, error: taskErr } = await supabase.from('tasks').select('id, user_id, frequency').eq('id', taskId).single();

  if (taskErr || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  if (task.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: last, error: lastErr } = await supabase
    .from('task_completions')
    .select('completed_on')
    .eq('task_id', taskId)
    .order('completed_on', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastCompletedOnISO = last?.completed_on ?? null;
  const { completedOn, streakAfter } = computeStreak(task.frequency as any, lastCompletedOnISO, completedAtDate);
  const xpAwarded = computeAwardedXp(task.frequency as any, streakAfter);

  const { data: completion, error: completionErr } = await supabase
    .from('task_completions')
    .insert({
      task_id: taskId,
      user_id: user.id,
      completed_on: completedOn,
      completed_at: completedAtDate.toISOString(),
      xp_awarded: xpAwarded,
      streak_after: streakAfter,
    })
    .select('id')
    .single();

  if (completionErr) {
    if ((completionErr as any).code === '23505') {
      return NextResponse.json({ error: 'Already completed for this period' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to record completion', details: completionErr.message }, { status: 500 });
  }

  const { error: xpErr } = await supabase.from('xp_events').insert({
    user_id: user.id,
    source: 'task_completion',
    amount: xpAwarded,
    meta: { task_id: taskId, completed_on: completedOn },
  });

  if (xpErr) {
    return NextResponse.json({ error: 'Failed to record XP event', details: xpErr.message }, { status: 500 });
  }

  const { data: profile, error: profErr } = await supabase.from('users').select('xp_total, level').eq('id', user.id).single();

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 });
  }

  const newTotal = profile.xp_total + xpAwarded;
  const newLevel = Math.max(profile.level, levelFromXp(newTotal));

  const { error: updErr } = await supabase.from('users').update({ xp_total: newTotal, level: newLevel }).eq('id', user.id);

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update user XP' }, { status: 500 });
  }

  return NextResponse.json({
    completionId: completion.id,
    xpAwarded,
    streakAfter,
    userXpTotal: newTotal,
    userLevel: newLevel,
  });
}
