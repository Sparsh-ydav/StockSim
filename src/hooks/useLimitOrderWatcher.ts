"use client";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export function useLimitOrderWatcher() {
    const store = useAppStore;
    const processingRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const CHECK_INTERVAL = 5_000; // check every 5s

        const check = async () => {
            const {
                quotes, limitOrders, fillLimitOrder, cancelLimitOrder,
                cashBalance, setCashBalance, positions, setPositions, addTrade,
                addNotification,
            } = store.getState();

            const pending = limitOrders.filter(o => o.status === "pending");
            if (pending.length === 0) return;

            for (const order of pending) {
                if (processingRef.current.has(order.id)) continue;

                const quote = quotes[order.symbol];
                if (!quote) continue;

                const shouldFill =
                    (order.type === "buy" && quote.price <= order.limitPrice) ||
                    (order.type === "sell" && quote.price >= order.limitPrice);

                if (!shouldFill) continue;

                processingRef.current.add(order.id);

                try {
                    // Execute the trade via API
                    const res = await fetch("/api/trade", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            symbol: order.symbol,
                            qty: order.qty,
                            price: quote.price,
                            type: order.type,
                        }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        // Can't fill — cancel the order
                        cancelLimitOrder(order.id);
                        addNotification({
                            type: "error",
                            title: "Limit Order Failed",
                            message: `${order.type === "buy" ? "Buy" : "Sell"} limit for ${order.qty} ${order.symbol} @ $${order.limitPrice.toFixed(2)} could not be filled: ${data.error ?? "insufficient funds"}`,
                        });
                        processingRef.current.delete(order.id);
                        continue;
                    }

                    // Update store optimistically
                    const total = order.qty * quote.price;
                    const currentPositions = store.getState().positions;
                    const currentCash = store.getState().cashBalance;
                    const existingPos = currentPositions.find(p => p.symbol === order.symbol);

                    if (order.type === "buy") {
                        setCashBalance(currentCash - total);
                        setPositions(
                            existingPos
                                ? currentPositions.map(p =>
                                    p.symbol === order.symbol
                                        ? { ...p, shares: p.shares + order.qty, avg_cost: (p.avg_cost * p.shares + total) / (p.shares + order.qty) }
                                        : p
                                )
                                : [...currentPositions, { id: crypto.randomUUID(), symbol: order.symbol, shares: order.qty, avg_cost: quote.price }]
                        );
                    } else {
                        setCashBalance(currentCash + total);
                        setPositions(
                            currentPositions
                                .map(p => p.symbol === order.symbol ? { ...p, shares: p.shares - order.qty } : p)
                                .filter(p => p.shares > 0)
                        );
                    }

                    if (data.trade) addTrade(data.trade);

                    fillLimitOrder(order.id, quote.price);

                    const msg = order.type === "buy"
                        ? `Bought ${order.qty} ${order.symbol} @ $${quote.price.toFixed(2)} (limit was $${order.limitPrice.toFixed(2)})`
                        : `Sold ${order.qty} ${order.symbol} @ $${quote.price.toFixed(2)} (limit was $${order.limitPrice.toFixed(2)})`;

                    addNotification({
                        type: "success",
                        title: `🎯 Limit Order Filled!`,
                        message: msg,
                    });

                    // Browser push notification if permitted
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                        new Notification(`Limit Order Filled — ${order.symbol}`, { body: msg, icon: "/favicon.ico" });
                    }

                } catch (err) {
                    console.error("Limit order fill error:", err);
                    processingRef.current.delete(order.id);
                }
            }
        };

        const id = setInterval(check, CHECK_INTERVAL);
        check(); // run immediately on mount
        return () => clearInterval(id);
    }, []);
}