import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsernameForm from "./components/UsernameForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("username, display_name").eq("id", user?.id).maybeSingle();

  if (profile?.username) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome! Pick your username</CardTitle>
        </CardHeader>
        <CardContent>
          <UsernameForm initialDisplayName={profile?.display_name ?? ""} />
        </CardContent>
      </Card>
    </main>
  );
}
