/**
 * config.js
 * -----------------------------------------------------------------------
 * This site uses TWO free data providers, because each is strongest at a
 * different job:
 *
 *   FINNHUB     -> live quotes, company news, market news, symbol search
 *                  Get a free key (30 sec, no card): https://finnhub.io/register
 *
 *   TWELVE DATA -> historical price candles, i.e. the chart data
 *                  (Finnhub retired free historical candles in 2025, so
 *                  Twelve Data fills that gap — its free tier still
 *                  includes time_series for US stocks.)
 *                  Get a free key: https://twelvedata.com/pricing
 *
 * Paste both keys below. Everything else works out of the box.
 *
 * NOTE ON SECURITY: this is a static, client-side site, so these keys are
 * visible to anyone who views your page source. That's fine for personal/
 * hobby use on the free tiers (rate limits apply per key, not per user),
 * but do not paste a paid-plan key here. See README.md -> "Hiding your
 * API keys" if you want to lock this down for real production use.
 * -----------------------------------------------------------------------
 */

const CONFIG = {
  FINNHUB_API_KEY: "d9vokb9r01qgk75pbh1gd9vokb9r01qgk75pbh20",
  FINNHUB_BASE_URL: "https://finnhub.io/api/v1",

  TWELVEDATA_API_KEY: "d835879b02cd4bba8f497af377496870",
  TWELVEDATA_BASE_URL: "https://api.twelvedata.com",

  // Market-strip symbols on the homepage. Finnhub's free tier doesn't
  // cover raw index tickers (^GSPC etc.), so we track the equivalent
  // highly-liquid ETFs instead — same movement, works on free keys.
  MARKET_INDICES: [
    { symbol: "SPY", label: "S&P 500 (SPY)" },
    { symbol: "DIA", label: "DOW (DIA)" },
    { symbol: "QQQ", label: "NASDAQ 100 (QQQ)" },
    { symbol: "IWM", label: "RUSSELL 2000 (IWM)" },
  ],

  // Default watchlist shown on first visit (user can edit; saved to localStorage after)
  DEFAULT_WATCHLIST: ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL"],

  // Symbols that scroll in the header ticker tape
  TICKER_TAPE_SYMBOLS: [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "JPM", "V",
  ],

  // Chart time ranges: [label, Twelve Data interval, output size in bars]
  CHART_RANGES: [
    { label: "1D", interval: "5min", outputsize: 78 },
    { label: "5D", interval: "30min", outputsize: 65 },
    { label: "1M", interval: "1day", outputsize: 22 },
    { label: "6M", interval: "1day", outputsize: 130 },
    { label: "1Y", interval: "1week", outputsize: 52 },
    { label: "5Y", interval: "1week", outputsize: 260 },
  ],
};
