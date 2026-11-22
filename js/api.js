/**
 * api.js
 * -----------------------------------------------------------------------
 * Thin wrappers around the two data providers, plus a tiny in-memory
 * cache so navigating around the site doesn't burn through the free-tier
 * rate limits. Nothing here needs a build step or a bundler — it's all
 * plain fetch().
 * -----------------------------------------------------------------------
 */

const API = (() => {
  const cache = new Map();
  const CACHE_TTL_MS = 30 * 1000; // 30s — enough to stop duplicate calls on page load

  async function cachedFetch(url) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Request failed (${res.status}) for ${url.split("?")[0]}`);
    }
    const data = await res.json();
    cache.set(url, { data, time: Date.now() });
    return data;
  }

  function keysConfigured() {
    return (
      CONFIG.FINNHUB_API_KEY &&
      CONFIG.FINNHUB_API_KEY !== "YOUR_FINNHUB_API_KEY_HERE" &&
      CONFIG.TWELVEDATA_API_KEY &&
      CONFIG.TWELVEDATA_API_KEY !== "YOUR_TWELVEDATA_API_KEY_HERE"
    );
  }

  // ---- Finnhub: quotes -------------------------------------------------
  async function getQuote(symbol) {
    const url = `${CONFIG.FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${CONFIG.FINNHUB_API_KEY}`;
    const q = await cachedFetch(url);
    // Finnhub returns all zeros for an unknown symbol instead of an error
    if (q.c === 0 && q.pc === 0) throw new Error(`No quote data for "${symbol}"`);
    return {
      symbol,
      price: q.c,
      change: q.d,
      changePercent: q.dp,
      high: q.h,
      low: q.l,
      open: q.o,
      prevClose: q.pc,
      timestamp: q.t,
    };
  }

  async function getQuotes(symbols) {
    // Finnhub free tier has no batch quote endpoint — fetch in parallel.
    const settled = await Promise.allSettled(symbols.map(getQuote));
    return settled
      .map((r, i) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);
  }

  // ---- Finnhub: company profile (name, industry, market cap) ----------
  async function getCompanyProfile(symbol) {
    const url = `${CONFIG.FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${CONFIG.FINNHUB_API_KEY}`;
    return cachedFetch(url);
  }

  // ---- Finnhub: symbol search ------------------------------------------
  async function searchSymbol(query) {
    const url = `${CONFIG.FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${CONFIG.FINNHUB_API_KEY}`;
    const data = await cachedFetch(url);
    return (data.result || []).filter((r) => r.type === "Common Stock").slice(0, 8);
  }

  // ---- Finnhub: news -----------------------------------------------------
  async function getMarketNews(category = "general") {
    const url = `${CONFIG.FINNHUB_BASE_URL}/news?category=${category}&token=${CONFIG.FINNHUB_API_KEY}`;
    const data = await cachedFetch(url);
    return data.slice(0, 75);
  }

  async function getCompanyNews(symbol, days = 14) {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().split("T")[0];
    const url = `${CONFIG.FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${CONFIG.FINNHUB_API_KEY}`;
    const data = await cachedFetch(url);
    return data.slice(0, 15);
  }

  // ---- Twelve Data: historical candles for charts ----------------------
  async function getCandles(symbol, range) {
    const url =
      `${CONFIG.TWELVEDATA_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}` +
      `&interval=${range.interval}&outputsize=${range.outputsize}&order=ASC&apikey=${CONFIG.TWELVEDATA_API_KEY}`;
    const data = await cachedFetch(url);
    if (data.status === "error") throw new Error(data.message || "Chart data unavailable");
    const values = data.values || [];
    return values.map((v) => ({
      time: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }));
  }

  return {
    keysConfigured,
    getQuote,
    getQuotes,
    getCompanyProfile,
    searchSymbol,
    getMarketNews,
    getCompanyNews,
    getCandles,
  };
})();
