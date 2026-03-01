"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
    user: { id: string; email: string; name: string; avatar?: string; created_at: string };
    account: { cash_balance: number; bio?: string; theme_color?: string; risk_level?: string; default_order_size?: number };
    positions: { symbol: string; shares: number; avg_cost: number }[];
    trades: { symbol: string; type: string; qty: number; price: number; total: number; created_at: string }[];
};

const THEME_COLORS = [
    { label: "Emerald", value: "#34d399" },
    { label: "Violet", value: "#8b5cf6" },
    { label: "Sky", value: "#38bdf8" },
    { label: "Rose", value: "#fb7185" },
    { label: "Amber", value: "#fbbf24" },
    { label: "Cyan", value: "#22d3ee" },
];

const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive", "Degen"];
const STARTING_BALANCE = 25000;

const MOCK_PRICES: Record<string, number> = {
    AAPL: 189.43, TSLA: 248.50, NVDA: 875.39, MSFT: 412.27,
    AMZN: 186.60, GOOGL: 173.15, META: 501.30, AMD: 178.45,
};

function getPrice(symbol: string, avgCost: number) {
    return MOCK_PRICES[symbol] ?? avgCost * (1 + (Math.random() - 0.5) * 0.1);
}

export default function ProfileClient({ user, account, positions, trades }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const [displayName, setDisplayName] = useState(user.name);
    const [bio, setBio] = useState(account.bio ?? "");
    const [themeColor, setThemeColor] = useState(account.theme_color ?? "#34d399");
    const [riskLevel, setRiskLevel] = useState(account.risk_level ?? "Moderate");
    const [defaultOrderSize, setDefaultOrderSize] = useState(account.default_order_size ?? 100);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<"overview" | "positions" | "history" | "settings">("overview");
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const portfolioValue = positions.reduce((sum, p) => {
        return sum + getPrice(p.symbol, p.avg_cost) * p.shares;
    }, 0);
    const totalValue = account.cash_balance + portfolioValue;
    const totalPnl = totalValue - STARTING_BALANCE;
    const totalPnlPct = (totalPnl / STARTING_BALANCE) * 100;
    const buyTrades = trades.filter(t => t.type === "buy").length;
    const sellTrades = trades.filter(t => t.type === "sell").length;
    const winningPositions = positions.filter(p => getPrice(p.symbol, p.avg_cost) > p.avg_cost).length;
    const memberDays = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const saveProfile = async () => {
        setSaving(true);
        try {
            await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: displayName, bio, theme_color: themeColor, risk_level: riskLevel, default_order_size: defaultOrderSize }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const resetAccount = async () => {
        setResetting(true);
        await fetch("/api/profile", { method: "POST" });
        setResetting(false);
        setShowResetConfirm(false);
        router.refresh();
    };

    const c = themeColor;

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0e1a 0%, #0d1525 40%, #0a1628 70%, #060d1a 100%)",
            fontFamily: "'DM Sans', -apple-system, sans-serif",
            color: "#e2e8f0",
            position: "relative",
        }}>
            <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${c}0f 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0, transition: "background 0.5s" }} />
            <div style={{ position: "fixed", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${c}08 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0, transition: "background 0.5s" }} />

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea { outline: none; font-family: inherit; }
        button { cursor: pointer; font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .pos-row:hover { background: rgba(255,255,255,0.04) !important; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer; }
      `}</style>

            {/* Nav */}
            <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>
                        ← Dashboard
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Profile</span>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 12px" }}>
                    Sign out
                </button>
            </nav>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

                {/* Hero */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 36, flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                        <div style={{
                            width: 88, height: 88, borderRadius: 24,
                            background: user.avatar ? "transparent" : `linear-gradient(135deg, ${c}cc, ${c}66)`,
                            border: `2px solid ${c}44`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 34, fontWeight: 800, color: "#0a0e1a",
                            boxShadow: `0 0 40px ${c}22`, overflow: "hidden",
                        }}>
                            {user.avatar ? <img src={user.avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : displayName[0]?.toUpperCase()}
                        </div>
                        <div style={{ position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#34d399", border: "3px solid #0a0e1a" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>{displayName}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{user.email}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 20, background: `${c}18`, border: `1px solid ${c}44`, color: c, fontSize: 11, fontWeight: 600 }}>{riskLevel} Trader</span>
                            <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>{memberDays === 0 ? "New member" : `${memberDays}d member`}</span>
                            <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>{trades.length} trades</span>
                        </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Total Value</div>
                        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums", color: totalPnl >= 0 ? "#34d399" : "#f87171" }}>
                            ${totalValue.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: totalPnl >= 0 ? "#34d399" : "#f87171", marginTop: 2 }}>
                            {totalPnl >= 0 ? "▲" : "▼"} ${Math.abs(totalPnl).toFixed(2)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%) all time
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
                    {[
                        { label: "Cash", value: `$${account.cash_balance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "available", delay: "0ms" },
                        { label: "Holdings", value: `$${portfolioValue.toFixed(2)}`, sub: `${positions.length} positions`, delay: "60ms" },
                        { label: "Buys", value: buyTrades, sub: "total orders", delay: "120ms" },
                        { label: "Sells", value: sellTrades, sub: "total orders", delay: "180ms" },
                        { label: "Winning", value: `${winningPositions}/${positions.length}`, sub: "positions in profit", delay: "240ms", accent: true },
                    ].map(stat => (
                        <div key={stat.label} className="stat-card" style={{
                            animationDelay: stat.delay,
                            background: stat.accent ? `${c}10` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${stat.accent ? c + "33" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 14, padding: "16px 18px", backdropFilter: "blur(20px)",
                        }}>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>{stat.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: stat.accent ? c : "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{stat.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {(["overview", "positions", "history", "settings"] as const).map(tab => (
                        <button key={tab} className="nav-btn" onClick={() => setActiveSection(tab)} style={{
                            padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, border: "none",
                            background: activeSection === tab ? `${c}20` : "transparent",
                            color: activeSection === tab ? c : "#64748b",
                            textTransform: "capitalize", transition: "all 0.15s",
                        }}>{tab}</button>
                    ))}
                </div>

                {/* OVERVIEW */}
                {activeSection === "overview" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>About</div>
                            {bio ? <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>{bio}</p> : <p style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>No bio yet — add one in Settings</p>}
                        </div>

                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Performance</div>
                            {[
                                { label: "Starting Balance", value: "$25,000.00", color: "#64748b" },
                                { label: "Current Value", value: `$${totalValue.toFixed(2)}`, color: "#e2e8f0" },
                                { label: "Total Gain/Loss", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? "#34d399" : "#f87171" },
                                { label: "Return %", value: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`, color: totalPnl >= 0 ? "#34d399" : "#f87171" },
                            ].map(row => (
                                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Trading Style</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {RISK_LEVELS.map(level => (
                                    <div key={level} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: riskLevel === level ? `${c}20` : "rgba(255,255,255,0.04)", border: `1px solid ${riskLevel === level ? c + "44" : "rgba(255,255,255,0.08)"}`, color: riskLevel === level ? c : "#64748b" }}>{level}</div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>Default order size: <span style={{ color: "#94a3b8", fontWeight: 600 }}>${defaultOrderSize}</span></div>
                        </div>

                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Recent Activity</div>
                            {trades.slice(0, 4).length === 0
                                ? <p style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>No trades yet</p>
                                : trades.slice(0, 4).map((t, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.type === "buy" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: t.type === "buy" ? "#34d399" : "#f87171" }}>{t.type.toUpperCase()}</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.symbol}</span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${Number(t.total).toFixed(2)}</div>
                                            <div style={{ fontSize: 10, color: "#475569" }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* POSITIONS */}
                {activeSection === "positions" && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Current Positions</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{positions.length} holdings · ${portfolioValue.toFixed(2)} total</div>
                        </div>
                        {positions.length === 0
                            ? <div style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 14 }}>No open positions</div>
                            : <>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    {["Symbol", "Shares", "Avg Cost", "Current", "Value", "P&L"].map(h => (
                                        <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.5px", textTransform: "uppercase", textAlign: h === "Symbol" ? "left" : "right" }}>{h}</div>
                                    ))}
                                </div>
                                {positions.map((p, i) => {
                                    const cur = getPrice(p.symbol, p.avg_cost);
                                    const value = cur * p.shares;
                                    const pnl = (cur - p.avg_cost) * p.shares;
                                    const pnlPct = ((cur - p.avg_cost) / p.avg_cost) * 100;
                                    return (
                                        <div key={p.symbol} className="pos-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "14px 24px", transition: "background 0.15s", borderBottom: i < positions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{p.symbol}</div>
                                            <div style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{p.shares}</div>
                                            <div style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "#94a3b8" }}>${p.avg_cost.toFixed(2)}</div>
                                            <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${cur.toFixed(2)}</div>
                                            <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${value.toFixed(2)}</div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: pnl >= 0 ? "#34d399" : "#f87171", fontVariantNumeric: "tabular-nums" }}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</div>
                                                <div style={{ fontSize: 10, color: pnl >= 0 ? "#34d399" : "#f87171" }}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>}
                    </div>
                )}

                {/* HISTORY */}
                {activeSection === "history" && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Trade History</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{trades.length} trades total</div>
                        </div>
                        {trades.length === 0
                            ? <div style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 14 }}>No trades yet</div>
                            : <>
                                <div style={{ display: "grid", gridTemplateColumns: "100px 2fr 1fr 1fr 1fr 1.5fr", padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    {["Type", "Symbol", "Shares", "Price", "Total", "Date"].map(h => (
                                        <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.5px", textTransform: "uppercase", textAlign: h === "Type" || h === "Symbol" ? "left" : "right" }}>{h}</div>
                                    ))}
                                </div>
                                {trades.map((t, i) => (
                                    <div key={i} className="pos-row" style={{ display: "grid", gridTemplateColumns: "100px 2fr 1fr 1fr 1fr 1.5fr", padding: "12px 24px", transition: "background 0.15s", borderBottom: i < trades.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                        <div><span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.type === "buy" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: t.type === "buy" ? "#34d399" : "#f87171" }}>{t.type.toUpperCase()}</span></div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.symbol}</div>
                                        <div style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "#94a3b8" }}>{t.qty}</div>
                                        <div style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>${Number(t.price).toFixed(2)}</div>
                                        <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${Number(t.total).toFixed(2)}</div>
                                        <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>{new Date(t.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                                    </div>
                                ))}
                            </>}
                    </div>
                )}

                {/* SETTINGS */}
                {activeSection === "settings" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 20 }}>Edit Profile</div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Display Name</label>
                                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell other traders about yourself..." style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", resize: "vertical" }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
                                <input value={user.email} disabled style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#475569" }} />
                                <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Managed by your OAuth provider</div>
                            </div>
                            <button onClick={saveProfile} disabled={saving} style={{ width: "100%", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: saved ? "rgba(52,211,153,0.2)" : `${c}33`, border: `1px solid ${saved ? "rgba(52,211,153,0.4)" : c + "55"}`, color: saved ? "#34d399" : c, transition: "all 0.2s" }}>
                                {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Accent Color</div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    {THEME_COLORS.map(tc => (
                                        <button key={tc.value} onClick={() => setThemeColor(tc.value)} style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${themeColor === tc.value ? "#fff" : "transparent"}`, background: tc.value, transition: "all 0.15s", boxShadow: themeColor === tc.value ? `0 0 16px ${tc.value}88` : "none", transform: themeColor === tc.value ? "scale(1.15)" : "scale(1)" }} title={tc.label} />
                                    ))}
                                </div>
                                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>Selected: <span style={{ color: c, fontWeight: 600 }}>{THEME_COLORS.find(tc => tc.value === c)?.label ?? "Custom"}</span></div>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Risk Profile</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {RISK_LEVELS.map(level => (
                                        <button key={level} onClick={() => setRiskLevel(level)} style={{ padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", background: riskLevel === level ? `${c}20` : "rgba(255,255,255,0.04)", color: riskLevel === level ? c : "#64748b", outline: riskLevel === level ? `1px solid ${c}44` : "1px solid rgba(255,255,255,0.07)", transition: "all 0.15s" }}>{level}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 16 }}>Default Order Size</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                    <input type="range" min={10} max={10000} step={10} value={defaultOrderSize} onChange={e => setDefaultOrderSize(Number(e.target.value))} style={{ flex: 1, accentColor: c }} />
                                    <span style={{ fontSize: 16, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums", minWidth: 70, textAlign: "right" }}>${defaultOrderSize.toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#475569" }}>Pre-fill order panel with this dollar amount</div>
                            </div>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <button onClick={saveProfile} disabled={saving} style={{ padding: "13px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", background: saved ? "rgba(52,211,153,0.2)" : `linear-gradient(135deg, ${c}cc, ${c}88)`, color: saved ? "#34d399" : "#0a0e1a", boxShadow: `0 4px 24px ${c}33`, transition: "all 0.2s" }}>
                                {saving ? "Saving…" : saved ? "✓ All changes saved!" : "Save All Settings"}
                            </button>
                        </div>

                        <div style={{ gridColumn: "1 / -1", background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>Danger Zone</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Reset Paper Trading Account</div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>Wipes all trades, positions, and restores $25,000 cash. Cannot be undone.</div>
                                </div>
                                {showResetConfirm
                                    ? <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => setShowResetConfirm(false)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>Cancel</button>
                                        <button onClick={resetAccount} disabled={resetting} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171" }}>{resetting ? "Resetting…" : "Yes, reset everything"}</button>
                                    </div>
                                    : <button onClick={() => setShowResetConfirm(true)} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>Reset Account</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}