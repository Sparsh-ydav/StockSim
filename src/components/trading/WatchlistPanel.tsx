"use client";
import { useState } from "react";
import { useAppStore, DEFAULT_SYMBOLS_LIST } from "@/lib/store";

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
    if (!data.length) return null;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const w = 72, h = 28;
    const pts = data.map((v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    ).join(" ");
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none" stroke={positive ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

export default function WatchlistPanel() {
    const { quotes, watchlist, toggleWatchlist, setSelectedSymbol, setActiveTab } = useAppStore();
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const watchedQuotes = watchlist.map(s => quotes[s]).filter(Boolean);

    const availableToAdd = DEFAULT_SYMBOLS_LIST.filter(s =>
        !watchlist.includes(s) &&
        s.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-3 min-w-0">
            {/* Header */}
            <div className="glass-card p-4" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Watchlist</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{watchlist.length} symbols tracked</div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}
                >
                    + Add Symbol
                </button>
            </div>

            {/* Add modal */}
            {showAddModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
                    <div style={{ background: "#0d1525", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24, width: 380, maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>Add to Watchlist</span>
                            <button onClick={() => setShowAddModal(false)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 28, height: 28, color: "#94a3b8", fontSize: 16 }}>×</button>
                        </div>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search symbol or name…"
                            style={{ padding: "10px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", outline: "none", marginBottom: 12 }}
                        />
                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {availableToAdd.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 24, color: "#475569", fontSize: 13 }}>No more symbols to add</div>
                            ) : availableToAdd.map(sym => {
                                const q = quotes[sym];
                                return (
                                    <div key={sym}
                                        onClick={() => { toggleWatchlist(sym); }}
                                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.12s", marginBottom: 2 }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                    >
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{sym}</div>
                                            <div style={{ fontSize: 11, color: "#64748b" }}>{q?.name?.split(" ").slice(0, 3).join(" ") ?? "—"}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            {q && <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${q.price.toFixed(2)}</div>}
                                            {q && <div style={{ fontSize: 11, color: q.change >= 0 ? "#34d399" : "#f87171" }}>{q.changePct >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Watchlist items */}
            <div className="glass-card overflow-hidden">
                {watchedQuotes.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
                        <div style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>Your watchlist is empty</div>
                        <button onClick={() => setShowAddModal(true)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                            Add symbols →
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 1fr 40px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {["Symbol", "Price", "Chart", "Change", ""].map((h, i) => (
                                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.5px", textAlign: h === "Symbol" ? "left" : "center" }}>{h.toUpperCase()}</div>
                            ))}
                        </div>
                        {watchedQuotes.map((s, i) => (
                            <div key={s.symbol}
                                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 1fr 40px", padding: "11px 16px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                            >
                                <div onClick={() => { setSelectedSymbol(s.symbol); setActiveTab("market"); }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>{s.symbol}</div>
                                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{s.name.split(" ").slice(0, 2).join(" ")}</div>
                                </div>
                                <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }} onClick={() => { setSelectedSymbol(s.symbol); setActiveTab("market"); }}>
                                    ${s.price.toFixed(2)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "center" }} onClick={() => { setSelectedSymbol(s.symbol); setActiveTab("market"); }}>
                                    <Sparkline data={s.sparkline ?? [s.price]} positive={s.change >= 0} />
                                </div>
                                <div style={{ textAlign: "center" }} onClick={() => { setSelectedSymbol(s.symbol); setActiveTab("market"); }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: s.change >= 0 ? "#34d399" : "#f87171" }}>
                                        {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                                    </div>
                                    <div style={{ fontSize: 10, color: s.change >= 0 ? "#34d399" : "#f87171" }}>
                                        {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}
                                    </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <button
                                        onClick={() => toggleWatchlist(s.symbol)}
                                        title="Remove from watchlist"
                                        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, width: 26, height: 26, color: "#f87171", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}