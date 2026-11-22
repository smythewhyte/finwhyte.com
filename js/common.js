/**
 * common.js — shared across index.html and stock.html
 */

const WATCHLIST_KEY = "finwhyte_watchlist";

function getWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...CONFIG.DEFAULT_WATCHLIST];
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

function fmtPrice(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtChange(change, pct) {
  if (change === undefined || Number.isNaN(change)) return "—";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${fmtPrice(change)} (${sign}${fmtPrice(pct)}%)`;
}

function fmtTimeAgo(unixSeconds) {
  const diffMs = Date.now() - unixSeconds * 1000;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function directionClass(n) {
  return n > 0 ? "up" : n < 0 ? "down" : "muted";
}

function directionArrow(n) {
  return n > 0 ? "▲" : n < 0 ? "▼" : "•";
}

function goToStock(symbol) {
  window.location.href = `stock.html?symbol=${encodeURIComponent(symbol.toUpperCase())}`;
}

/** Renders the config banner if API keys haven't been set yet. */
function renderConfigBannerIfNeeded(containerId) {
  if (API.keysConfigured()) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="config-banner">
      <strong>Set up your API keys to go live.</strong><br>
      Open <code>js/config.js</code> and paste in a free Finnhub key and a free Twelve Data key.
      Get them at <code>finnhub.io/register</code> and <code>twelvedata.com/pricing</code> —
      both take under a minute and no card is required. See README.md for details.
    </div>`;
}

/** Populates the scrolling ticker tape in the header. */
async function initTickerTape() {
  const track = document.getElementById("tickerTrack");
  if (!track || !API.keysConfigured()) return;
  try {
    const quotes = await API.getQuotes(CONFIG.TICKER_TAPE_SYMBOLS);
    const items = quotes
      .map(
        (q) => `
        <span class="ticker-tape__item">
          <strong>${q.symbol}</strong>
          <span class="num">${fmtPrice(q.price)}</span>
          <span class="num ${directionClass(q.change)}">${directionArrow(q.change)} ${fmtPrice(q.changePercent)}%</span>
        </span>`
      )
      .join("");
    // duplicate content so the scroll loop has no visible seam
    track.innerHTML = items + items;
  } catch (e) {
    track.innerHTML = `<span class="ticker-tape__item muted">Ticker unavailable — check your API keys in js/config.js</span>`;
  }
}

/** Wires up the header search box with debounced Finnhub symbol search. */
function initHeaderSearch() {
  const input = document.getElementById("headerSearch");
  const results = document.getElementById("headerSearchResults");
  if (!input || !results) return;

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) {
      results.classList.remove("open");
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const matches = await API.searchSymbol(q);
        if (!matches.length) {
          results.innerHTML = `<div class="search-results__item muted">No matches</div>`;
        } else {
          results.innerHTML = matches
            .map(
              (m) => `
              <div class="search-results__item" data-symbol="${m.symbol}">
                <span class="sym">${m.symbol}</span>
                <span class="muted">${m.description}</span>
              </div>`
            )
            .join("");
        }
        results.classList.add("open");
      } catch (e) {
        results.innerHTML = `<div class="search-results__item muted">Search unavailable</div>`;
        results.classList.add("open");
      }
    }, 300);
  });

  results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-results__item");
    if (item && item.dataset.symbol) goToStock(item.dataset.symbol);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) goToStock(input.value.trim());
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) results.classList.remove("open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTickerTape();
  initHeaderSearch();
});
