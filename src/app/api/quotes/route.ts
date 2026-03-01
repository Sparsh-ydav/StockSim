import { NextRequest, NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY!;
const cache = new Map<string, { data: any; expires: number }>();

// Fetch a single symbol with retries
async function fetchQuote(symbol: string) {
  const [quoteRes, profileRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
  ]);
  const quote = await quoteRes.json();
  const profile = await profileRes.json();
  if (!quote.c || quote.c === 0) return null;
  return {
    symbol,
    name: profile.name ?? symbol,
    price: quote.c,
    change: quote.d ?? 0,
    changePct: quote.dp ?? 0,
    volume: quote.v ?? 0,
    open: quote.o ?? 0,
    high: quote.h ?? 0,
    low: quote.l ?? 0,
    prevClose: quote.pc ?? 0,
    marketCap: profile.marketCapitalization ?? 0,
  };
}

// Batch symbols with concurrency limit to avoid rate limiting
async function fetchBatch(symbols: string[], concurrency = 5) {
  const results: any[] = [];
  for (let i = 0; i < symbols.length; i += concurrency) {
    const chunk = symbols.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(s => fetchQuote(s).catch(() => null)));
    results.push(...chunkResults);
    // Small delay between batches to respect rate limits
    if (i + concurrency < symbols.length) {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return results.filter(Boolean);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];

  if (!symbols.length)
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });

  const cacheKey = [...symbols].sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now())
    return NextResponse.json(cached.data);

  try {
    const result = await fetchBatch(symbols, 8);
    cache.set(cacheKey, { data: result, expires: Date.now() + 20_000 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}