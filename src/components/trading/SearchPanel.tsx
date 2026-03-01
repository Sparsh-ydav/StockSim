"use client";
import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";

// ─── Sector map ──────────────────────────────────────────────────────────────
const SECTOR_MAP: Record<string, string> = {
    // Tech
    AAPL: "Tech", MSFT: "Tech", NVDA: "Tech", GOOGL: "Tech", AMZN: "Tech",
    META: "Tech", AVGO: "Tech", AMD: "Tech", INTC: "Tech", QCOM: "Tech",
    MU: "Tech", ADBE: "Tech", CRM: "Tech", ORCL: "Tech", NOW: "Tech", SHOP: "Tech",
    // Finance
    JPM: "Finance", BAC: "Finance", GS: "Finance", MS: "Finance", WFC: "Finance",
    V: "Finance", MA: "Finance", AXP: "Finance", BX: "Finance", "BRK-B": "Finance",
    COIN: "Finance", HOOD: "Finance",
    // Healthcare
    LLY: "Healthcare", UNH: "Healthcare", JNJ: "Healthcare", ABBV: "Healthcare",
    MRK: "Healthcare", PFE: "Healthcare", TMO: "Healthcare", ABT: "Healthcare",
    // Consumer
    WMT: "Consumer", COST: "Consumer", HD: "Consumer", NKE: "Consumer",
    MCD: "Consumer", SBUX: "Consumer", TGT: "Consumer", LOW: "Consumer",
    // Energy
    XOM: "Energy", CVX: "Energy", COP: "Energy", SLB: "Energy", OXY: "Energy",
    // ETFs
    SPY: "ETF", QQQ: "ETF", IWM: "ETF", DIA: "ETF", VTI: "ETF", GLD: "ETF", TLT: "ETF",
    // Growth
    TSLA: "Growth", NFLX: "Growth", UBER: "Growth", ABNB: "Growth",
    PLTR: "Growth", RBLX: "Growth", SNAP: "Growth", SPOT: "Growth", DASH: "Growth",
};

const SECTORS = ["All", "Tech", "Finance", "Healthcare", "Consumer", "Energy", "ETF", "Growth"];

