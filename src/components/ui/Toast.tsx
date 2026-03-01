"use client";

export default function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold whitespace-nowrap"
      style={{
        background: ok ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
        border: `1px solid ${ok ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
        backdropFilter: "blur(20px)",
        color: ok ? "#34d399" : "#f87171",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "fadeUp 0.3s ease",
      }}
    >
      {msg}
    </div>
  );
}
