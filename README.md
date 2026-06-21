# refillka × City of Taguig — Public Impact Site

A stakeholder-ready, **static** multi-page website for the **refillka Taguig Monitored Field Study**
(refillka by ReCirca Management Corp, in partnership with the City Government of Taguig, NutriAsia,
and the Plastic Reboot Program / GEF-UNIDO-DENR).

Built for the Mayor & LGU, brand partners, institutional buyers, citizens, and international observers.
Every figure on the site is traceable to the source documents (proposal, PRD, platform spec).

## Pages
| File | Audience | Content |
|---|---|---|
| `index.html` | Everyone | Mission, the 1 Billion Challenge, live snapshot, national + Metro impact maps, routing |
| `dashboard.html` | **All users** | Live feed, verified pilot actuals, 6-mo projections (scenario toggle), channels, impact calculator, SDGs, interactive PH map |
| `individuals.html` | **Individuals / households** | ₱1,080/mo savings, Circa ID & points, 5-step refill loop, products, household impact |
| `enterprise.html` | **Enterprise / institutions** | Up to 15% cost cut, ESG/EPR reporting, 14,508 sachets/client/mo, Taguig City as first client |
| `pilot.html` | LGU & partners | Field-study design, timeline, impact methodology (Equations A/B), **financials & 7 asks** |
| `partners.html` | Everyone | Partners & governance, mission/about, EPR context, contact |

## Tech
Plain HTML + CSS + vanilla JS. No build step, no frameworks. Fonts: **Sora** + **Lora** (Google Fonts).

- `styles.css` — design system (brand tokens, components, responsive).
- `data.js` — **canonical data layer** (the only place numbers live).
- `app.js` — behaviours: count-up, scroll reveals, scenario toggle, impact calculator, live ticker,
  and the interactive national + Metro Manila impact maps.

## Live numbers & the future database
The site shows **verified pilot actuals** (e.g. 28,821 sachets avoided, as of May 2026) plus a
**simulated "live estimate"** that advances daily, modeled from the pilot run-rate (~443/day) and clearly
labelled as a projection — *not* verified actuals.

When the live database is ready, this is a **one-function change**: replace the body of
`REFILLKA.getLiveImpact()` in `data.js` with a `fetch('/api/impact/live')` returning the same shape.
No page markup needs to change — every page reads from `data.js`.

## Local preview
```bash
cd refillka-taguig-public
python3 -m http.server 8080      # then open http://localhost:8080
```

## Deploy to Netlify
**Option A — connect the GitHub repo (recommended, auto-deploys on every push):**
1. Push this folder to GitHub (repo: `rondarioces88-byte/Refilka-reCirca`).
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command: *(leave empty)* · Publish directory: `.` → **Deploy**. `netlify.toml` is already included.

**Option B — Netlify CLI (deploy this folder directly):**
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir .
```

## Data sources
- refillka Taguig Monitored Field Study — Full Proposal (June 2026)
- Product PRD / Q&A (launch scope, impact formulas, products, points, savings)
- refillka platform master specification & seed data

© 2026 ReCirca Management Corp. Contact: collaborate@recircagroup.com · www.recircagroup.com