type SortKey = "symbol" | "price" | "change" | "volume" | "marketCap";
type SortDir = "asc" | "desc";

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const w = 56, h = 22;
    const pts = data.map((v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    ).join(" ");
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none"
                stroke={positive ? "#34d399" : "#f87171"}
                strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

export default function SearchPanel() {
    const { quotes, selectedSymbol, setSelectedSymbol, setActiveTab, watchlist, toggleWatchlist } = useAppStore();

    const [query, setQuery] = useState("");
    const [sector, setSector] = useState("All");
    const [sortKey, setSortKey] = useState<SortKey>("marketCap");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [onlyUp, setOnlyUp] = useState(false);
    const [onlyWL, setOnlyWL] = useState(false);

    const stocks = useMemo(() => {
        let list = Object.values(quotes);

        // text search
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(s =>
                s.symbol.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q)
            );
        }
        // sector filter
        if (sector !== "All") {
            list = list.filter(s => SECTOR_MAP[s.symbol] === sector);
        }
        // gainers only
        if (onlyUp) list = list.filter(s => s.change >= 0);
        // watchlist only
        if (onlyWL) list = list.filter(s => watchlist.includes(s.symbol));

        // sort
        list = [...list].sort((a, b) => {
            let av = 0, bv = 0;
            if (sortKey === "symbol") { av = a.symbol < b.symbol ? -1 : 1; bv = 0; return sortDir === "asc" ? av : -av; }
            if (sortKey === "price") { av = a.price; bv = b.price; }
            if (sortKey === "change") { av = a.changePct; bv = b.changePct; }
            if (sortKey === "volume") { av = a.volume; bv = b.volume; }
            if (sortKey === "marketCap") { av = a.marketCap; bv = b.marketCap; }
            return sortDir === "desc" ? bv - av : av - bv;
        });

        return list;
    }, [quotes, query, sector, sortKey, sortDir, onlyUp, onlyWL, watchlist]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const gainers = Object.values(quotes).filter(s => s.change >= 0).length;
    const losers = Object.values(quotes).filter(s => s.change < 0).length;

    const sectorAccent = "#38bdf8";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

            {/* ── Top stats strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                    { label: "Tracked", value: Object.keys(quotes).length, color: "#e2e8f0" },
                    { label: "Gainers", value: gainers, color: "#34d399" },
                    { label: "Losers", value: losers, color: "#f87171" },
                ].map(c => (
                    <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Search + filters ── */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>

                {/* Search input */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search symbol or company name…"
                        style={{
                            width: "100%", padding: "10px 12px 10px 36px",
                            borderRadius: 10, fontSize: 13, fontWeight: 500,
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                            color: "#e2e8f0", outline: "none", fontFamily: "'DM Sans',sans-serif",
                        }}
                    />
                    {query && (
                        <button onClick={() => setQuery("")}
                            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer" }}>×</button>
                    )}
                </div>

                {/* Sector chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {SECTORS.map(s => (
                        <button key={s} onClick={() => setSector(s)} style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none",
                            background: sector === s ? `${sectorAccent}22` : "rgba(255,255,255,0.04)",
                            color: sector === s ? sectorAccent : "#64748b",
                            outline: sector === s ? `1px solid ${sectorAccent}55` : "1px solid transparent",
                            cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.12s",
                        }}>{s}</button>
                    ))}
                </div>

                {/* Toggle filters */}
                <div style={{ display: "flex", gap: 8 }}>
                    {[
                        { label: "▲ Gainers Only", active: onlyUp, toggle: () => setOnlyUp(v => !v), color: "#34d399" },
                        { label: "⭐ Watchlist", active: onlyWL, toggle: () => setOnlyWL(v => !v), color: "#fbbf24" },
                    ].map(f => (
                        <button key={f.label} onClick={f.toggle} style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none",
                            background: f.active ? `${f.color}18` : "rgba(255,255,255,0.04)",
                            color: f.active ? f.color : "#64748b",
                            outline: f.active ? `1px solid ${f.color}44` : "1px solid transparent",
                            cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.12s",
                        }}>{f.label}</button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", alignSelf: "center" }}>
                        {stocks.length} result{stocks.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* ── Results table ── */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>

                {/* Column headers */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "2.2fr 1fr 80px 1fr 1fr 36px",
                    padding: "10px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    gap: 8,
                }}>
                    {([
                        { key: "symbol", label: "Symbol" },
                        { key: "price", label: "Price" },
                        { key: null, label: "Chart" },
                        { key: "change", label: "Change" },
                        { key: "volume", label: "Volume" },
                        { key: null, label: "" },
                    ] as { key: SortKey | null; label: string }[]).map(({ key, label }, i) => (
                        <div key={i}
                            onClick={() => key && toggleSort(key)}
                            style={{
                                fontSize: 10, fontWeight: 700, color: sortKey === key ? sectorAccent : "#475569",
                                letterSpacing: "0.5px", textTransform: "uppercase",
                                textAlign: i === 0 ? "left" : "center",
                                cursor: key ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: i === 0 ? "flex-start" : "center", gap: 3,
                                userSelect: "none",
                            }}>
                            {label}
                            {key && sortKey === key && <span style={{ fontSize: 8 }}>{sortDir === "desc" ? "▼" : "▲"}</span>}
                        </div>
                    ))}
                </div>

                {/* Stock rows */}
                <div style={{ maxHeight: 540, overflowY: "auto" }}>
                    {stocks.length === 0 ? (
                        <div style={{ padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>
                            <div style={{ fontSize: 14, color: "#475569" }}>No stocks match your filters</div>
                        </div>
                    ) : stocks.map((s, i) => {
                        const isSelected = selectedSymbol === s.symbol;
                        const inWL = watchlist.includes(s.symbol);
                        const sectorLabel = SECTOR_MAP[s.symbol];

                        return (
                            <div key={s.symbol}
                                onClick={() => { setSelectedSymbol(s.symbol); setActiveTab("market"); }}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2.2fr 1fr 80px 1fr 1fr 36px",
                                    padding: "11px 16px", gap: 8,
                                    borderBottom: "1px solid rgba(255,255,255,0.035)",
                                    background: isSelected ? "rgba(52,211,153,0.05)" : "transparent",
                                    cursor: "pointer", transition: "background 0.12s", alignItems: "center",
                                }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                                {/* Symbol + name + sector badge */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? "#34d399" : "#e2e8f0" }}>{s.symbol}</span>
                                        {sectorLabel && (
                                            <span style={{
                                                padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                                                background: "rgba(56,189,248,0.1)", color: "#38bdf8", letterSpacing: "0.3px",
                                            }}>{sectorLabel}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                                        {s.name}
                                    </div>
                                </div>

                                {/* Price */}
                                <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#e2e8f0" }}>
                                    ${s.price.toFixed(2)}
                                </div>

                                {/* Sparkline */}
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <Sparkline data={s.sparkline ?? [s.price]} positive={s.change >= 0} />
                                </div>

                                {/* Change % */}
                                <div style={{ textAlign: "center" }}>
                                    <div style={{
                                        display: "inline-flex", alignItems: "center", gap: 2,
                                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                        fontVariantNumeric: "tabular-nums",
                                        background: s.change >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                                        color: s.change >= 0 ? "#34d399" : "#f87171",
                                    }}>
                                        {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                                    </div>
                                </div>

                                {/* Volume */}
                                <div style={{ textAlign: "center", fontSize: 11, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                                    {s.volume > 1e9 ? `${(s.volume / 1e9).toFixed(1)}B`
                                        : s.volume > 1e6 ? `${(s.volume / 1e6).toFixed(1)}M`
                                            : `${(s.volume / 1e3).toFixed(0)}K`}
                                </div>

                                {/* Watchlist star */}
                                <div style={{ textAlign: "center" }}>
                                    <button
                                        onClick={e => { e.stopPropagation(); toggleWatchlist(s.symbol); }}
                                        title={inWL ? "Remove from watchlist" : "Add to watchlist"}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            fontSize: 14, opacity: inWL ? 1 : 0.25, transition: "opacity 0.15s",
                                            color: inWL ? "#fbbf24" : "#94a3b8",
                                        }}
                                    >★</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}