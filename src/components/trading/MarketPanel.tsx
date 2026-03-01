"use client";
import { useAppStore } from "@/lib/store";
import StockChart from "@/components/charts/StockChart";

const PREVIEW_COUNT = 8; // rows shown before "View All"

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
      <polyline points={pts} fill="none"
        stroke={positive ? "#34d399" : "#f87171"}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function MarketPanel() {
  const { quotes, selectedSymbol, setSelectedSymbol, setActiveTab } = useAppStore();
  const stockList = Object.values(quotes);
  const preview = stockList.slice(0, PREVIEW_COUNT);
  const remaining = stockList.length - PREVIEW_COUNT;

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <StockChart />

      {/* Stock list — capped at PREVIEW_COUNT */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Market Overview</span>
            <span style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>
              {stockList.length} stocks
            </span>
          </div>
          <div className="live-dot" />
        </div>

        {/* Rows */}
        <div>
          {stockList.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#475569" }}>
              Loading market data…
            </div>
          ) : preview.map((s) => (
            <div
              key={s.symbol}
              onClick={() => setSelectedSymbol(s.symbol)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 80px 60px",
                gap: 8, padding: "10px 16px",
                background: selectedSymbol === s.symbol ? "rgba(52,211,153,0.05)" : "transparent",
                cursor: "pointer", transition: "background 0.12s",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
              onMouseEnter={e => { if (selectedSymbol !== s.symbol) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (selectedSymbol !== s.symbol) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedSymbol === s.symbol ? "#34d399" : "#e2e8f0" }}>
                  {s.symbol}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.name.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${s.price.toFixed(2)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 1, color: s.change >= 0 ? "#34d399" : "#f87171" }}>
                  {s.change >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <Sparkline data={s.sparkline ?? [s.price]} positive={s.change >= 0} />
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#475569" }}>Vol</div>
                <div style={{ fontSize: 10, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                  {s.volume > 1e6 ? `${(s.volume / 1e6).toFixed(1)}M` : `${(s.volume / 1e3).toFixed(0)}K`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All footer */}
        {remaining > 0 && (
          <button
            onClick={() => setActiveTab("search")}
            style={{
              width: "100%", padding: "13px 16px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              border: "none", cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>
              🔍 View all {remaining} more stocks
            </span>
            <span style={{ fontSize: 11, color: "#475569" }}>→</span>
          </button>
        )}
      </div>
    </div>
  );
}