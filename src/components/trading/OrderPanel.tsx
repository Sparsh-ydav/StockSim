"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

type Props = { onToast: (msg: string, ok?: boolean) => void };
type Mode = "market" | "limit";

export default function OrderPanel({ onToast }: Props) {
  const {
    selectedSymbol, quotes, cashBalance, setCashBalance,
    positions, setPositions, addTrade,
    limitOrders, addLimitOrder, cancelLimitOrder,
    addNotification,
  } = useAppStore();

  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [mode, setMode] = useState<Mode>("market");
  const [shares, setShares] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const quote = quotes[selectedSymbol];
  const position = positions.find(p => p.symbol === selectedSymbol);
  const qty = parseFloat(shares) || 0;
  const lp = parseFloat(limitPrice) || 0;
  const marketTotal = qty * (quote?.price ?? 0);
  const limitTotal = qty * lp;

  // ── Market order ─────────────────────────────────────────
  const executeTrade = async () => {
    if (!quote || qty <= 0) return onToast("Enter valid share count", false);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selectedSymbol, qty, price: quote.price, type: orderType }),
      });
      const data = await res.json();
      if (!res.ok) return onToast(data.error ?? "Trade failed", false);

      if (orderType === "buy") {
        setCashBalance(cashBalance - marketTotal);
        setPositions(
          position
            ? positions.map(p => p.symbol === selectedSymbol
              ? { ...p, shares: p.shares + qty, avg_cost: (p.avg_cost * p.shares + marketTotal) / (p.shares + qty) }
              : p)
            : [...positions, { id: crypto.randomUUID(), symbol: selectedSymbol, shares: qty, avg_cost: quote.price }]
        );
      } else {
        setCashBalance(cashBalance + marketTotal);
        setPositions(positions.map(p => p.symbol === selectedSymbol ? { ...p, shares: p.shares - qty } : p).filter(p => p.shares > 0));
      }

      if (data.trade) addTrade(data.trade);
      const msg = orderType === "buy"
        ? `Bought ${qty} ${selectedSymbol} @ $${quote.price.toFixed(2)}`
        : `Sold ${qty} ${selectedSymbol} @ $${quote.price.toFixed(2)}`;
      onToast(msg);
      addNotification({ title: `Market Order Filled`, message: msg, type: "success" });
      setShares("");
    } catch {
      onToast("Network error", false);
    }
  };

  // ── Limit order ───────────────────────────────────────────
  const placeLimitOrder = () => {
    if (!quote || qty <= 0) return onToast("Enter valid share count", false);
    if (lp <= 0) return onToast("Enter a valid limit price", false);

    // Validate logic
    if (orderType === "buy" && lp >= quote.price)
      return onToast("Buy limit must be below market price", false);
    if (orderType === "sell" && lp <= quote.price)
      return onToast("Sell limit must be above market price", false);
    if (orderType === "buy" && lp * qty > cashBalance)
      return onToast("Insufficient funds for this limit order", false);
    if (orderType === "sell" && (!position || position.shares < qty))
      return onToast("Not enough shares to sell", false);

    const order = {
      id: crypto.randomUUID(),
      symbol: selectedSymbol,
      type: orderType,
      qty,
      limitPrice: lp,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    };

    addLimitOrder(order);
    const msg = `${orderType === "buy" ? "Buy" : "Sell"} limit placed: ${qty} ${selectedSymbol} @ $${lp.toFixed(2)}`;
    onToast(msg);
    addNotification({ title: "Limit Order Placed", message: msg, type: "info" });
    setShares("");
    setLimitPrice("");
  };

  const pendingForSymbol = limitOrders.filter(o => o.symbol === selectedSymbol && o.status === "pending");

  const accentBuy = "#34d399";
  const accentSell = "#f87171";
  const accent = orderType === "buy" ? accentBuy : accentSell;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Order card ── */}
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 18, backdropFilter: "blur(24px)" }}>

        {/* Header */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 14 }}>
          Place Order · <span style={{ color: "#e2e8f0" }}>{selectedSymbol}</span>
          {quote && <span style={{ color: "#475569", fontWeight: 500, marginLeft: 6 }}>${quote.price.toFixed(2)}</span>}
        </div>

        {/* Mode tabs: Market / Limit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
          {(["market", "limit"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "7px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
              background: mode === m ? "rgba(255,255,255,0.1)" : "transparent",
              color: mode === m ? "#e2e8f0" : "#64748b",
              letterSpacing: "0.3px", textTransform: "capitalize",
            }}>{m}</button>
          ))}
        </div>

        {/* Buy / Sell toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
          {(["buy", "sell"] as const).map(t => (
            <button key={t} onClick={() => setOrderType(t)} style={{
              padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
              background: orderType === t
                ? t === "buy" ? "rgba(52,211,153,0.22)" : "rgba(248,113,113,0.22)"
                : "transparent",
              color: orderType === t ? (t === "buy" ? accentBuy : accentSell) : "#64748b",
              textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>

        {/* Shares input */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Shares</label>
          <input
            type="number" value={shares} onChange={e => setShares(e.target.value)}
            placeholder="0" min="0"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#e2e8f0", outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {/* Limit price input — only shown in limit mode */}
        {mode === "limit" && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Limit Price
              <span style={{ color: "#475569", fontWeight: 500, marginLeft: 6, textTransform: "none", fontSize: 9 }}>
                {orderType === "buy" ? "executes when price drops to" : "executes when price rises to"}
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 700, fontSize: 14 }}>$</span>
              <input
                type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                placeholder={quote ? (orderType === "buy" ? (quote.price * 0.97).toFixed(2) : (quote.price * 1.03).toFixed(2)) : "0.00"}
                min="0" step="0.01"
                style={{ width: "100%", padding: "10px 12px 10px 24px", borderRadius: 10, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", background: `${accent}10`, border: `1px solid ${accent}40`, color: "#e2e8f0", outline: "none", fontFamily: "inherit" }}
              />
            </div>
            {quote && lp > 0 && (
              <div style={{ fontSize: 10, color: "#475569", marginTop: 4, fontWeight: 500 }}>
                {orderType === "buy"
                  ? `${((quote.price - lp) / quote.price * 100).toFixed(1)}% below market`
                  : `${((lp - quote.price) / quote.price * 100).toFixed(1)}% above market`}
              </div>
            )}
          </div>
        )}

        {/* Summary box */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          {mode === "market" ? (
            <>
              <Row label="Market Price" value={`$${quote?.price.toFixed(2) ?? "—"}`} />
              <Row label="Quantity" value={qty || 0} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
              <Row label="Est. Total" value={`$${marketTotal.toFixed(2)}`} accent={accent} bold />
            </>
          ) : (
            <>
              <Row label="Market Price" value={`$${quote?.price.toFixed(2) ?? "—"}`} />
              <Row label="Limit Price" value={lp > 0 ? `$${lp.toFixed(2)}` : "—"} accent={accent} />
              <Row label="Quantity" value={qty || 0} />
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
              <Row label="Order Total" value={lp > 0 && qty > 0 ? `$${limitTotal.toFixed(2)}` : "—"} accent={accent} bold />
            </>
          )}
        </div>

        {/* Action button */}
        {mode === "market" ? (
          <button onClick={executeTrade} style={{
            width: "100%", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 800,
            border: "none", fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.3px",
            background: orderType === "buy"
              ? "linear-gradient(135deg, rgba(52,211,153,0.9), rgba(16,185,129,0.9))"
              : "linear-gradient(135deg, rgba(248,113,113,0.9), rgba(239,68,68,0.9))",
            color: "#fff",
            boxShadow: orderType === "buy" ? "0 4px 20px rgba(52,211,153,0.25)" : "0 4px 20px rgba(248,113,113,0.25)",
            transition: "all 0.2s",
          }}>
            {orderType === "buy" ? `Buy ${selectedSymbol}` : `Sell ${selectedSymbol}`}
          </button>
        ) : (
          <button onClick={placeLimitOrder} style={{
            width: "100%", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 800,
            border: `1px solid ${accent}55`, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.3px",
            background: `${accent}18`, color: accent, transition: "all 0.2s",
          }}>
            {orderType === "buy" ? `Place Buy Limit @ $${lp > 0 ? lp.toFixed(2) : "—"}` : `Place Sell Limit @ $${lp > 0 ? lp.toFixed(2) : "—"}`}
          </button>
        )}
      </div>

      {/* ── Pending limit orders for this symbol ── */}
      {pendingForSymbol.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
            Pending Orders · {selectedSymbol}
          </div>
          {pendingForSymbol.map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: "0.5px",
                    background: o.type === "buy" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                    color: o.type === "buy" ? "#34d399" : "#f87171",
                  }}>LIMIT {o.type.toUpperCase()}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{o.qty} shares</span>
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  {new Date(o.created_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: o.type === "buy" ? "#34d399" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                    ${o.limitPrice.toFixed(2)}
                  </div>
                  {quote && (
                    <div style={{ fontSize: 9, color: "#475569" }}>
                      mkt ${quote.price.toFixed(2)}
                    </div>
                  )}
                </div>
                <button onClick={() => cancelLimitOrder(o.id)} style={{
                  width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)",
                  background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "inherit",
                }} title="Cancel order">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Holdings ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Holdings</div>
        {positions.filter(p => p.shares > 0).length === 0 ? (
          <div style={{ fontSize: 12, textAlign: "center", padding: "12px 0", color: "#475569" }}>No positions yet</div>
        ) : positions.filter(p => p.shares > 0).map(p => {
          const q = quotes[p.symbol];
          const pnl = q ? (q.price - p.avg_cost) * p.shares : 0;
          return (
            <div key={p.symbol} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{p.symbol}</span>
                  <span style={{ fontSize: 11, marginLeft: 6, color: "#64748b" }}>{p.shares} shares</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${q ? (q.price * p.shares).toFixed(2) : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#64748b" }}>Avg ${p.avg_cost.toFixed(2)}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: pnl >= 0 ? "#34d399" : "#f87171" }}>
                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recent trades ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Recent Trades</div>
        {useAppStore.getState().trades.length === 0 ? (
          <div style={{ fontSize: 12, textAlign: "center", padding: "12px 0", color: "#475569" }}>No trades yet</div>
        ) : useAppStore.getState().trades.slice(0, 5).map((t, i) => (
          <div key={t.id ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800, background: t.type === "buy" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: t.type === "buy" ? "#34d399" : "#f87171" }}>{t.type.toUpperCase()}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{t.symbol}</span>
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>{new Date(t.created_at).toLocaleTimeString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{t.qty} shares</div>
              <div style={{ fontSize: 10, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>${Number(t.price).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: any; accent?: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: bold ? 13 : 11, fontWeight: bold ? 800 : 600, color: accent ?? "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}