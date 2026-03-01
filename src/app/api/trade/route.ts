import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symbol, qty, price, type } = await req.json();
  if (!symbol || !qty || !price || !["buy", "sell"].includes(type)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const totalCost = qty * price;

  // Fetch user account
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (type === "buy") {
    if (account.cash_balance < totalCost) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }
    // Deduct cash
    await supabase
      .from("accounts")
      .update({ cash_balance: account.cash_balance - totalCost })
      .eq("user_id", user.id);

    // Upsert position
    const { data: existingPos } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .single();

    if (existingPos) {
      const newShares = existingPos.shares + qty;
      const newAvg = (existingPos.avg_cost * existingPos.shares + totalCost) / newShares;
      await supabase
        .from("positions")
        .update({ shares: newShares, avg_cost: newAvg })
        .eq("id", existingPos.id);
    } else {
      await supabase.from("positions").insert({
        user_id: user.id,
        symbol,
        shares: qty,
        avg_cost: price,
      });
    }
  } else {
    // Sell
    const { data: pos } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .single();

    if (!pos || pos.shares < qty) {
      return NextResponse.json({ error: "Not enough shares" }, { status: 400 });
    }
    await supabase
      .from("accounts")
      .update({ cash_balance: account.cash_balance + totalCost })
      .eq("user_id", user.id);

    const newShares = pos.shares - qty;
    if (newShares === 0) {
      await supabase.from("positions").delete().eq("id", pos.id);
    } else {
      await supabase.from("positions").update({ shares: newShares }).eq("id", pos.id);
    }
  }

  // Log trade
  const { data: trade } = await supabase.from("trades").insert({
    user_id: user.id,
    symbol,
    qty,
    price,
    type,
    total: totalCost,
  }).select().single();

  return NextResponse.json({ success: true, trade });
}
