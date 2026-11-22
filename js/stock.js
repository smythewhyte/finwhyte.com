/**
 * stock.js — stock detail page (stock.html) logic
 */

const params = new URLSearchParams(window.location.search);
const SYMBOL = (params.get("symbol") || "AAPL").toUpperCase();

let chartInstance = null;
let activeRangeIndex = 2; // default to 1M

function isInWatchlist(symbol) {
  return getWatchlist().includes(symbol);
}

function updateWatchlistButton() {
  const btn = document.getElementById("watchlistToggle");
  const inList = isInWatchlist(SYMBOL);
  btn.textContent = inList ? "✓ In Watchlist" : "+ Watchlist";
  btn.style.borderColor = inList ? "var(--amber)" : "var(--border)";
  btn.style.color = inList ? "var(--amber)" : "var(--text-muted)";
}

function initWatchlistToggle() {
  document.getElementById("watchlistToggle").addEventListener("click", () => {
    const list = getWatchlist();
    const idx = list.indexOf(SYMBOL);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(SYMBOL);
    saveWatchlist(list);
    updateWatchlistButton();
  });
}

async function renderHeader() {
  document.getElementById("symbolLabel").textContent = SYMBOL;
  document.title = `${SYMBOL} — Finwhyte`;
  if (!API.keysConfigured()) {
    document.getElementById("statsGrid").innerHTML = `<div class="state-msg">Add your API keys in js/config.js to load stats.</div>`;
    return;
  }

  try {
    const [quote, profile] = await Promise.all([
      API.getQuote(SYMBOL),
      API.getCompanyProfile(SYMBOL).catch(() => null),
    ]);
    document.getElementById("companyName").textContent = profile?.name || SYMBOL;
    document.getElementById("priceValue").textContent = fmtPrice(quote.price);
    const deltaEl = document.getElementById("priceDelta");
    deltaEl.textContent = `${directionArrow(quote.change)} ${fmtChange(quote.change, quote.changePercent)}`;
    deltaEl.className = `delta num ${directionClass(quote.change)}`;

    renderStats(quote, profile);
  } catch (e) {
    document.getElementById("companyName").textContent = "Unable to load";
    document.getElementById("priceValue").textContent = "—";
  }
}

function renderStats(quote, profile) {
  const grid = document.getElementById("statsGrid");
  const rows = [
    ["Open", fmtPrice(quote.open)],
    ["Prev Close", fmtPrice(quote.prevClose)],
    ["Day High", fmtPrice(quote.high)],
    ["Day Low", fmtPrice(quote.low)],
    ["Industry", profile?.finnhubIndustry || "—"],
    ["Market Cap", profile?.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B` : "—"],
    ["Exchange", profile?.exchange || "—"],
    ["Shares Out", profile?.shareOutstanding ? `${profile.shareOutstanding.toFixed(0)}M` : "—"],
  ];
  grid.innerHTML = rows
    .map(([label, value]) => `<div class="stat-row"><span class="label">${label}</span><span class="value">${value}</span></div>`)
    .join("");
}

function initRangeTabs() {
  const wrap = document.getElementById("rangeTabs");
  wrap.innerHTML = CONFIG.CHART_RANGES.map((r, i) => `<button data-i="${i}" class="${i === activeRangeIndex ? "active" : ""}">${r.label}</button>`).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    activeRangeIndex = parseInt(btn.dataset.i, 10);
    wrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderChart();
  });
}

async function renderChart() {
  const canvas = document.getElementById("priceChart");
  if (!API.keysConfigured()) {
    canvas.parentElement.innerHTML = `<div class="state-msg">Add your API keys in js/config.js to load the chart.</div>`;
    return;
  }

  const range = CONFIG.CHART_RANGES[activeRangeIndex];
  try {
    const candles = await API.getCandles(SYMBOL, range);
    if (!candles.length) throw new Error("no data returned");

    const labels = candles.map((c) => c.time);
    const closes = candles.map((c) => c.close);
    const trendUp = closes[closes.length - 1] >= closes[0];
    const lineColor = trendUp ? "#34d07f" : "#ff5c5c";

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: closes,
            borderColor: lineColor,
            backgroundColor: trendUp ? "rgba(52,208,127,0.08)" : "rgba(255,92,92,0.08)",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1b212a",
            borderColor: "#232a34",
            borderWidth: 1,
            titleColor: "#8a93a3",
            bodyColor: "#e7eaef",
            bodyFont: { family: "IBM Plex Mono" },
            callbacks: { label: (ctx) => `$${fmtPrice(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: {
            grid: { color: "#1b212a" },
            ticks: { color: "#8a93a3", maxTicksLimit: 8, font: { family: "IBM Plex Mono", size: 10.5 } },
          },
          y: {
            grid: { color: "#1b212a" },
            ticks: { color: "#8a93a3", font: { family: "IBM Plex Mono", size: 10.5 }, callback: (v) => `$${v}` },
          },
        },
      },
    });
  } catch (e) {
    canvas.parentElement.innerHTML = `<div class="state-msg error">Couldn't load chart: ${e.message}</div>`;
  }
}

async function renderCompanyNews() {
  const el = document.getElementById("companyNewsList");
  if (!API.keysConfigured()) {
    el.innerHTML = `<div class="state-msg">Add your API keys in js/config.js to load news.</div>`;
    return;
  }
  try {
    const items = await API.getCompanyNews(SYMBOL);
    if (!items.length) {
      el.innerHTML = `<div class="state-msg">No recent news for ${SYMBOL}.</div>`;
      return;
    }
    el.innerHTML = items
      .map(
        (n) => `
        <a class="news-item" href="${n.url}" target="_blank" rel="noopener noreferrer">
          <div class="news-item__meta">${n.source || "News"} · ${fmtTimeAgo(n.datetime)}</div>
          <div class="news-item__headline">${escapeHtml(n.headline)}</div>
        </a>`
      )
      .join("");
  } catch (e) {
    el.innerHTML = `<div class="state-msg error">Couldn't load news: ${e.message}</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  renderConfigBannerIfNeeded("configBanner");
  initRangeTabs();
  initWatchlistToggle();
  updateWatchlistButton();
  renderHeader();
  renderChart();
  renderCompanyNews();
});
