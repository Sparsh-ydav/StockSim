-- ============================================================
-- StockSim Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- Accounts: one per user, holds virtual cash balance
-- ============================================================
create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  cash_balance numeric(14, 2) not null default 25000.00,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create account when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.accounts (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Positions: current holdings
-- ============================================================
create table if not exists public.positions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  symbol      text not null,
  shares      numeric(12, 6) not null default 0,
  avg_cost    numeric(14, 4) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, symbol)
);

-- ============================================================
-- Trades: immutable trade history
-- ============================================================
create table if not exists public.trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  symbol      text not null,
  type        text not null check (type in ('buy', 'sell')),
  qty         numeric(12, 6) not null,
  price       numeric(14, 4) not null,
  total       numeric(14, 2) not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Watchlists
-- ============================================================
create table if not exists public.watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  symbol      text not null,
  created_at  timestamptz not null default now(),
  unique(user_id, symbol)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.accounts enable row level security;
alter table public.positions enable row level security;
alter table public.trades enable row level security;
alter table public.watchlists enable row level security;

-- Accounts: users see only their own
create policy "accounts_own" on public.accounts
  for all using (auth.uid() = user_id);

-- Positions: users see only their own
create policy "positions_own" on public.positions
  for all using (auth.uid() = user_id);

-- Trades: users see only their own
create policy "trades_own" on public.trades
  for all using (auth.uid() = user_id);

-- Watchlists: users see only their own
create policy "watchlists_own" on public.watchlists
  for all using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_positions_user on public.positions(user_id);
create index if not exists idx_trades_user on public.trades(user_id);
create index if not exists idx_trades_created on public.trades(created_at desc);
create index if not exists idx_watchlists_user on public.watchlists(user_id);
