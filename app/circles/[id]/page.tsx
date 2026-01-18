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
    <main className="max-w-5xl mx-auto p-4 space-y-6 mt-12">
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
        <section className="space-y-4">
          <h1 className="font-semibold text-xl">Circle Activity</h1>
          <Card>
            <CardContent>
              <ul className="divide-y">
                {events.map((e: any) => (
                  <li key={`${e.user_id}-${e.completed_at}`} className="p-3">
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
        </section>

        <aside className="space-y-4">
          <h1 className="font-semibold text-xl">Leaderboard</h1>
          <Card className="h-min">
            <CardContent>
              <ol className="divide-y">
                {members.map((m: any, i: number) => (
                  <li key={m.user_id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-6 text-center font-semibold">{i + 1}</span>
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground text-nowrap">{m.reputation} rep</span>
                  </li>
                ))}
                {members.length === 0 && <div className="p-3 text-sm text-muted-foreground">No members yet.</div>}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
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
