# StockSim — Paper Trading Platform

A glassmorphism-styled paper trading simulator built with **Next.js 14**, **Supabase**, and **real-time Yahoo Finance data**.

![UI Preview](./docs/preview.png)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Style | Glassmorphism + DM Sans (Polymarket-inspired) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase OAuth (Google, GitHub) |
| State | Zustand |
| Charts | Recharts |
| Market Data | Yahoo Finance 2 (free, no API key needed) |
| Animations | Framer Motion |

## Features

- 🎯 **$25,000 virtual cash** to start trading
- 📈 **Real-time prices** — polls Yahoo Finance every 10 seconds
- 📊 **Interactive charts** — 1D / 1W / 1M / 3M / 1Y with area charts
- 💼 **Portfolio tracking** — P&L, holdings, average cost
- 🕐 **Trade history** — full trade log per user
- ⭐ **Watchlist** — save favorite symbols
- 🔐 **OAuth auth** — Google + GitHub via Supabase
- 🌊 **Glassmorphism UI** — dark, ambient, minimal

## Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd stocksim
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_init.sql` via the SQL editor
3. Enable **Google** and/or **GitHub** OAuth in Authentication → Providers
4. Set the redirect URL to: `http://localhost:3000/auth/callback`

### 3. Configure environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 4. Run
```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── quotes/route.ts      # Live stock prices from Yahoo Finance
│   │   ├── chart/route.ts       # Historical OHLC chart data
│   │   └── trade/route.ts       # Buy/sell execution
│   ├── auth/callback/route.ts   # OAuth callback
│   ├── dashboard/page.tsx       # Main trading dashboard
│   ├── login/page.tsx           # Login page
│   └── globals.css              # Glassmorphism CSS utilities
├── components/
│   ├── charts/StockChart.tsx    # Recharts area chart
│   ├── layout/
│   │   ├── Navbar.tsx           # Live ticker + user info
│   │   ├── Sidebar.tsx          # Nav + cash balance
│   │   └── DashboardClient.tsx  # Client shell
│   ├── trading/
│   │   ├── MarketPanel.tsx      # Stock list + chart
│   │   └── OrderPanel.tsx       # Buy/sell + holdings
│   └── ui/Toast.tsx             # Notifications
├── hooks/useLiveQuotes.ts       # SWR polling hook
└── lib/
    ├── store.ts                 # Zustand global state
    └── supabase/{client,server}.ts
supabase/
└── migrations/001_init.sql      # DB schema + RLS
```

## Extending

- **Add more symbols**: edit `DEFAULT_SYMBOLS_LIST` in `src/lib/store.ts`
- **Add fractional shares**: change qty input to accept decimals
- **Add leaderboard**: create a `leaderboard` view in Supabase aggregating total portfolio value
- **Add stock search**: use Yahoo Finance's `search()` method in a new API route
- **Add alerts**: Supabase Realtime + price triggers

## Data Source

Uses `yahoo-finance2` npm package — free, no API key required. Rate-limited to avoid throttling (15s cache on quotes, 60s on chart data).

> **Disclaimer**: This is a paper trading simulator for educational purposes only. Not financial advice.
