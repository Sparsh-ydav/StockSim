import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

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
        .order("created_at", { ascending: false });

    return (
        <ProfileClient
            user={{
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
                avatar: user.user_metadata?.avatar_url,
                created_at: user.created_at,
            }}
            account={account ?? { cash_balance: 25000 }}
            positions={positions ?? []}
            trades={trades ?? []}
        />
    );
}