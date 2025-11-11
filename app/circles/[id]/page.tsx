import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getData(circleId: string) {
  const [lbRes, feedRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/circles/${circleId}/leaderboard`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/circles/${circleId}/feed`, { cache: "no-store" }),
  ]);
  const { members } = await lbRes.json();
  const { events } = await feedRes.json();
  return { members, events };
}

export default async function CirclePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { members, events } = await getData(id);

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="divide-y rounded-lg border">
            {members.map((m: any, i: number) => (
              <li key={m.user_id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-semibold">{i + 1}</span>
                  <span className="font-medium">{m.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{m.reputation} rep</span>
              </li>
            ))}
            {members.length === 0 && <div className="p-3 text-sm text-muted-foreground">No members yet.</div>}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {events.map((e: any) => (
              <li key={`${e.user_id}-${e.completed_at}`} className="rounded-md border p-3">
                <div className="text-sm">
                  <span className="font-medium">{e.display_name ?? "Member"}</span> completed <span className="font-medium">{e.task_title}</span>
                </div>
                <EventRow e={e} />
              </li>
            ))}
            {events.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}

function EventRow({ e }: { e: any }) {
  "use client";
  return (
    <div className="text-xs text-muted-foreground">
      +{e.rep_awarded} rep · streak {e.streak_after} · {new Date(e.completed_at).toLocaleString()}
    </div>
  );
}
