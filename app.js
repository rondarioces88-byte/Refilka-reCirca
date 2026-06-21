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
    var paths = window.PH_MAP_PATHS || '';
    mounts.forEach(function (mount) {
      if (paths && !mount.querySelector('.ph-svg')) {
        var wrap = document.createElement('div');
        wrap.innerHTML =
          '<svg class="ph-svg" viewBox="0 0 1024 1024" role="img" aria-label="Map of the Philippines — refillka pilot in Taguig with nationwide 2030 vision markers">' +
            '<defs>' +
              '<linearGradient id="phGrad" x1="0" y1="0" x2="0.35" y2="1">' +
                '<stop offset="0" stop-color="#3a9c63"/><stop offset="0.55" stop-color="#1f6a42"/><stop offset="1" stop-color="#0e3a26"/>' +
              '</linearGradient>' +
              '<linearGradient id="phSheen" x1="0" y1="0" x2="1" y2="0.5">' +
                '<stop offset="0.28" stop-color="#eafff0" stop-opacity="0"/>' +
                '<stop offset="0.5" stop-color="#f4fff6" stop-opacity="0.55"/>' +
                '<stop offset="0.72" stop-color="#eafff0" stop-opacity="0"/>' +
                '<animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="6.5s" repeatCount="indefinite"/>' +
              '</linearGradient>' +
              '<pattern id="phDots" width="13" height="13" patternUnits="userSpaceOnUse">' +
                '<circle cx="2.2" cy="2.2" r="1.1" fill="#ffffff" opacity="0.20"/></pattern>' +
              '<g id="phLand" transform="translate(0,1024) scale(0.1,-0.1)">' + paths + '</g>' +
              '<clipPath id="phClip"><use href="#phLand"/></clipPath>' +
            '</defs>' +
            '<use href="#phLand" fill="url(#phGrad)"/>' +
            '<rect x="0" y="0" width="1024" height="1024" fill="url(#phDots)" clip-path="url(#phClip)"/>' +
            '<rect x="0" y="0" width="1024" height="1024" fill="url(#phSheen)" clip-path="url(#phClip)"/>' +
            '<use href="#phLand" fill="none" stroke="#86e06a" stroke-width="2.5" opacity="0.55"/>' +
          '</svg>';
        mount.insertBefore(wrap.firstElementChild, mount.firstChild);
      }
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

/* ============================================================
   CRAFTED SVG ICON SET — replaces emoji glyphs at runtime with
   clean monochrome line icons (consistent, brand-coherent).
   ============================================================ */
(function () {
  'use strict';
  var ICONS = {
    recycle: '<path d="M5 9a7 7 0 0 1 11-3l2 2"/><path d="M19 15a7 7 0 0 1-11 3l-2-2"/><path d="M18 4v4h-4"/><path d="M6 20v-4h4"/>',
    store: '<path d="M4 9h16l-1-4H5L4 9z"/><path d="M4 9v10h16V9"/><path d="M9 19v-5h6v5"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16.5 6a3 3 0 0 1 0 6"/><path d="M21 19a6 6 0 0 0-4-5.7"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
    building: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    chart: '<path d="M3 20h18"/><path d="M6 20v-6M11 20V8M16 20v-9"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5 9a1 1 0 0 0 1 1.5h12a1 1 0 0 0 1-1.5l-5-9V3"/><path d="M7.5 15h9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18"/>',
    wave: '<path d="M3 8c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/><path d="M3 13c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/><path d="M3 18c3 0 3 1.5 6 1.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M9 7h3.4a2.6 2.6 0 0 1 0 5.2H9V7zM9 7v10M7 10.5h6"/>',
    leaf: '<path d="M5 19c0-8 6-13 14-13 0 8-6 13-14 13z"/><path d="M5 19c4-6 7-8 11-9"/>',
    basket: '<path d="M5 9h14l-1.4 10.6a1 1 0 0 1-1 .9H7.4a1 1 0 0 1-1-.9L5 9z"/><path d="M9 9l3-5 3 5"/><path d="M9.5 13v3.5M14.5 13v3.5"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    star: '<path d="M12 3.2l2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 16.6 6.8 19.3l1-5.8L3.6 9.4l5.8-.9L12 3.2z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1"/>',
    industry: '<path d="M3 21V10l6 4V10l6 4V6h6v15z"/><path d="M7 21v-4M13 21v-4M18 21v-4"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 20h20"/>',
    cap: '<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11v5c0 1.2 3 2.2 6 2.2s6-1 6-2.2v-5"/>',
    hospital: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/>',
    hotel: '<path d="M3 18V8M3 12h13a4 4 0 0 1 4 4v2M3 18h18"/><circle cx="7.5" cy="10.5" r="1.4"/>',
    landmark: '<path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10"/><path d="M3 10h18L12 4 3 10z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  var MAP = {
    '♻': 'recycle', '🏪': 'store', '👥': 'people', '🤝': 'people',
    '🏠': 'home', '🏘': 'home', '🏢': 'building', '🏬': 'building',
    '📊': 'chart', '📈': 'trend', '🧪': 'flask',
    '🌏': 'globe', '🌍': 'globe', '🌐': 'globe', '🌊': 'wave',
    '💸': 'money', '💰': 'money', '🌿': 'leaf', '🍃': 'leaf', '🌱': 'leaf', '💚': 'leaf',
    '🧺': 'basket', '📱': 'phone', '⭐': 'star', '🌟': 'star',
    '🛠': 'gear', '⚙': 'gear', '🏭': 'industry', '💻': 'laptop', '🎓': 'cap',
    '🏥': 'hospital', '🏨': 'hotel', '🏛': 'landmark', '📍': 'pin'
  };
  function clean(s) { return (s || '').replace(/[️‍\s]/g, ''); }
  function lookup(s) { return MAP[clean(s)] || null; }
  function svgUse(id) { return '<svg class="ic-svg" aria-hidden="true"><use href="#rk-' + id + '"></use></svg>'; }

  function injectSprite() {
    if (document.getElementById('rk-sprite')) return;
    var inner = '';
    for (var k in ICONS) inner += '<symbol id="rk-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICONS[k] + '</symbol>';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    wrap.innerHTML = '<svg id="rk-sprite" aria-hidden="true">' + inner + '</svg>';
    document.body.insertBefore(wrap, document.body.firstChild);
  }
  function swapIcons() {
    // standalone icon slots: whole content is one emoji
    document.querySelectorAll('.ic, .nic, .ig, .vic, .leaf').forEach(function (el) {
      if (el.querySelector('.ic-svg')) return;
      var id = lookup(el.textContent);
      if (id) { try { el.innerHTML = svgUse(id); } catch (e) {} }
    });
    // leading-emoji-plus-text slots (hero tags)
    document.querySelectorAll('.tag').forEach(function (el) {
      if (el.querySelector('.ic-svg')) return;
      var m = el.textContent.match(/^\s*([←-⯿\uD800-\uDFFF️‍]+)\s*([\s\S]*)$/);
      if (m) { var id = lookup(m[1]); if (id) { try { el.innerHTML = svgUse(id) + ' ' + m[2]; } catch (e) {} } }
    });
  }
  function init() { injectSprite(); swapIcons(); }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

