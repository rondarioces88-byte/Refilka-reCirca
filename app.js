/* ============================================================
   refillka × Taguig — shared front-end behaviours (no deps)
   - count-up for [data-count]
   - reveal-on-scroll for [data-reveal]
   - 1B challenge bar fill for [data-pct]
   - scenario toggle (500 ↔ 2,300 ARPs) for dashboard
   - faithful impact calculator (PRD Equation A & B)
   - active nav highlight
   ============================================================ */
(function () {
  'use strict';

  /* ---------- active nav (robust to relative paths) ---------- */
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.tabs .tab').forEach(function (a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (href === here) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
  });

  /* ---------- number formatting ---------- */
  function fmt(n, decimals) {
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals || 0,
      maximumFractionDigits: decimals || 0
    });
  }

  /* ---------- count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1500, start = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = prefix + fmt(target, decimals) + suffix; return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + fmt(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + fmt(target, decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- IntersectionObserver: reveal + trigger count + bars ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.hasAttribute('data-reveal')) el.classList.add('in');
      if (el.hasAttribute('data-count') && !el.dataset.counted) { el.dataset.counted = '1'; countUp(el); }
      if (el.classList.contains('fill') && el.hasAttribute('data-pct') && !el.dataset.filled) {
        el.dataset.filled = '1';
        var pct = Math.max(parseFloat(el.getAttribute('data-pct')) || 0, 0);
        setTimeout(function () { el.style.width = Math.min(pct, 100) + '%'; }, 120);
      }
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }) : null;

  function observeAll() {
    var sel = '[data-reveal],[data-count],.challenge .fill[data-pct]';
    document.querySelectorAll(sel).forEach(function (el) {
      if (io) io.observe(el);
      else { // fallback: no IO
        el.classList.add('in');
        if (el.hasAttribute('data-count') && !el.dataset.counted) { el.dataset.counted = '1'; countUp(el); }
        if (el.classList.contains('fill') && el.hasAttribute('data-pct')) el.style.width = (el.getAttribute('data-pct') || 0) + '%';
      }
    });
  }

  /* ---------- staggered reveal delays ---------- */
  document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
    var d = el.getAttribute('data-reveal-delay');
    el.style.transitionDelay = (d !== null ? d : (i % 6) * 70) + 'ms';
  });

  /* ---------- scenario toggle (dashboard.html) ---------- */
  function setScenario(scn) {
    document.querySelectorAll('[data-scenario]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-scenario') === scn);
    });
    document.querySelectorAll('[data-scn]').forEach(function (el) {
      var v = el.getAttribute('data-v' + scn);
      if (v !== null) el.textContent = v;
    });
  }
  document.querySelectorAll('[data-scenario]').forEach(function (b) {
    b.addEventListener('click', function () { setScenario(b.getAttribute('data-scenario')); });
  });
  // default scenario = 500 (conservative / minimum)
  if (document.querySelector('[data-scenario]')) setScenario('500');

  /* ---------- impact calculator (PRD Equation A & B — faithful configs) ---------- */
  // PRD "Product Mapping Dictionary" / Constants Reference Object
  var PRODUCT_CONFIGS = {
    household: { label: 'Household cleaning', unit: 'gallons', conversionToMl: 3785.41, sachetVolumeMl: 18.5, sachetWeightKg: 0.0015, emissionFactor: 6.0 },
    condiments: { label: 'Soy sauce / vinegar', unit: 'liters', conversionToMl: 1000.0, sachetVolumeMl: 20.0, sachetWeightKg: 0.0012, emissionFactor: 6.0 },
    oil: { label: 'Cooking oil', unit: 'liters', conversionToMl: 1000.0, sachetVolumeMl: 250.0, sachetWeightKg: 0.0045, emissionFactor: 6.0 }
  };
  var TREE_KG_CO2_PER_YEAR = 21; // illustrative benchmark for the "translation layer"

  function calcImpact(productKey, qty) {
    var c = PRODUCT_CONFIGS[productKey];
    if (!c || !(qty > 0)) return null;
    var totalMl = qty * c.conversionToMl;
    var sachets = totalMl / c.sachetVolumeMl;
    var plasticKg = sachets * c.sachetWeightKg;
    var co2Kg = plasticKg * c.emissionFactor;
    return { sachets: sachets, plasticKg: plasticKg, co2Kg: co2Kg, unit: c.unit };
  }

  function runCalc() {
    var sel = document.getElementById('calc-product');
    var qtyEl = document.getElementById('calc-qty');
    if (!sel || !qtyEl) return;
    var key = sel.value, qty = parseFloat(qtyEl.value);
    var unitHint = document.getElementById('calc-unit');
    if (unitHint && PRODUCT_CONFIGS[key]) unitHint.textContent = PRODUCT_CONFIGS[key].unit;
    var r = calcImpact(key, qty);
    var sEl = document.getElementById('out-sachets'),
        pEl = document.getElementById('out-plastic'),
        cEl = document.getElementById('out-co2'),
        eqEl = document.getElementById('calc-equiv');
    if (!r) {
      if (sEl) sEl.textContent = '—'; if (pEl) pEl.textContent = '—'; if (cEl) cEl.textContent = '—';
      if (eqEl) eqEl.textContent = 'Enter a quantity to see the avoided impact.';
      return;
    }
    if (sEl) sEl.textContent = fmt(r.sachets, 0);
    if (pEl) pEl.textContent = fmt(r.plasticKg, 2);
    if (cEl) cEl.textContent = fmt(r.co2Kg, 2);
    if (eqEl) {
      var trees = r.co2Kg / TREE_KG_CO2_PER_YEAR;
      eqEl.innerHTML = '≈ <strong>' + fmt(r.sachets, 0) + '</strong> single-use sachets kept out of the waste stream — about <strong>' +
        fmt(trees, 1) + '</strong> trees’ worth of annual CO₂ absorption (illustrative, at ~21&nbsp;kg&nbsp;CO₂e/tree/yr).';
    }
  }
  var calcGo = document.getElementById('calc-go');
  if (calcGo) calcGo.addEventListener('click', runCalc);
  ['calc-product', 'calc-qty'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', runCalc);
  });
  if (document.getElementById('calc-product')) runCalc(); // compute defaults on load

  /* ---------- init ---------- */
  if (document.readyState !== 'loading') observeAll();
  else document.addEventListener('DOMContentLoaded', observeAll);

  /* ============================================================
     LIVE DATA + IMPACT MAP (reads window.REFILLKA from data.js)
     ============================================================ */
  function fmt2(n, d) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  function mountLiveTicker() {
    var mounts = document.querySelectorAll('[data-live-ticker]');
    if (!mounts.length || !window.REFILLKA) return;
    var live = window.REFILLKA.getLiveImpact();
    var time = new Date(live.updatedAtISO).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    var html =
      '<div class="live-ticker">' +
        '<div class="lt-block verified">' +
          '<div class="lt-head">Verified · ' + live.verifiedAsOf + '</div>' +
          '<div class="lt-val" data-count="' + live.verified + '">' + fmt2(live.verified) + '</div>' +
          '<div class="lt-sub">sachets avoided — pilot actuals</div>' +
        '</div>' +
        '<div class="lt-rule"></div>' +
        '<div class="lt-block estimate">' +
          '<div class="lt-head"><span class="live-dot"></span>&nbsp;Live estimate <span class="sim-tag">simulated</span></div>' +
          '<div class="lt-val" id="live-estimate">' + fmt2(live.liveEstimate) + '</div>' +
          '<div class="lt-sub">modeled run-rate · updates daily until DB integration</div>' +
        '</div>' +
        '<div class="lt-meta">Run-rate <b>~' + live.dailyRate + '</b>/day<br>' +
          'Day <b>' + live.daysSinceBaseline + '</b> since May 2026 baseline<br>' +
          '<span id="live-updated">updated ' + time + '</span></div>' +
      '</div>' +
      '<p class="sim-note">Live estimate is a modeled projection from the verified pilot run-rate ' +
      '(28,821 sachets over ~65 days ≈ 443/day) and advances each day. It will be replaced by live ' +
      'database figures once the refillka data pipeline is connected.</p>';
    mounts.forEach(function (m) { m.innerHTML = html; });

    // gentle in-session "alive" tick (capped, clearly simulated)
    var est = live.liveEstimate, added = 0;
    var node = document.getElementById('live-estimate');
    if (node && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(function () {
        if (added >= 60) return;            // cap per session
        est += 1; added += 1;
        node.textContent = fmt2(est);
        var u = document.getElementById('live-updated');
        if (u) u.textContent = 'updated ' + new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
      }, 6000);
    }
  }

  // simple live targets, e.g. <span data-live="estimate"></span> on the home teaser
  function fillLiveTargets() {
    if (!window.REFILLKA) return;
    var live = window.REFILLKA.getLiveImpact();
    document.querySelectorAll('[data-live]').forEach(function (el) {
      var k = el.getAttribute('data-live');
      if (k === 'estimate') el.textContent = fmt2(live.liveEstimate);
      else if (k === 'verified') el.textContent = fmt2(live.verified);
      else if (k === 'daily') el.textContent = fmt2(live.dailyRate);
    });
  }

  function mountMetroMap() {
    var mounts = document.querySelectorAll('[data-metro-map]');
    if (!mounts.length || !window.REFILLKA) return;
    var cities = window.REFILLKA.cities;
    mounts.forEach(function (mount) {
      var board = document.createElement('div');
      board.className = 'metro-board';
      board.setAttribute('role', 'group');
      board.setAttribute('aria-label', 'Metro Manila impact map');
      board.innerHTML = '<span class="mb-title">Metro Manila · NCR</span>';
      var pop = document.createElement('div');
      pop.className = 'city-pop';

      cities.forEach(function (c, i) {
        var btn = document.createElement('button');
        btn.className = 'city-node' + (c.lead ? ' lead' : '');
        btn.style.left = c.x + '%'; btn.style.top = c.y + '%';
        btn.setAttribute('data-status', c.statusClass);
        btn.setAttribute('aria-label', c.name + ': ' + c.status + ', ' + c.metric + ' ' + c.metricLabel);
        var d = (c.r || 12) * 2;
        btn.innerHTML = '<span class="blip" style="width:' + d + 'px;height:' + d + 'px"></span>' +
                        '<span class="cn-name">' + c.name + '</span>';
        function show() {
          pop.innerHTML = '<h4>' + c.name + ' <span class="pill ' + c.statusClass + '">' + c.status + '</span></h4>' +
            '<div class="cp-val">' + c.metric + '</div><div class="cp-lbl">' + c.metricLabel + '</div>' +
            '<div class="cp-sub">' + c.sub + '</div>';
          pop.style.left = c.x + '%'; pop.style.top = c.y + '%';
          pop.classList.toggle('flip', c.y < 35);
          pop.classList.add('show');
        }
        function hide() { pop.classList.remove('show'); }
        btn.addEventListener('mouseenter', show);
        btn.addEventListener('focus', show);
        btn.addEventListener('mouseleave', hide);
        btn.addEventListener('blur', hide);
        btn.addEventListener('click', function (e) { e.preventDefault(); show(); });
        board.appendChild(btn);
      });
      board.appendChild(pop);
      mount.appendChild(board);
    });
  }

  // Interactive NATIONAL PH map: markers anchored to the image (.nat-img),
  // popovers flip below for top markers so they never clip the figure.
  function mountPHMap() {
    var mounts = document.querySelectorAll('[data-ph-map]');
    if (!mounts.length || !window.REFILLKA) return;
    var markers = window.REFILLKA.phMarkers;
    mounts.forEach(function (mount) {
      var pop = document.createElement('div');
      pop.className = 'city-pop';
      markers.forEach(function (c) {
        var btn = document.createElement('button');
        btn.className = 'city-node' + (c.lead ? ' lead' : '') + (c.kind === 'vision' ? ' vision' : '');
        btn.style.left = c.x + '%'; btn.style.top = c.y + '%';
        btn.setAttribute('data-status', c.statusClass);
        btn.setAttribute('aria-label', c.name + ': ' + c.metric + ' ' + c.metricLabel);
        var d = (c.r || 10) * 2;
        btn.innerHTML = '<span class="blip" style="width:' + d + 'px;height:' + d + 'px"></span>' +
                        (c.lead ? '<span class="cn-name">Taguig pilot</span>' : '');
        function show() {
          var below = c.y < 38;
          pop.innerHTML = '<h4>' + c.name + (c.kind === 'vision' ? ' <span class="pill gray">vision</span>' : ' <span class="pill green">verified</span>') + '</h4>' +
            '<div class="cp-val">' + c.metric + '</div><div class="cp-lbl">' + c.metricLabel + '</div>' +
            '<div class="cp-sub">' + c.sub + '</div>';
          pop.style.left = c.x + '%'; pop.style.top = c.y + '%';
          pop.classList.toggle('flip', below);
          pop.classList.add('show');
        }
        function hide() { pop.classList.remove('show'); }
        btn.addEventListener('mouseenter', show);
        btn.addEventListener('focus', show);
        btn.addEventListener('mouseleave', hide);
        btn.addEventListener('blur', hide);
        btn.addEventListener('click', function (e) { e.preventDefault(); show(); });
        mount.appendChild(btn);
      });
      mount.appendChild(pop);
    });
  }

  function initLive() { mountLiveTicker(); fillLiveTargets(); mountMetroMap(); mountPHMap(); observeAll(); }
  if (document.readyState !== 'loading') initLive();
  else document.addEventListener('DOMContentLoaded', initLive);
})();
