/*
 * Agritourism Revenue Calculator — page behaviour.
 * Builds the input cards, updates results live, handles the email form
 * and tells a parent page (iframe host) how tall this page is.
 * Settings live in config.js; the maths lives in js/calculator.js.
 */
(function () {
  'use strict';

  var Calc = window.AgriCalc;
  var CONFIG = window.CALCULATOR_CONFIG || {};
  var UNLOCK_KEY = 'agritourism-calculator-unlocked';
  var STATE_KEY = 'agritourism-calculator-inputs';
  var scenarios = {
    low: CONFIG.scenarios && CONFIG.scenarios.low != null ? CONFIG.scenarios.low : Calc.DEFAULT_SCENARIOS.low,
    high: CONFIG.scenarios && CONFIG.scenarios.high != null ? CONFIG.scenarios.high : Calc.DEFAULT_SCENARIOS.high
  };

  // ---- Money formatting (currency comes from config.js) ----------------
  var currency = CONFIG.currency || 'USD';
  var locale = CONFIG.locale || 'en-US';
  var moneyFmt, pctFmt;
  try {
    moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, maximumFractionDigits: 0, minimumFractionDigits: 0 });
  } catch (e) {
    console.warn('[Calculator] Unknown currency or locale in config.js, falling back to USD.', e);
    moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  pctFmt = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  function money(n) { return moneyFmt.format(Math.round(n) || 0); }
  var currencySymbol = (moneyFmt.formatToParts(0).filter(function (p) { return p.type === 'currency'; })[0] || {}).value || '$';

  // ---- Small storage helpers (storage can be blocked inside iframes) ---
  function load(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, val) { try { window.localStorage.setItem(key, val); } catch (e) { /* ignore */ } }

  // ---- State -----------------------------------------------------------
  var state = Calc.defaultState();
  (function restoreInputs() {
    var raw = load(STATE_KEY);
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      Object.keys(state.streams).forEach(function (id) {
        var s = saved.streams && saved.streams[id];
        if (!s) return;
        var st = state.streams[id];
        st.enabled = !!s.enabled;
        if (s.costPercent != null) st.costPercent = s.costPercent;
        if (typeof s.name === 'string') st.name = s.name;
        Object.keys(st.values).forEach(function (k) { if (s.values && s.values[k] != null) st.values[k] = s.values[k]; });
      });
      if (saved.fixedCosts != null) state.fixedCosts = saved.fixedCosts;
    } catch (e) { /* ignore broken saved data */ }
  })();

  var unlocked = load(UNLOCK_KEY) === '1';
  var $ = function (id) { return document.getElementById(id); };

  // ---- Build the stream input cards ------------------------------------
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'className') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (text != null) node.textContent = text;
    return node;
  }

  function numberField(id, label, kind, value, onChange, hint) {
    var wrap = el('div', { className: 'field' });
    var lab = el('label', { 'for': id, className: 'field-label' }, label);
    var lim = Calc.LIMITS[kind];
    var inputWrap = el('div', { className: 'input-wrap ' + kind });
    var input = el('input', {
      id: id, type: 'number', inputmode: kind === 'money' ? 'decimal' : 'numeric',
      min: String(lim.min), max: String(lim.max), step: kind === 'money' ? 'any' : '1'
    });
    input.value = value;
    if (kind === 'money') inputWrap.appendChild(el('span', { className: 'prefix', 'aria-hidden': 'true' }, currencySymbol));
    inputWrap.appendChild(input);
    if (kind === 'percent') inputWrap.appendChild(el('span', { className: 'suffix', 'aria-hidden': 'true' }, '%'));
    wrap.appendChild(lab);
    if (hint) {
      var h = el('p', { className: 'hint', id: id + '-hint' }, hint);
      input.setAttribute('aria-describedby', id + '-hint');
      wrap.appendChild(h);
    }
    wrap.appendChild(inputWrap);
    input.addEventListener('input', function () { onChange(input.value); });
    return wrap;
  }

  function buildStreams() {
    var container = $('streams');
    Calc.STREAMS.forEach(function (def) {
      var st = state.streams[def.id];
      var card = el('section', { className: 'card stream', 'aria-labelledby': 'name-' + def.id });
      var head = el('div', { className: 'stream-head' });
      var toggleLabel = el('label', { className: 'switch', 'for': 'on-' + def.id });
      var toggle = el('input', { type: 'checkbox', id: 'on-' + def.id, role: 'switch', 'aria-controls': 'body-' + def.id });
      toggle.checked = st.enabled;
      toggleLabel.appendChild(toggle);
      toggleLabel.appendChild(el('span', { className: 'switch-track', 'aria-hidden': 'true' }));
      var nameSpan = el('span', { className: 'stream-name', id: 'name-' + def.id }, def.custom && st.name ? st.name : def.name);
      toggleLabel.appendChild(nameSpan);
      head.appendChild(toggleLabel);
      head.appendChild(el('p', { className: 'hint' }, def.hint));
      card.appendChild(head);

      var body = el('div', { className: 'stream-body', id: 'body-' + def.id });
      body.hidden = !st.enabled;
      card.classList.toggle('is-on', st.enabled);

      if (def.custom) {
        var nf = el('div', { className: 'field field-wide' });
        nf.appendChild(el('label', { 'for': 'custom-name', className: 'field-label' }, 'Name this income stream'));
        var nameInput = el('input', { id: 'custom-name', type: 'text', maxlength: '40', autocomplete: 'off' });
        nameInput.value = st.name === def.name ? '' : st.name;
        nameInput.placeholder = 'e.g. Farm-to-table dinners';
        nameInput.addEventListener('input', function () {
          st.name = nameInput.value.trim() ? nameInput.value : def.name;
          nameSpan.textContent = st.name;
          update();
        });
        nf.appendChild(nameInput);
        body.appendChild(nf);
      }

      var grid = el('div', { className: 'field-grid' });
      def.fields.forEach(function (f) {
        grid.appendChild(numberField('f-' + def.id + '-' + f.key, f.label, f.kind, st.values[f.key], function (v) {
          st.values[f.key] = v; update();
        }));
      });
      grid.appendChild(numberField('f-' + def.id + '-cost', 'Running costs (% of this revenue)', 'percent', st.costPercent, function (v) {
        st.costPercent = v; update();
      }, 'Supplies, staff, card fees and so on.'));
      body.appendChild(grid);
      body.appendChild(el('p', { className: 'stream-total', id: 'total-' + def.id, 'aria-live': 'polite' }));
      card.appendChild(body);

      toggle.addEventListener('change', function () {
        st.enabled = toggle.checked;
        body.hidden = !st.enabled;
        card.classList.toggle('is-on', st.enabled);
        update();
      });
      container.appendChild(card);
    });

    var fixed = $('fixed-costs');
    fixed.value = state.fixedCosts;
    fixed.addEventListener('input', function () { state.fixedCosts = fixed.value; update(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-currency-symbol]'), function (n) { n.textContent = currencySymbol; });
  }

  // ---- Render results ----------------------------------------------------
  var lastResult = null;

  function render(res) {
    var count = res.breakdown.length;
    $('headline-value').textContent = money(res.gross);
    $('mini-total-value').textContent = money(res.gross);
    $('headline-sub').textContent = count === 0
      ? 'Switch on at least one income stream to see an estimate.'
      : 'from ' + count + ' income stream' + (count === 1 ? '' : 's') + ', before costs';

    Calc.STREAMS.forEach(function (def) {
      var t = $('total-' + def.id);
      if (!t) return;
      var st = state.streams[def.id];
      t.textContent = st.enabled ? 'This stream: ' + money(Calc.streamRevenue(def.id, st.values)) + ' a year' : '';
    });

    if (!unlocked) return;

    var net = $('net-value');
    net.textContent = money(res.net);
    net.classList.toggle('negative', res.net < 0);
    $('net-explain').textContent = money(res.gross) + ' revenue − ' + money(res.variableCosts) + ' running costs − ' +
      money(res.fixedCosts) + ' other yearly costs.';

    // Bar chart (one bar per stream, longest = biggest revenue)
    var bars = $('bars');
    bars.textContent = '';
    var max = res.breakdown.reduce(function (m, b) { return Math.max(m, b.gross); }, 0);
    if (count === 0) bars.appendChild(el('li', { className: 'small' }, 'No income streams switched on yet.'));
    res.breakdown.forEach(function (b) {
      var li = el('li', { className: 'bar-row' });
      var labelRow = el('div', { className: 'bar-label' });
      labelRow.appendChild(el('span', { className: 'bar-name' }, b.name));
      labelRow.appendChild(el('span', { className: 'bar-value' }, money(b.gross) + ' · ' + pctFmt.format(b.share)));
      var track = el('div', { className: 'bar-track', 'aria-hidden': 'true' });
      var fill = el('div', { className: 'bar-fill' });
      fill.style.width = (max > 0 ? Math.max(1, (b.gross / max) * 100) : 0) + '%';
      track.appendChild(fill);
      li.appendChild(labelRow);
      li.appendChild(track);
      bars.appendChild(li);
    });

    // Table
    var tbody = $('breakdown-body');
    tbody.textContent = '';
    res.breakdown.forEach(function (b) {
      var tr = el('tr');
      tr.appendChild(el('th', { scope: 'row' }, b.name));
      tr.appendChild(el('td', null, money(b.gross)));
      tr.appendChild(el('td', null, money(b.costs)));
      tr.appendChild(el('td', null, money(b.net)));
      tbody.appendChild(tr);
    });
    var tfoot = $('breakdown-foot');
    tfoot.textContent = '';
    if (res.fixedCosts > 0) {
      var trf = el('tr');
      trf.appendChild(el('th', { scope: 'row' }, 'Other yearly costs'));
      trf.appendChild(el('td', null, '—'));
      trf.appendChild(el('td', null, money(res.fixedCosts)));
      trf.appendChild(el('td', null, money(-res.fixedCosts)));
      tfoot.appendChild(trf);
    }
    var tr2 = el('tr', { className: 'total' });
    tr2.appendChild(el('th', { scope: 'row' }, 'Total'));
    tr2.appendChild(el('td', null, money(res.gross)));
    tr2.appendChild(el('td', null, money(res.variableCosts + res.fixedCosts)));
    tr2.appendChild(el('td', null, money(res.net)));
    tfoot.appendChild(tr2);

    // Scenarios
    var sc = $('scenarios');
    sc.textContent = '';
    [['low', 'Low'], ['expected', 'Expected'], ['high', 'High']].forEach(function (pair) {
      var s = res.scenarios[pair[0]];
      var box = el('div', { className: 'scenario scenario-' + pair[0] });
      box.appendChild(el('h4', null, pair[1]));
      var dl = el('dl');
      dl.appendChild(el('dt', null, 'Revenue'));
      dl.appendChild(el('dd', null, money(s.gross)));
      dl.appendChild(el('dt', null, 'Profit'));
      var dd = el('dd', s.net < 0 ? { className: 'negative' } : null, money(s.net));
      dl.appendChild(dd);
      box.appendChild(dl);
      sc.appendChild(box);
    });
    $('scenario-note').textContent = 'Low shows ' + pctFmt.format(scenarios.low) + ' and high shows ' + pctFmt.format(scenarios.high) +
      ' of your expected revenue, as a simple "what if" range. It is not a forecast. Other yearly costs stay the same in every scenario.';
  }

  var saveTimer = null;
  function update() {
    lastResult = Calc.calculate(state, scenarios);
    render(lastResult);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { save(STATE_KEY, JSON.stringify(state)); }, 300);
  }

  // ---- Lead form ---------------------------------------------------------
  function showUnlocked(moveFocus) {
    unlocked = true;
    $('locked').hidden = true;
    $('details').hidden = false;
    render(lastResult || Calc.calculate(state, scenarios));
    if (moveFocus) $('details-title').focus();
  }

  function setError(input, errorId, show) {
    $(errorId).hidden = !show;
    if (show) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return show;
  }

  function setupForm() {
    var form = $('lead-form');
    var nameI = $('lead-name'), emailI = $('lead-email'), consentI = $('lead-consent');
    var status = $('form-status'), btn = $('lead-submit');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bad = [];
      if (setError(nameI, 'lead-name-error', !nameI.value.trim())) bad.push(nameI);
      if (setError(emailI, 'lead-email-error', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailI.value.trim()))) bad.push(emailI);
      if (setError(consentI, 'lead-consent-error', !consentI.checked)) bad.push(consentI);
      if (bad.length) { bad[0].focus(); status.textContent = ''; return; }

      // Spam trap filled in: pretend it worked, send nothing.
      if ($('lead-website').value) { finish(); return; }

      var endpoint = (CONFIG.formEndpoint || '').trim();
      if (!endpoint) {
        console.warn('[Calculator] No formEndpoint is set in config.js, so this sign-up was NOT saved anywhere. ' +
          'Results were unlocked anyway. See README.md, "Connect the email form".');
        finish();
        return;
      }

      var res = lastResult || Calc.calculate(state, scenarios);
      var data = new FormData();
      data.append('name', nameI.value.trim());
      data.append('email', emailI.value.trim());
      data.append('consent', 'yes: ' + $('consent-label').textContent.trim());
      data.append('estimated_yearly_revenue', money(res.gross));
      data.append('estimated_yearly_profit', money(res.net));
      data.append('income_streams', res.breakdown.map(function (b) { return b.name + ' (' + money(b.gross) + ')'; }).join('; '));
      data.append('source', 'Agritourism Revenue Calculator');
      data.append('_subject', 'New calculator lead: ' + nameI.value.trim());

      btn.disabled = true;
      status.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) console.error('[Calculator] The email service answered with status ' + r.status + '. Check formEndpoint in config.js.');
        })
        .catch(function (err) {
          console.error('[Calculator] Could not reach the email service. Check formEndpoint in config.js.', err);
        })
        .then(function () { btn.disabled = false; finish(); });
    });

    function finish() {
      status.textContent = '';
      save(UNLOCK_KEY, '1');
      showUnlocked(true);
    }
  }

  // ---- Config-driven text ----------------------------------------------
  function applyConfig() {
    var cta = CONFIG.cta || {};
    if (cta.heading) $('cta-heading').textContent = cta.heading;
    $('cta-text').textContent = cta.text || '';
    var btn = $('cta-button');
    if (cta.buttonText) btn.textContent = cta.buttonText;
    if (cta.buttonUrl) btn.href = cta.buttonUrl; else btn.hidden = true;
    var list = $('ebook-list');
    (CONFIG.ebooks || []).forEach(function (b) {
      if (!b || !b.title || !b.url) return;
      var li = el('li');
      var a = el('a', { href: b.url, target: '_blank', rel: 'noopener' }, b.title);
      li.appendChild(a);
      list.appendChild(li);
      list.hidden = false;
    });
    if (CONFIG.brandName) $('brand').textContent = CONFIG.brandName;
    if (CONFIG.consentText) $('consent-label').textContent = CONFIG.consentText;
    var p = $('privacy-line');
    if (CONFIG.privacyText != null) p.textContent = CONFIG.privacyText;
    if (CONFIG.privacyUrl) {
      p.textContent = (CONFIG.privacyText ? CONFIG.privacyText + ' ' : '');
      p.appendChild(el('a', { href: CONFIG.privacyUrl, target: '_blank', rel: 'noopener' }, 'Privacy policy'));
    }
  }

  // ---- Tell the parent page our height (for iframe embeds) ---------------
  // Any host page can listen for this message and resize its iframe.
  // See README.md, "Embed it in Wix".
  function setupHeightReporting() {
    if (window.parent === window) return;
    document.documentElement.classList.add('in-iframe');
    var last = 0;
    function send() {
      var h = Math.ceil(document.documentElement.scrollHeight);
      if (h === last) return;
      last = h;
      window.parent.postMessage({ type: 'agritourism-calculator:height', height: h }, '*');
    }
    if ('ResizeObserver' in window) new ResizeObserver(send).observe(document.body);
    window.addEventListener('load', send);
    window.addEventListener('resize', send);
    send();
  }

  // ---- Phone-only running total bar ---------------------------------------
  function setupMiniTotal() {
    var bar = $('mini-total');
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      bar.hidden = entries[0].isIntersecting || entries[0].boundingClientRect.top < 0;
    }).observe($('results'));
  }

  // ---- Start --------------------------------------------------------------
  applyConfig();
  buildStreams();
  setupForm();
  update();
  if (unlocked) showUnlocked(false);
  setupMiniTotal();
  setupHeightReporting();
})();
