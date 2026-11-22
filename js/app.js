/**
 * app.js — homepage (index.html) logic
 */

async function renderMarketStrip() {
  const el = document.getElementById("marketStrip");
  if (!API.keysConfigured()) {
    el.innerHTML = `<div class="state-msg">Add your API keys in js/config.js to load live market data.</div>`;
    return;
  }
  try {
    const quotes = await API.getQuotes(CONFIG.MARKET_INDICES.map((i) => i.symbol));
    const bySymbol = Object.fromEntries(quotes.map((q) => [q.symbol, q]));
    el.innerHTML = CONFIG.MARKET_INDICES.map((idx) => {
      const q = bySymbol[idx.symbol];
      if (!q) {
        return `<div class="market-card"><div class="market-card__label">${idx.label}</div><div class="state-msg">unavailable</div></div>`;
      }
      return `
        <div class="market-card">
          <div class="market-card__label">${idx.label}</div>
          <div class="market-card__price num">${fmtPrice(q.price)}</div>
          <div class="market-card__change num ${directionClass(q.change)}">${directionArrow(q.change)} ${fmtChange(q.change, q.changePercent)}</div>
        </div>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<div class="state-msg error">Couldn't load market data: ${e.message}</div>`;
  }
}

async function renderWatchlist() {
  const body = document.getElementById("watchlistBody");
  const list = getWatchlist();

  if (!API.keysConfigured()) {
    body.innerHTML = `<tr><td colspan="4" class="state-msg">Add your API keys in js/config.js to load quotes.</td></tr>`;
    return;
  }
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="4" class="state-msg">Your watchlist is empty. Add a symbol below.</td></tr>`;
    return;
  }

  body.innerHTML = `<tr><td colspan="4" class="state-msg">Loading quotes…</td></tr>`;
  const quotes = await API.getQuotes(list);
  const bySymbol = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  body.innerHTML = list
    .map((symbol) => {
      const q = bySymbol[symbol];
      if (!q) {
        return `
          <tr>
            <td><span class="sym num">${symbol}</span></td>
            <td colspan="2" class="state-msg" style="padding:10px 0;">no data</td>
            <td><button class="watchlist-remove" data-symbol="${symbol}" title="Remove">×</button></td>
          </tr>`;
      }
      return `
        <tr class="clickable" data-symbol="${symbol}">
          <td><span class="sym num">${symbol}</span></td>
          <td class="num">${fmtPrice(q.price)}</td>
          <td class="num ${directionClass(q.change)}">${directionArrow(q.change)} ${fmtPrice(q.changePercent)}%</td>
          <td><button class="watchlist-remove" data-symbol="${symbol}" title="Remove">×</button></td>
        </tr>`;
    })
    .join("");

  body.querySelectorAll("tr.clickable").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".watchlist-remove")) return;
      goToStock(row.dataset.symbol);
    });
  });
  body.querySelectorAll(".watchlist-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = getWatchlist().filter((s) => s !== btn.dataset.symbol);
      saveWatchlist(updated);
      renderWatchlist();
    });
  });
}

function initAddSymbol() {
  const input = document.getElementById("addSymbolInput");
  const btn = document.getElementById("addSymbolBtn");

  const add = () => {
    const symbol = input.value.trim().toUpperCase();
    if (!symbol) return;
    const list = getWatchlist();
    if (!list.includes(symbol)) {
      list.push(symbol);
      saveWatchlist(list);
      renderWatchlist();
    }
    input.value = "";
  };

  btn.addEventListener("click", add);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") add();
  });
}

let currentNewsCategory = "general";
let currentNewsSort = "newest";
let currentNewsItems = [];

async function renderNews() {
  const el = document.getElementById("newsList");
  if (!API.keysConfigured()) {
    el.innerHTML = `<div class="state-msg">Add your API keys in js/config.js to load news.</div>`;
    return;
  }
  el.innerHTML = `<div class="state-msg">Loading news…</div>`;
  try {
    currentNewsItems = await API.getMarketNews(currentNewsCategory);
    renderNewsList();
  } catch (e) {
    el.innerHTML = `<div class="state-msg error">Couldn't load news: ${e.message}</div>`;
  }
}

function renderNewsList() {
  const el = document.getElementById("newsList");
  if (!currentNewsItems.length) {
    el.innerHTML = `<div class="state-msg">No news available right now.</div>`;
    return;
  }

  if (currentNewsSort === "source") {
    el.innerHTML = renderGroupedBySource(currentNewsItems);
    return;
  }

  const sorted = [...currentNewsItems].sort((a, b) =>
    currentNewsSort === "oldest" ? a.datetime - b.datetime : b.datetime - a.datetime
  );
  el.innerHTML = sorted.map(newsItemHtml).join("");
}

function renderGroupedBySource(items) {
  const groups = {};
  items.forEach((n) => {
    const src = n.source || "Other";
    if (!groups[src]) groups[src] = [];
    groups[src].push(n);
  });
  const sourceNames = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  return sourceNames
    .map((src) => {
      const items = groups[src].sort((a, b) => b.datetime - a.datetime);
      return `
        <div class="news-group-header">${escapeHtml(src)} · ${items.length}</div>
        ${items.map(newsItemHtml).join("")}`;
    })
    .join("");
}

function newsItemHtml(n) {
  return `
    <a class="news-item" href="${n.url}" target="_blank" rel="noopener noreferrer">
      <div class="news-item__meta">${n.source || "News"} · ${fmtTimeAgo(n.datetime)}</div>
      <div class="news-item__headline">${escapeHtml(n.headline)}</div>
    </a>`;
}

function initNewsControls() {
  const tabs = document.getElementById("newsCategoryTabs");
  const sortSelect = document.getElementById("newsSortSelect");

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    tabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentNewsCategory = btn.dataset.category;
    renderNews();
  });

  sortSelect.addEventListener("change", () => {
    currentNewsSort = sortSelect.value;
    renderNewsList();
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  renderConfigBannerIfNeeded("configBanner");
  renderMarketStrip();
  renderWatchlist();
  renderNews();
  initAddSymbol();
  initNewsControls();
});
