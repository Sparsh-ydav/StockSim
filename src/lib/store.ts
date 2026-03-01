import { create } from "zustand";

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  marketCap: number;
  sparkline?: number[];
};

export type Position = {
  id: string;
  symbol: string;
  shares: number;
  avg_cost: number;
};

export type Trade = {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  qty: number;
  price: number;
  total: number;
  created_at: string;
};

export type LimitOrder = {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  qty: number;
  limitPrice: number;
  status: "pending" | "filled" | "cancelled";
  created_at: string;
  filled_at?: string;
  filled_price?: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  timestamp: string;
  read: boolean;
};

type AppStore = {
  // Quotes
  quotes: Record<string, StockQuote>;
  setQuotes: (quotes: StockQuote[]) => void;
  updateQuote: (quote: StockQuote) => void;

  // Selected stock
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;

  // Account
  cashBalance: number;
  setCashBalance: (balance: number) => void;

  // Positions
  positions: Position[];
  setPositions: (positions: Position[]) => void;

  // Trades
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;

  // Limit orders
  limitOrders: LimitOrder[];
  addLimitOrder: (order: LimitOrder) => void;
  fillLimitOrder: (id: string, filledPrice: number) => void;
  cancelLimitOrder: (id: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearNotifications: () => void;

  // Watchlist
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;

  // UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chartRange: string;
  setChartRange: (range: string) => void;
};

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "AMD", "INTC", "QCOM", "MU", "JPM", "BAC", "GS", "MS", "WFC", "V", "MA", "AXP", "LLY", "UNH", "JNJ", "ABBV", "MRK", "PFE", "WMT", "COST", "HD", "NKE", "MCD", "SBUX", "XOM", "CVX", "COP", "SPY", "QQQ", "IWM", "GLD", "NFLX", "CRM", "ORCL", "ADBE", "NOW", "UBER", "ABNB", "SHOP", "COIN", "PLTR", "RBLX", "SNAP", "SPOT", "DASH", "BRK-B", "BX", "TMO", "TGT"];

export const useAppStore = create<AppStore>((set, get) => ({
  quotes: {},
  setQuotes: (quotes) =>
    set((s) => ({
      quotes: quotes.reduce((acc, q) => {
        acc[q.symbol] = {
          ...q,
          sparkline: s.quotes[q.symbol]?.sparkline
            ? [...(s.quotes[q.symbol].sparkline!.slice(-47)), q.price]
            : [q.price],
        };
        return acc;
      }, {} as Record<string, StockQuote>),
    })),
  updateQuote: (quote) =>
    set((s) => ({
      quotes: {
        ...s.quotes,
        [quote.symbol]: {
          ...quote,
          sparkline: s.quotes[quote.symbol]?.sparkline
            ? [...(s.quotes[quote.symbol].sparkline!.slice(-47)), quote.price]
            : [quote.price],
        },
      },
    })),

  selectedSymbol: "AAPL",
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  cashBalance: 25000,
  setCashBalance: (cashBalance) => set({ cashBalance }),

  positions: [],
  setPositions: (positions) => set({ positions }),

  trades: [],
  setTrades: (trades) => set({ trades }),
  addTrade: (trade) => set((s) => ({ trades: [trade, ...s.trades] })),

  // ── Limit orders ──────────────────────────────────────────
  limitOrders: [],
  addLimitOrder: (order) => set((s) => ({ limitOrders: [order, ...s.limitOrders] })),
  fillLimitOrder: (id, filledPrice) =>
    set((s) => ({
      limitOrders: s.limitOrders.map((o) =>
        o.id === id
          ? { ...o, status: "filled" as const, filled_at: new Date().toISOString(), filled_price: filledPrice }
          : o
      ),
    })),
  cancelLimitOrder: (id) =>
    set((s) => ({
      limitOrders: s.limitOrders.map((o) =>
        o.id === id ? { ...o, status: "cancelled" as const } : o
      ),
    })),

  // ── Notifications ─────────────────────────────────────────
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...s.notifications,
      ].slice(0, 50), // keep last 50
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  clearNotifications: () => set({ notifications: [] }),

  watchlist: ["AAPL", "NVDA", "TSLA"],
  toggleWatchlist: (symbol) =>
    set((s) => ({
      watchlist: s.watchlist.includes(symbol)
        ? s.watchlist.filter((x) => x !== symbol)
        : [...s.watchlist, symbol],
    })),

  activeTab: "market",
  setActiveTab: (activeTab) => set({ activeTab }),

  chartRange: "1D",
  setChartRange: (chartRange) => set({ chartRange }),
}));

export const DEFAULT_SYMBOLS_LIST = DEFAULT_SYMBOLS;