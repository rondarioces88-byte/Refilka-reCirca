/* ============================================================
   refillka × Taguig — CANONICAL DATA LAYER
   ------------------------------------------------------------
   Every figure here is traceable to the source documents:
     PRD       = product Q&A doc
     Proposal  = refillka Taguig Monitored Field Study (June 2026)
     SPEC      = refillka platform master spec / seed data
   ------------------------------------------------------------
   >>> FUTURE DB INTEGRATION <<<
   This file is the ONLY place numbers live. When the live database
   is ready, replace the body of `REFILLKA.getLiveImpact()` with a
   `fetch('/api/impact/live')` call returning the same shape. Nothing
   else in the site needs to change — every page reads from here.
   ============================================================ */
window.REFILLKA = (function () {

  /* ---- VERIFIED PILOT ACTUALS (as of May 2026) — Proposal p.3 / PRD ---- */
  var actuals = {
    sachets: 28821,        // 19,927 (15 stores, Mar 27) + 8,894 (City Hall booth, May 18)
    stores: 15,
    barangays: 4,
    buyers: 200,           // 200+ founding buyers since May 18 (PRD)
    asOfISO: '2026-05-31',
    asOfLabel: 'May 2026',
    breakdown: {
      channel1: { label: 'Sari-sari stores (15, since Mar 27)', sachets: 19927 },
      booth:    { label: 'City Hall booth (since May 18)',      sachets: 8894 }
    }
  };

  /* ---- 6-MONTH MONITORED FIELD STUDY PROJECTIONS (Aug 2026–Feb 2027) — Proposal §4 ---- */
  var projection = {
    s500: {
      label: '500 ARPs (minimum scenario)', arps: 500, perBarangay: 13,
      total: 12342328, ch1: 3274572, ch2: 8704800, ch3: 362956,
      plasticKg: 18513.49, plasticMT: 92.57,
      haulingLow: 277710, haulingHigh: 462850,
      revolvingFund: 2475000
    },
    s2300: {
      label: '2,300 ARPs (full scenario)', arps: 2300, perBarangay: 60,
      total: 46303400, ch1: 15069600, ch2: 8704800, ch3: 362956,
      plasticKg: 69455.10, plasticMT: 347.3,
      haulingLow: 1041900, haulingHigh: 1736500,
      revolvingFund: 11385000
    }
  };

  /* ---- 1 BILLION CHALLENGE & NETWORK — Proposal / SPEC ---- */
  var goal = 1000000000, goalYear = 2030;
  var network = {
    storePartners: 2495,        // confirmed across 14 cities, early 2026 (Proposal §2.2)
    cities: 14,
    registeredSariSari: 23000,  // registered sari-sari stores in Taguig (Proposal)
    cenroWorkers: 1000,         // CENRO Taguig workforce mobilized
    barangaysTotal: 38,         // Taguig barangays
    sachetsPerDayPH: 163000000  // Philippines generates ~163M sachets/day (Proposal §1)
  };

  /* ---- IMPACT MAP — Metro Manila cities (SPEC seed) ----
     x/y are RELATIVE positions (0–100) inside the Metro Manila board,
     arranged to match real compass geography. nat_x/nat_y mark NCR on
     the national PH map (percent of the image). ---- */
  // Only Taguig carries VERIFIED impact. The other Metro Manila cities are
  // labelled as part of the broader network (2,495 stores across 14 cities,
  // confirmed early 2026) — no per-city impact figures are claimed.
  var cities = [
    { name: 'Taguig', status: 'PILOT', statusClass: 'green', lead: true, x: 58, y: 70, r: 17,
      metric: '28,821', metricLabel: 'sachets avoided (verified)',
      sub: 'Monitored Field Study city · 15 live stores · 4 barangays' },
    { name: 'Makati', status: 'NETWORK', statusClass: 'green', x: 49, y: 55, r: 11,
      metric: 'Network', metricLabel: 'Metro Manila network city',
      sub: 'Part of refillka’s 2,495-store network across 14 cities (confirmed early 2026)' },
    { name: 'Quezon City', status: 'NETWORK', statusClass: 'green', x: 55, y: 28, r: 12,
      metric: 'Network', metricLabel: 'Metro Manila network city',
      sub: 'Part of refillka’s 2,495-store network across 14 cities (confirmed early 2026)' },
    { name: 'Caloocan', status: 'NETWORK', statusClass: 'green', x: 38, y: 21, r: 11,
      metric: 'Network', metricLabel: 'Metro Manila network city',
      sub: 'Part of refillka’s 2,495-store network across 14 cities (confirmed early 2026)' },
    { name: 'Marikina', status: 'NETWORK', statusClass: 'green', x: 72, y: 33, r: 11,
      metric: 'Network', metricLabel: 'Metro Manila network city',
      sub: 'Part of refillka’s 2,495-store network across 14 cities (confirmed early 2026)' }
  ];
  // NCR marker position on the national PH_Map.png (percent)
  var ncrOnNationalMap = { x: 45.5, y: 48 };

  /* ---- NATIONAL PH MAP markers (percent positions on PH_Map.png) ----
     Only the Taguig/NCR marker carries VERIFIED impact. The "vision"
     markers represent network reach (2,495 stores across 14 cities) and
     the 2030 "RefillKa Everywhere" goal — illustrative, not city-level
     claims. Rendered faint + clearly labelled. ---- */
  var phMarkers = [
    { name: 'Metro Manila · Taguig', kind: 'pilot', statusClass: 'green', lead: true, x: 45.5, y: 48, r: 13,
      metric: '28,821', metricLabel: 'sachets avoided (verified)',
      sub: 'Monitored Field Study city · 15 live stores · 4 barangays' },
    { name: 'Northern Luzon', kind: 'vision', statusClass: 'green', x: 43, y: 20, r: 7,
      metric: '2030', metricLabel: 'RefillKa Everywhere vision',
      sub: 'Part of 2,495 store partners across 14 cities (illustrative reach)' },
    { name: 'Palawan', kind: 'vision', statusClass: 'green', x: 30, y: 61, r: 6,
      metric: '2030', metricLabel: 'national rollout vision',
      sub: 'Illustrative reach toward the 1 Billion Challenge by 2030' },
    { name: 'Visayas', kind: 'vision', statusClass: 'green', x: 56, y: 67, r: 7,
      metric: '2030', metricLabel: 'RefillKa Everywhere vision',
      sub: 'Part of 2,495 store partners across 14 cities (illustrative reach)' },
    { name: 'Mindanao', kind: 'vision', statusClass: 'green', x: 64, y: 83, r: 7,
      metric: '2030', metricLabel: 'national rollout vision',
      sub: 'Illustrative reach toward the 1 Billion Challenge by 2030' }
  ];

  /* ---- SDG MAPPING — SPEC ---- */
  var sdgs = [
    { n: 12, name: 'Responsible Consumption & Production', color: '#BF8B2E', headline: '28,821', unit: 'sachets avoided (pilot)' },
    { n: 14, name: 'Life Below Water',                     color: '#0A97D9', headline: '92.57–347.3', unit: 'MT plastic diverted (6-mo proj.)' },
    { n: 13, name: 'Climate Action',                       color: '#3F7E44', headline: '6.0', unit: 'kg CO₂e avoided / kg plastic' },
    { n: 11, name: 'Sustainable Cities & Communities',     color: '#FD9D24', headline: '38', unit: 'Taguig barangays in scope' },
    { n: 8,  name: 'Decent Work & Economic Growth',        color: '#A21942', headline: '1,000+', unit: 'CENRO livelihoods re-skilled' },
    { n: 17, name: 'Partnerships for the Goals',           color: '#19486A', headline: '6', unit: 'anchor partners aligned' }
  ];

  /* ---- LIVE FEED (SIMULATED until DB) ----
     Daily run-rate modeled from the verified pilot: 28,821 sachets over
     ~65 days (Mar 27 → May 31) ≈ 443/day. The "live estimate" advances
     each calendar day (per-day update) and is clearly labelled as a
     modeled projection — NOT verified actuals. Replace getLiveImpact()
     with a DB/API call when ready. ---- */
  var DAILY_RATE = 443; // ≈ 28,821 / 65 days  (documented derivation above)

  function daysSince(iso) {
    var ms = Date.now() - new Date(iso + 'T00:00:00Z').getTime();
    return Math.max(0, Math.floor(ms / 86400000));
  }

  function getLiveImpact() {
    // <<< swap this body for: return fetch('/api/impact/live').then(r => r.json()); >>>
    var days = daysSince(actuals.asOfISO);
    var modeled = actuals.sachets + DAILY_RATE * days;
    // never exceed the published 6-month full-scenario projection
    var liveEstimate = Math.min(modeled, projection.s2300.total);
    return {
      verified: actuals.sachets,
      verifiedAsOf: actuals.asOfLabel,
      liveEstimate: liveEstimate,
      dailyRate: DAILY_RATE,
      daysSinceBaseline: days,
      simulated: true,           // flips to false once the DB is wired
      updatedAtISO: new Date().toISOString()
    };
  }

  return {
    actuals: actuals, projection: projection, goal: goal, goalYear: goalYear,
    network: network, cities: cities, ncrOnNationalMap: ncrOnNationalMap, phMarkers: phMarkers, sdgs: sdgs,
    DAILY_RATE: DAILY_RATE, getLiveImpact: getLiveImpact
  };
})();
