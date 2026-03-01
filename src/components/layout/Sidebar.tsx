"use client";
import { useAppStore } from "@/lib/store";

const NAV_ITEMS = [
  { id: "market", label: "Market", icon: "📈" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "history", label: "History", icon: "🕐" },
  { id: "watchlist", label: "Watchlist", icon: "⭐" },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, cashBalance, positions, quotes, limitOrders } = useAppStore();

  const portfolioValue = positions.reduce((sum, p) => {
    const q = quotes[p.symbol];
    return sum + (q ? q.price * p.shares : 0);
  }, 0);
  const totalValue = cashBalance + portfolioValue;
  const pnl = totalValue - 25000;
  const pendingOrders = limitOrders.filter(o => o.status === "pending").length;

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation */}
      <div className="glass-card p-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 mb-0.5 text-left"
            style={{
              color: activeTab === item.id ? "#34d399" : "#94a3b8",
              background: activeTab === item.id ? "rgba(52,211,153,0.08)" : "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span className="text-base">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Cash */}
      <div className="glass-card p-4">
        <div className="text-[10px] font-semibold tracking-wide mb-1.5" style={{ color: "#64748b" }}>AVAILABLE CASH</div>
        <div className="text-[22px] font-bold tracking-tight price">
          ${cashBalance.toLocaleString("en", { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#64748b" }}>Holdings</span>
            <span className="font-semibold price">${portfolioValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#64748b" }}>Total P&L</span>
            <span className="font-semibold price" style={{ color: pnl >= 0 ? "#34d399" : "#f87171" }}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#64748b" }}>Return</span>
            <span className="font-semibold" style={{ color: pnl >= 0 ? "#34d399" : "#f87171" }}>
              {pnl >= 0 ? "+" : ""}{((pnl / 25000) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pending limit orders badge */}
      {pendingOrders > 0 && (
        <button
          onClick={() => setActiveTab("market")}
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 12, padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>⏳ Limit Orders</span>
          <span style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "#fbbf24", color: "#0a0e1a",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{pendingOrders}</span>
        </button>
      )}

      {/* Market status */}
      <div className="glass-card p-3 flex items-center gap-2">
        <div className="live-dot" />
        <span className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>
          Markets Live
        </span>
      </div>
    </div>
  );
}