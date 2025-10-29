import TaskCard from "./components/TaskCard";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import CircleCard from "./components/CircleCard";
import RefreshAll from "./components/RefreshAll";
import XPCard from "./components/XPCard";

export default async function DashboardPage() {
  return (
    <main className="max-w-5xl mx-auto mt-12 p-4">
      <div className="flex gap-2 items-center mb-6">
        <h1 className="font-semibold text-xl">MetaLocked</h1>
        <RefreshAll />
        <Button className="p-3">
          <User />
        </Button>
      </div>

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        <section className="space-y-6 lg:col-span-2">
          <TaskCard />
        </section>

        <aside className="space-y-6 sticky top-6 h-min">
          <XPCard />
          <CircleCard />
        </aside>
      </div>
    </main>
  );
}
