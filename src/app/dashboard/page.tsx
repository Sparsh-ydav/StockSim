import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/layout/DashboardClient";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch account data
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: positions } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", user.id);

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email!, name: user.user_metadata?.full_name ?? user.email!.split("@")[0], avatar: user.user_metadata?.avatar_url }}
      account={account ?? { cash_balance: 25000 }}
      initialPositions={positions ?? []}
      initialTrades={trades ?? []}
    />
  );
}
