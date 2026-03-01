import { NextRequest, NextResponse } from "next/server";

// Yahoo Finance public query API — free, no key required
const CONFIGS: Record<string, { interval: string; range: string; ttl: number }> = {
  "1D": { interval: "5m", range: "1d", ttl: 60_000 },
  "1W": { interval: "30m", range: "5d", ttl: 3 * 60_000 },
  "1M": { interval: "1d", range: "1mo", ttl: 10 * 60_000 },
  "3M": { interval: "1d", range: "3mo", ttl: 10 * 60_000 },
  "1Y": { interval: "1wk", range: "1y", ttl: 30 * 60_000 },
};

const cache = new Map<string, { data: any[]; expires: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const range = searchParams.get("range") ?? "1D";

  if (!symbol) return NextResponse.json([]);

  const cfg = CONFIGS[range] ?? CONFIGS["1D"];
  const cacheKey = `${symbol}__${range}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return NextResponse.json(hit.data);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: {
        // Yahoo occasionally blocks requests without a user-agent
        "User-Agent": "Mozilla/5.0 (compatible; StockSim/1.0)",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[chart] Yahoo ${symbol} ${range} → HTTP ${res.status}`);
      return NextResponse.json([]);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return NextResponse.json([]);

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const closes: number[] = quote.close ?? [];
    const opens: number[] = quote.open ?? [];
    const highs: number[] = quote.high ?? [];
    const lows: number[] = quote.low ?? [];
    const volumes: number[] = quote.volume ?? [];

    const data = timestamps
      .map((ts, i) => ({
        time: ts * 1000,
        open: opens[i] != null ? parseFloat(opens[i].toFixed(4)) : null,
        high: highs[i] != null ? parseFloat(highs[i].toFixed(4)) : null,
        low: lows[i] != null ? parseFloat(lows[i].toFixed(4)) : null,
        close: closes[i] != null ? parseFloat(closes[i].toFixed(4)) : null,
        volume: volumes[i] ?? 0,
      }))
      .filter(d => d.close != null && d.open != null);

    console.log(`[chart] Yahoo ${symbol} ${range} → ${data.length} points, first=${new Date(data[0]?.time).toISOString()}, last=${new Date(data[data.length - 1]?.time).toISOString()}`);

    cache.set(cacheKey, { data, expires: Date.now() + cfg.ttl });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[chart] error:", err);
    return NextResponse.json([]);
  }
}