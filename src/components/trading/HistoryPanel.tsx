"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function HistoryPanel() {
    const { trades, setSelectedSymbol, setActiveTab } = useAppStore();
    const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
    const [search, setSearch] = useState("");

    const filtered = trades.filter(t => {
        if (filter !== "all" && t.type !== filter) return false;
        if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalBought = trades.filter(t => t.type === "buy").reduce((s, t) => s + Number(t.total), 0);
    const totalSold = trades.filter(t => t.type === "sell").reduce((s, t) => s + Number(t.total), 0);

    return (
        <div className="flex flex-col gap-3 min-w-0">
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                    { label: "Total Trades", value: trades.length, color: "#e2e8f0" },
                    { label: "Total Bought", value: `$${totalBought.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#34d399" },
                    { label: "Total Sold", value: `$${totalSold.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#f87171" },
                ].map(card => (
                    <div key={card.label} className="glass-card p-4">
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>{card.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                {/* Filters */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
                        {(["all", "buy", "sell"] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "none",
                                background: filter === f ? (f === "buy" ? "rgba(52,211,153,0.2)" : f === "sell" ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)") : "transparent",
                                color: filter === f ? (f === "buy" ? "#34d399" : f === "sell" ? "#f87171" : "#e2e8f0") : "#64748b",
                                textTransform: "capitalize",
                            }}>{f}</button>
                        ))}
                    </div>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search symbol…"
                        style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", width: 130, outline: "none" }}
                    />
                    <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{filtered.length} records</span>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                        <div style={{ fontSize: 14, color: "#475569" }}>{trades.length === 0 ? "No trades yet — start trading!" : "No trades match this filter"}</div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 1.5fr 1fr 1fr 1fr 1.5fr", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {["Type", "Symbol", "Shares", "Price", "Total", "Date"].map(h => (
                                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.5px", textAlign: h === "Type" || h === "Symbol" ? "left" : "right" }}>{h.toUpperCase()}</div>
                            ))}
                        </div>
                        <div style={{ maxHeight: 500, overflowY: "auto" }}>
                            {filtered.map((t, i) => (
                                <div key={t.id ?? i}
                                    onClick={() => { setSelectedSymbol(t.symbol); setActiveTab("market"); }}
                                    style={{ display: "grid", gridTemplateColumns: "90px 1.5fr 1fr 1fr 1fr 1.5fr", padding: "11px 16px", cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                >
                                    <div>
                                        <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.type === "buy" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: t.type === "buy" ? "#34d399" : "#f87171" }}>
                                            {t.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, alignSelf: "center" }}>{t.symbol}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>{t.qty}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>${Number(t.price).toFixed(2)}</div>
                                    <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", alignSelf: "center" }}>${Number(t.total).toFixed(2)}</div>
                                    <div style={{ textAlign: "right", fontSize: 10, color: "#64748b", alignSelf: "center" }}>
                                        {new Date(t.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}