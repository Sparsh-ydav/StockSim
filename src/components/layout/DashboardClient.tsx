"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { useLimitOrderWatcher } from "@/hooks/useLimitOrderWatcher";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MarketPanel from "@/components/trading/MarketPanel";
import SearchPanel from "@/components/trading/SearchPanel";
import PortfolioPanel from "@/components/trading/PortfolioPanel";
import HistoryPanel from "@/components/trading/HistoryPanel";
import WatchlistPanel from "@/components/trading/WatchlistPanel";
import OrderPanel from "@/components/trading/OrderPanel";
import Toast from "@/components/ui/Toast";

type Props = {
  user: { id: string; email: string; name: string; avatar?: string };
  account: { cash_balance: number };
  initialPositions: any[];
  initialTrades: any[];
};

export default function DashboardClient({ user, account, initialPositions, initialTrades }: Props) {
  const { setCashBalance, setPositions, setTrades, activeTab } = useAppStore();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setCashBalance(account.cash_balance);
    setPositions(initialPositions);
    setTrades(initialTrades);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useLiveQuotes();
  useLimitOrderWatcher();

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const centerPanel: Record<string, React.ReactNode> = {
    market: <MarketPanel />,
    search: <SearchPanel />,
    portfolio: <PortfolioPanel />,
    history: <HistoryPanel />,
    watchlist: <WatchlistPanel />,
  };

  // Show order panel on market, search and watchlist tabs
  const showOrderPanel = ["market", "search", "watchlist"].includes(activeTab);

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <div className="p-4 mx-auto max-w-screen-xl" style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: showOrderPanel ? "220px 1fr 280px" : "220px 1fr",
      }}>
        <Sidebar />
        {centerPanel[activeTab] ?? <MarketPanel />}
        {showOrderPanel && <OrderPanel onToast={showToast} />}
      </div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}