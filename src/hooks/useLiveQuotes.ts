"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAppStore, DEFAULT_SYMBOLS_LIST } from "@/lib/store";

export function useLiveQuotes(symbols: string[] = DEFAULT_SYMBOLS_LIST, intervalMs = 30_000) {
  const { setQuotes } = useAppStore();
  const isFetching = useRef(false);

  const fetchQuotes = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/quotes?symbols=${symbols.join(",")}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data)) setQuotes(data);
    } catch (err) {
      console.error("Quote fetch error:", err);
    } finally {
      isFetching.current = false;
    }
  }, [symbols.join(",")]);

  useEffect(() => {
    fetchQuotes();
    const id = setInterval(fetchQuotes, intervalMs);
    return () => clearInterval(id);
  }, [fetchQuotes, intervalMs]);
}

export function useChartData(symbol: string, range: string) {
  const cacheRef = useRef<Record<string, any[]>>({});

  const fetchChart = useCallback(async (): Promise<any[]> => {
    const key = `${symbol}-${range}`;
    if (cacheRef.current[key]) return cacheRef.current[key];
    try {
      const res = await fetch(`/api/chart?symbol=${symbol}&range=${range}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cacheRef.current[key] = data;
      }
      return data;
    } catch {
      return [];
    }
  }, [symbol, range]);

  return { fetchChart };
}