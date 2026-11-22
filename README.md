# Finwhyte

A stock market dashboard: market overview, an editable watchlist, a chart with
selectable time ranges, and news feeds — modeled on finviz.com / finance.yahoo.com.

Plain HTML/CSS/JS — no build step, no framework, no server required to run it.
Open `index.html` in a browser and it works (once you add two free API keys).

---

## 1. Get it running locally (2 minutes)

1. **Get a free Finnhub API key** — [finnhub.io/register](https://finnhub.io/register). No card required. Powers live quotes, symbol search, and news.
2. **Get a free Twelve Data API key** — [twelvedata.com/pricing](https://twelvedata.com/pricing) → "Basic (Free)". Powers the price chart. (Finnhub retired free historical chart data in 2025, so this second key fills that gap — everything else uses Finnhub alone.)
3. Open `js/config.js` and paste both keys in:
   ```js
   FINNHUB_API_KEY: "your_real_key_here",
   TWELVEDATA_API_KEY: "your_real_key_here",
   ```
4. Open `index.html` directly in a browser, **or** serve it locally (recommended, avoids
   any browser file:// quirks):
   ```bash
   cd smythehyte
   python3 -m http.server 8080
   # visit http://localhost:8080
   ```

That's it — no `npm install`, no build.

### Free-tier limits to know
- Finnhub: 60 requests/minute.
- Twelve Data: 800 requests/day, 8/minute.
- The site caches each request for 30 seconds client-side to avoid burning
  through these while you click around. A big watchlist (20+ symbols) or
  refreshing very rapidly can still hit the limit — if data stops updating,
  wait a minute.

---

## 2. Where to put the source code

**GitHub** (or GitLab/Bitbucket) — a plain git repo. This is the standard place
to keep source you want to save, version, and redeploy:

```bash
cd finwhyte
git init
git add .
git commit -m "Initial commit"
gh repo create finwhyte --private --source=. --push
# or: create an empty repo on github.com, then
#   git remote add origin https://github.com/YOUR_USERNAME/finwhyte.git
#   git branch -M main
#   git push -u origin main
```

Two things worth doing before your first push:
- **Don't commit real API keys to a public repo.** Since this is a static
  site, the key has to ship in the client JS either way — but if the repo is
  public, anyone can find it in your commit history too. Either keep the repo
  private, or use the "inject key at deploy time" pattern in section 4 below.
- Add a `.gitignore` if you later add local tooling (e.g. `node_modules/`).

From there, every host in the next section can deploy directly from that
GitHub repo, so "redeploy with changes" becomes: edit files → `git push` →
your host rebuilds automatically in ~30 seconds.

---

## 3. Where to host the website

Since this is a static site (no backend/database), any static host works.
Ranked by how little friction they add:

| Host | Cost | Why pick it |
|---|---|---|
| **Cloudflare Pages** | Free | Fastest global CDN, generous free tier, simple git integration |
| **Netlify** | Free tier | Easiest drag-and-drop deploy *or* git integration, great for beginners |
| **Vercel** | Free tier | Same ease as Netlify, very popular, git integration |
| **GitHub Pages** | Free | Zero extra signup if your code is already on GitHub |

Any of these is a fine choice — they all give you a `https://yourproject.pages.dev`
/`.netlify.app`/`.vercel.app` style URL for free, with an option to attach a
custom domain (e.g. `Finwhyte.com`) later.

### Deploy on Netlify (git-connected, easiest ongoing workflow)
1. Push the code to GitHub (section 2).
2. [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project" → pick your GitHub repo.
3. Build command: leave blank. Publish directory: `.` (the repo root).
4. Click Deploy. You get a live URL in under a minute.
5. From now on: any `git push` to `main` auto-redeploys the live site.

### Deploy on Cloudflare Pages (fastest CDN)
1. Push the code to GitHub.
2. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → "Create" → "Pages" → "Connect to Git".
3. Framework preset: "None". Build command: blank. Output directory: `/`.
4. Deploy. Auto-redeploys on every push, same as Netlify.

### Deploy on GitHub Pages (simplest if already on GitHub)
1. Push the code to GitHub.
2. Repo → Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, folder: `/ (root)`.
3. Save. Your site is live at `https://YOUR_USERNAME.github.io/finwhyte/` in
   a minute or two.

### The "just upload it" option (no git needed)
Netlify also has **Netlify Drop**: [app.netlify.com/drop](https://app.netlify.com/drop) —
drag the whole `finwhyte` folder onto the page and it's live immediately.
Good for a quick test; git-connected deploys (above) are better once you're
iterating, since you skip the manual re-upload step.

---

## 4. Redeploying changes

With any of the git-connected hosts above, the workflow is always:

```bash
# make your edits to index.html / stock.html / css / js
git add .
git commit -m "describe what changed"
git push
```

The host detects the push and republishes automatically — typically live
within 30–60 seconds, no manual redeploy step.

### Hiding your API keys (optional, for a public production site)
Right now the API keys sit in plain text in `js/config.js`, which is fine for
personal/hobby use. If you want to run this as a public product and not
expose your keys:
1. Add a tiny serverless function (Netlify Functions, Cloudflare Workers, or
   Vercel Functions all have generous free tiers) that takes a request from
   your frontend, attaches the real API key server-side, and forwards it to
   Finnhub/Twelve Data.
2. Change the URLs in `js/api.js` to point at your function instead of
   directly at Finnhub/Twelve Data.
This keeps the key out of the browser entirely. It's optional — most personal
dashboards skip this and just keep the free-tier key in the client.

---

## Project structure

```
finwhyte/
├── index.html          Homepage: market strip, watchlist, top news
├── stock.html           Stock detail: price chart, stats, company news
├── css/
│   └── style.css        All styling (dark terminal theme)
├── js/
│   ├── config.js         <- YOUR API KEYS GO HERE
│   ├── api.js            Finnhub + Twelve Data request wrappers, caching
│   ├── common.js          Shared UI: ticker tape, header search, watchlist storage, formatters
│   ├── app.js              Homepage logic
│   └── stock.js            Stock detail page logic
└── README.md
```

## Customizing

- **Default watchlist / ticker tape symbols / market indices**: edit the
  arrays at the top of `js/config.js`.
- **Colors / fonts**: edit the `:root` custom properties at the top of
  `css/style.css` — every color and font in the site is driven from there.
- **Chart time ranges**: edit `CONFIG.CHART_RANGES` in `js/config.js`.
- **Swap data providers**: all API calls live in `js/api.js` — if you outgrow
  the free tiers, you can point those functions at a paid plan or a different
  provider without touching any other file.

## Notes

- Prices are delayed/near-real-time on the free API tiers, not true real-time
  ticking data — fine for a personal dashboard, not for active trading.
- This is a demo/personal-project data pipeline, not investment advice, and
  isn't built to handle production-scale traffic without the key-hiding step
  in section 4.
