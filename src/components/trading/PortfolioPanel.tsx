"use client";
import { useAppStore } from "@/lib/store";

export default function PortfolioPanel() {
    const { positions, quotes, cashBalance, trades, setSelectedSymbol, setActiveTab } = useAppStore();

    const portfolioValue = positions.reduce((sum, p) => {
        const q = quotes[p.symbol];
        return sum + (q ? q.price * p.shares : 0);
    }, 0);
    const totalValue = cashBalance + portfolioValue;
    const pnl = totalValue - 25000;
    const pnlPct = (pnl / 25000) * 100;

    const allocationData = positions.map(p => {
        const q = quotes[p.symbol];
        const value = q ? q.price * p.shares : 0;
        return { symbol: p.symbol, value, pct: (value / totalValue) * 100 };
    }).sort((a, b) => b.value - a.value);

    return (
        <div className="flex flex-col gap-3 min-w-0">
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                    { label: "Total Value", value: `$${totalValue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#e2e8f0" },
                    { label: "Cash Available", value: `$${cashBalance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#94a3b8" },
                    { label: "All-time P&L", value: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)`, color: pnl >= 0 ? "#34d399" : "#f87171" },
                ].map(card => (
                    <div key={card.label} className="glass-card p-4">
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>{card.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Holdings table */}
            <div className="glass-card overflow-hidden">
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Holdings</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>{positions.filter(p => p.shares > 0).length} positions</span>
                </div>

                {positions.filter(p => p.shares > 0).length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        <div style={{ fontSize: 14, color: "#475569", marginBottom: 4 }}>No open positions</div>
                        <button onClick={() => setActiveTab("market")} style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                            Browse Market →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {["Symbol", "Shares", "Avg Cost", "Current", "Value", "P&L"].map(h => (
                                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.5px", textAlign: h === "Symbol" ? "left" : "right" }}>{h.toUpperCase()}</div>
                            ))}
                        </div>
                        {positions.filter(p => p.shares > 0).map((p, i) => {
                            const q = quotes[p.symbol];
                            const cur = q?.price ?? p.avg_cost;
                            const value = cur * p.shares;
                            const posPnl = (cur - p.avg_cost) * p.shares;
                            const posPct = ((cur - p.avg_cost) / p.avg_cost) * 100;
                            return (
                                <div key={p.symbol} onClick={() => { setSelectedSymbol(p.symbol); setActiveTab("market"); }}
                                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 16px", cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>{p.symbol}</div>
                                        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{q?.name?.split(" ").slice(0, 2).join(" ") ?? ""}</div>
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 500, fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>{p.shares}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>${p.avg_cost.toFixed(2)}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>${cur.toFixed(2)}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>${value.toFixed(2)}</div>
                                    <div style={{ textAlign: "right", alignSelf: "center" }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: posPnl >= 0 ? "#34d399" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                                            {posPnl >= 0 ? "+" : ""}${posPnl.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: 10, color: posPnl >= 0 ? "#34d399" : "#f87171" }}>
                                            {posPct >= 0 ? "+" : ""}{posPct.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Allocation bar */}
            {allocationData.length > 0 && (
                <div className="glass-card p-4">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Allocation</div>
                    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12, gap: 1 }}>
                        {allocationData.map((a, i) => {
                            const colors = ["#34d399", "#6ee7b7", "#38bdf8", "#818cf8", "#fb7185", "#fbbf24", "#a78bfa", "#f97316"];
                            return <div key={a.symbol} style={{ width: `${a.pct}%`, background: colors[i % colors.length], transition: "width 0.5s" }} />;
                        })}
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)" }} title="Cash" />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                        {allocationData.map((a, i) => {
                            const colors = ["#34d399", "#6ee7b7", "#38bdf8", "#818cf8", "#fb7185", "#fbbf24", "#a78bfa", "#f97316"];
                            return (
                                <div key={a.symbol} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length] }} />
                                    <span style={{ color: "#94a3b8", fontWeight: 600 }}>{a.symbol}</span>
                                    <span style={{ color: "#475569" }}>{a.pct.toFixed(1)}%</span>
                                </div>
                            );
                        })}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Cash</span>
                            <span style={{ color: "#475569" }}>{((cashBalance / totalValue) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}