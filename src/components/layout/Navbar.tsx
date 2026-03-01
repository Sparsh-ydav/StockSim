"use client";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/ui/NotificationBell";

type Props = {
  user: { name: string; email: string; avatar?: string };
};

export default function Navbar({ user }: Props) {
  const { quotes, cashBalance, positions } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const portfolioValue = positions.reduce((sum, p) => {
    const q = quotes[p.symbol];
    return sum + (q ? q.price * p.shares : 0);
  }, 0);
  const totalValue = cashBalance + portfolioValue;
  const pnl = totalValue - 25000;
  const tickerStocks = Object.values(quotes).slice(0, 12);

  return (
    <nav className="glass sticky top-0 z-50 border-t-0 border-l-0 border-r-0 h-14 flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-[#0a0e1a]"
          style={{ background: "linear-gradient(135deg,#34d399,#6ee7b7)" }}>S</div>
        <span className="font-bold text-[15px] tracking-tight">StockSim</span>
        <span className="badge-green">PAPER</span>
      </div>

      {/* Live ticker */}
      <div className="ticker-wrap flex-1 mx-2">
        <div className="ticker-inner">
          {[...tickerStocks, ...tickerStocks].map((s, i) => (
            <span key={i} className="px-4 text-[11px] font-medium price"
              style={{ color: s.change >= 0 ? "#34d399" : "#f87171" }}>
              {s.symbol}{" "}
              <span style={{ color: "#94a3b8" }}>${s.price.toFixed(2)}</span>{" "}
              {s.change >= 0 ? "▲" : "▼"}{Math.abs(s.changePct).toFixed(2)}%
            </span>
          ))}
        </div>
      </div>

      {/* Portfolio value */}
      <div className="text-right shrink-0">
        <div className="text-[10px] font-semibold tracking-wide" style={{ color: "#64748b" }}>PORTFOLIO</div>
        <div className="text-sm font-bold price" style={{ color: pnl >= 0 ? "#34d399" : "#f87171" }}>
          ${totalValue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Notification bell */}
      <NotificationBell />

      {/* Avatar → profile */}
      <button onClick={() => router.push("/profile")} title="Profile"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full"
            style={{ border: "2px solid rgba(255,255,255,0.12)" }} />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "2px solid rgba(255,255,255,0.12)" }}>
            {user.name[0].toUpperCase()}
          </div>
        )}
      </button>
    </nav>
  );
}