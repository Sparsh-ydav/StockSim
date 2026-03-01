"use client";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function NotificationBell() {
    const { notifications, markAllRead, clearNotifications } = useAppStore();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const unread = notifications.filter(n => !n.read).length;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const iconColor: Record<string, string> = {
        success: "#34d399",
        error: "#f87171",
        info: "#38bdf8",
    };

    const iconShape: Record<string, string> = {
        success: "✓",
        error: "✕",
        info: "ℹ",
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
                style={{
                    position: "relative", width: 34, height: 34, borderRadius: 10,
                    background: open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.15s", color: "#94a3b8",
                }}
                title="Notifications"
            >
                {/* Bell icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {/* Badge */}
                {unread > 0 && (
                    <div style={{
                        position: "absolute", top: -4, right: -4,
                        width: 17, height: 17, borderRadius: "50%",
                        background: "#f87171", border: "2px solid #0a0e1a",
                        fontSize: 9, fontWeight: 800, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'DM Sans',sans-serif",
                        animation: "pulseDot 2s ease-in-out infinite",
                    }}>
                        {unread > 9 ? "9+" : unread}
                    </div>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    width: 320, maxHeight: 420, overflowY: "auto",
                    background: "rgba(10,14,26,0.98)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    backdropFilter: "blur(24px)",
                    zIndex: 200,
                    fontFamily: "'DM Sans',sans-serif",
                }}>
                    {/* Header */}
                    <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Notifications</span>
                        {notifications.length > 0 && (
                            <button onClick={clearNotifications} style={{ fontSize: 10, fontWeight: 600, color: "#475569", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Items */}
                    {notifications.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                            No notifications yet
                        </div>
                    ) : notifications.map((n, i) => (
                        <div key={n.id} style={{
                            padding: "12px 16px",
                            borderBottom: i < notifications.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                            background: n.read ? "transparent" : "rgba(255,255,255,0.02)",
                            display: "flex", gap: 10, alignItems: "flex-start",
                        }}>
                            {/* Icon dot */}
                            <div style={{
                                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                background: `${iconColor[n.type]}20`,
                                border: `1px solid ${iconColor[n.type]}40`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 900, color: iconColor[n.type],
                                marginTop: 1,
                            }}>
                                {iconShape[n.type]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>{n.title}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4, wordBreak: "break-word" }}>{n.message}</div>
                                <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                                    {new Date(n.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                            {!n.read && (
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", flexShrink: 0, marginTop: 6 }} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}