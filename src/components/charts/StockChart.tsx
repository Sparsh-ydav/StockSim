"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { useAppStore } from "@/lib/store";

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Range = typeof RANGES[number];

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === "1D") return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  if (range === "1W") return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  if (range === "1M") return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "2-digit" });
}

function formatXAxis(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === "1D") return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  if (range === "1W") return d.toLocaleDateString("en", { weekday: "short" });
  if (range === "1M") return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  if (range === "3M") return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
}

function generateFallback(currentPrice: number, change: number, points = 52): any[] {
  const start = currentPrice - change;
  const now = Date.now();
  const step = (8 * 3600 * 1000) / points;
  let price = start;
  return Array.from({ length: points }, (_, i) => {
    const progress = i / points;
    price = start + change * progress + (Math.random() - 0.5) * currentPrice * 0.003;
    return {
      time: now - (points - i) * step,
      open: parseFloat(price.toFixed(2)),
      high: parseFloat((price + Math.abs((Math.random() - 0.5) * 0.5)).toFixed(2)),
      low: parseFloat((price - Math.abs((Math.random() - 0.5) * 0.5)).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10_000_000),
    };
  }).concat([{ time: now, open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: 0 }]);
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, range }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isUp = d.close >= d.open;

  return (
    <div style={{
      background: "rgba(10,14,26,0.97)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 12,
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      backdropFilter: "blur(20px)",
      minWidth: 160,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Timestamp */}
      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 8, letterSpacing: "0.3px" }}>
        {formatTime(d.time, range)}
      </div>

      {/* Price grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {[
          { label: "Close", value: d.close, accent: true },
          { label: "Open", value: d.open },
          { label: "High", value: d.high, color: "#34d399" },
          { label: "Low", value: d.low, color: "#f87171" },
        ].map(({ label, value, accent, color }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
            <div style={{
              fontSize: 13,
              fontWeight: accent ? 800 : 600,
              color: color ?? (accent ? (isUp ? "#34d399" : "#f87171") : "#e2e8f0"),
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.3px",
            }}>
              ${value?.toFixed(2) ?? "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Volume */}
      {d.volume > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Volume</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
            {d.volume > 1e6 ? `${(d.volume / 1e6).toFixed(2)}M` : d.volume > 1e3 ? `${(d.volume / 1e3).toFixed(0)}K` : d.volume}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StockChart() {
  const { selectedSymbol, quotes, chartRange, setChartRange } = useAppStore();
  const quote = quotes[selectedSymbol];

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  // Track hovered price for the live crosshair display
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);

  // Per-session cache so switching symbol/range re-fetches fresh
  const cacheRef = useRef<Map<string, any[]>>(new Map());

  const loadChart = useCallback(async (sym: string, range: Range) => {
    const key = `${sym}-${range}`;

    // Use cache if available
    if (cacheRef.current.has(key)) {
      setChartData(cacheRef.current.get(key)!);
      setIsFallback(false);
      return;
    }

    setLoading(true);
    setChartData([]);   // clear old data immediately so stale chart doesn't show

    try {
      const res = await fetch(`/api/chart?symbol=${sym}&range=${range}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        cacheRef.current.set(key, data);
        setChartData(data);
        setIsFallback(false);
      } else {
        // Finnhub returned empty (market closed / rate limit) — use synthetic data
        const q = quotes[sym];
        const fb = generateFallback(q?.price ?? 100, q?.change ?? 0);
        setChartData(fb);
        setIsFallback(true);
      }
    } catch {
      const q = quotes[sym];
      setChartData(generateFallback(q?.price ?? 100, q?.change ?? 0));
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, [quotes]);

  // Reload whenever symbol OR range changes
  useEffect(() => {
    loadChart(selectedSymbol, chartRange as Range);
    setHoveredPrice(null);
  }, [selectedSymbol, chartRange]);

  // Determine colour based on chart data (first → last close)
  const firstClose = chartData[0]?.close;
  const lastClose = chartData[chartData.length - 1]?.close;
  const isUp = firstClose != null && lastClose != null ? lastClose >= firstClose : (quote?.change ?? 0) >= 0;
  const color = isUp ? "#34d399" : "#f87171";
  const colorDim = isUp ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";

  // Display price: hovered point price or live quote price
  const displayPrice = hoveredPrice ?? quote?.price;

  // Range change stats
  const rangePnl = firstClose != null && lastClose != null ? lastClose - firstClose : (quote?.change ?? 0);
  const rangePnlPct = firstClose != null && firstClose !== 0 ? (rangePnl / firstClose) * 100 : (quote?.changePct ?? 0);

  // Thin XAxis tick count
  const xAxisTickCount = { "1D": 6, "1W": 7, "1M": 6, "3M": 6, "1Y": 6 }[chartRange as Range] ?? 6;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(20px)",
      borderRadius: 18,
      padding: "20px 20px 16px",
      overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.4px", marginBottom: 4, textTransform: "uppercase" }}>
            {quote?.name ?? selectedSymbol}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px",
              fontVariantNumeric: "tabular-nums", color: "#f1f5f9",
              transition: "color 0.2s",
            }}>
              {displayPrice != null ? `$${displayPrice.toFixed(2)}` : "—"}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: "-0.3px", fontVariantNumeric: "tabular-nums" }}>
                {rangePnl >= 0 ? "+" : ""}${Math.abs(rangePnl).toFixed(2)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color, opacity: 0.8 }}>
                {rangePnlPct >= 0 ? "+" : ""}{rangePnlPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {/* Symbol badge */}
          <div style={{
            padding: "5px 14px", borderRadius: 8,
            background: `${color}18`, border: `1px solid ${color}44`,
            fontSize: 13, fontWeight: 800, color, letterSpacing: "0.5px",
          }}>
            {selectedSymbol}
          </div>
          {/* Fallback notice */}
          {isFallback && (
            <div style={{ fontSize: 9, color: "#475569", fontWeight: 500 }}>estimated · market closed</div>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ height: 200, marginBottom: 12, position: "relative" }}>
        {loading ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {/* Skeleton shimmer bars */}
            {[40, 65, 50, 80, 60, 70, 45].map((h, i) => (
              <div key={i} style={{ position: "absolute", bottom: 0, left: `${i * 14.5}%`, width: "12%", height: `${h}%`, background: "rgba(255,255,255,0.04)", borderRadius: 4, animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite alternate` }} />
            ))}
            <style>{`@keyframes shimmer{from{opacity:0.3}to{opacity:0.7}}`}</style>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              onMouseMove={(e: any) => {
                const val = e?.activePayload?.[0]?.payload?.close;
                if (val != null) setHoveredPrice(val);
              }}
              onMouseLeave={() => setHoveredPrice(null)}
            >
              <defs>
                <linearGradient id={`fill-${selectedSymbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="60%" stopColor={color} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tickFormatter={(v) => formatXAxis(v, chartRange as Range)}
                tickCount={xAxisTickCount}
                tick={{ fontSize: 10, fill: "#475569", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />

              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "#475569", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
                width={48}
                orientation="right"
              />

              <Tooltip
                content={<ChartTooltip range={chartRange} />}
                cursor={{
                  stroke: color,
                  strokeWidth: 1,
                  strokeDasharray: "4 3",
                  strokeOpacity: 0.6,
                }}
              />

              {/* Baseline reference at first close */}
              {firstClose != null && (
                <ReferenceLine
                  y={firstClose}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${selectedSymbol})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: "#0a0e1a",
                  strokeWidth: 2,
                  style: { filter: `drop-shadow(0 0 6px ${color})` },
                }}
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Range selector ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {RANGES.map(r => {
          const active = chartRange === r;
          return (
            <button key={r} onClick={() => setChartRange(r)} style={{
              padding: "5px 12px",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              letterSpacing: "0.3px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: active ? color : "rgba(255,255,255,0.05)",
              color: active ? "#0a0e1a" : "#64748b",
              boxShadow: active ? `0 2px 12px ${color}44` : "none",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}>
              {r}
            </button>
          );
        })}
      </div>

      {/* ── Stats row ── */}
      {quote && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {[
            { label: "Open", value: `$${(quote.open ?? 0).toFixed(2)}` },
            { label: "High", value: `$${(quote.high ?? 0).toFixed(2)}`, color: "#34d399" },
            { label: "Low", value: `$${(quote.low ?? 0).toFixed(2)}`, color: "#f87171" },
            { label: "Volume", value: quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(1)}M` : `${(quote.volume / 1e3).toFixed(0)}K` },
            { label: "Mkt Cap", value: quote.marketCap > 1e9 ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : quote.marketCap > 1e6 ? `$${(quote.marketCap / 1e6).toFixed(0)}M` : "—" },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 10,
              padding: "8px 10px",
            }}>
              <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c ?? "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}