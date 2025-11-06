import TaskCard from "./components/TaskCard";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import CircleCard from "./components/CircleCard";
import RefreshAll from "./components/RefreshAll";
import XPCard from "./components/XPCard";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import Last7Bar from "./components/Last7Bar";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("display_name").eq("id", user?.id).single();
  const displayName = profile?.display_name ?? "User";
  const userName = displayName.split(" ")[0];

  return (
    <main className="max-w-5xl mx-auto mt-12 p-4">
      <Toaster position="bottom-right" theme="dark" />
      <div className="flex gap-2 items-center mb-6">
        <h1 className="text-xl">
          Welcome back, <span className="font-bold">{userName}</span>
        </h1>
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
          <Last7Bar />
          <CircleCard />
        </aside>
      </div>
    </main>
  );
}
