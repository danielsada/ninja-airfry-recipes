/* Ninja Speedi Guide: cook-chart filter (views/charts.html) and Speedi Meal builder (views/builder.html).
   State lives in the URL (?q= and #function on the charts, ?base=&protein=&veg= in the builder) so links can be shared. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var replaceURL = function (u) {
    if (u !== location.pathname + location.search + location.hash) history.replaceState(null, '', u);
  };

  /* ---------- Cook charts ---------- */
  var charts = $('[data-charts]');
  if (charts) {
    var input = $('#chart-q', charts), sel = $('#chart-sel', charts), status = $('#chart-status', charts);
    var empty = $('#chart-empty', charts), clear = $('.win__status [data-reset]', charts);
    var links = $$('.show a[data-mode]', charts), groups = $$('tbody[data-mode]', charts);
    var total = +charts.getAttribute('data-total');
    var mode = '';
    var timer;

    /* every word typed must match the start of a word in the food's name, category or prep */
    var matches = function (q, tokens) {
      if (!tokens.length) return true;
      var words = q.split(/[^a-z0-9°]+/);
      return tokens.every(function (t) { return words.some(function (w) { return w.indexOf(t) === 0; }); });
    };

    var apply = function () {
      var raw = input.value.trim();
      var tokens = raw.toLowerCase().split(/[^a-z0-9°]+/).filter(Boolean);
      var shown = 0;
      groups.forEach(function (g) {
        var inMode = !mode || g.getAttribute('data-mode') === mode, any = 0;
        $$('tr[data-q]', g).forEach(function (tr) {
          var ok = inMode && matches(tr.getAttribute('data-q'), tokens);
          tr.hidden = !ok;
          if (ok) any++;
        });
        g.hidden = !any;
        shown += any;
      });
      links.forEach(function (a) {
        if (a.getAttribute('data-mode') === mode) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      if (sel) sel.value = mode;
      var filtered = !!(mode || tokens.length);
      var label = mode ? $('a[data-mode="' + mode + '"] span', charts).textContent : '';
      var text = shown + (shown === 1 ? ' food' : ' foods');
      if (filtered) text = shown + ' of ' + total + ' foods' + (label ? ' · ' + label : '') + (raw ? ' matching “' + raw + '”' : '');
      status.textContent = text;
      empty.hidden = shown > 0;
      clear.hidden = !filtered;
      charts.classList.toggle('is-filtered', filtered);
    };

    var syncURL = function () {
      var p = new URLSearchParams(location.search);
      if (input.value.trim()) p.set('q', input.value.trim()); else p.delete('q');
      var qs = p.toString();
      replaceURL(location.pathname + (qs ? '?' + qs : '') + (mode ? '#' + mode : ''));
    };

    var setMode = function (m, push) {
      mode = m || '';
      apply();
      if (push) syncURL();
    };

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        setMode(a.getAttribute('data-mode'), true);
        $('#charts-h').focus({ preventScroll: true });
        charts.scrollIntoView({ block: 'start' });
      });
    });
    if (sel) sel.addEventListener('change', function () { setMode(sel.value, true); });
    input.addEventListener('input', function () {
      apply();
      clearTimeout(timer);
      timer = setTimeout(syncURL, 400);
    });
    $$('[data-reset]', charts).forEach(function (b) {
      b.addEventListener('click', function () { input.value = ''; setMode('', true); input.focus(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === 'Escape' && document.activeElement === input && input.value) { input.value = ''; apply(); syncURL(); }
    });

    var restore = function () {
      input.value = new URLSearchParams(location.search).get('q') || '';
      var h = decodeURIComponent(location.hash.slice(1));
      mode = groups.some(function (g) { return g.getAttribute('data-mode') === h; }) ? h : '';
      apply();
    };
    window.addEventListener('hashchange', restore);
    window.addEventListener('pageshow', restore);
    restore();
  }

  /* ---------- Speedi Meal builder ---------- */
  var builder = $('[data-builder]');
  if (builder) {
    var data = JSON.parse($('#meal-data', builder).textContent);
    var form = $('#meal-form', builder), out = $('#meal-out', builder);
    var byId = function (list, id) { return (list || []).filter(function (x) { return x.id === id; })[0]; };
    var range = function (a, b) { return b && b !== a ? a + '–' + b : String(a); };
    var lc = function (s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); };
    var list = function (xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; };

    /* 1.75 → "1 3/4", 0.5 → "1/2": kitchen fractions, like the quick start guide */
    var FR = [[0, ''], [0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4'], [0.875, '7/8'], [1, '']];
    var fmt = function (n) {
      var w = Math.floor(n + 1e-9), f = n - w, best = FR[0];
      FR.forEach(function (x) { if (Math.abs(x[0] - f) < Math.abs(best[0] - f)) best = x; });
      if (best[0] === 1) { w += 1; best = FR[0]; }
      return (w ? w + (best[1] ? ' ' : '') : '') + best[1] || '0';
    };
    var amount = function (a, k) {
      var n = a.qty * k;
      return fmt(n) + ' ' + (n <= 1 ? a.unit : a.units) + (a.what ? ' ' + a.what : '') + (a.detail ? ', ' + a.detail : '') + (a.prep ? ', ' + a.prep : '');
    };

    var read = function () {
      return {
        base: form.base.value,
        protein: form.protein.value,
        veg: $$('input[name=veg]:checked', form).map(function (c) { return c.value; }),
        at: form.vegat.value,
        serves: form.serves.value
      };
    };
    var write = function (s) {
      if (byId(data.bases, s.base)) form.base.value = s.base;
      if (byId(data.proteins, s.protein)) form.protein.value = s.protein;
      $$('input[name=veg]', form).forEach(function (c) { c.checked = s.veg.indexOf(c.value) >= 0; });
      form.vegat.value = s.at === 'tray' ? 'tray' : 'base';
      form.serves.value = s.serves === 'half' ? 'half' : 'full';
    };
    var fromURL = function (search) {
      var p = new URLSearchParams(search);
      return { base: p.get('base') || '', protein: p.get('protein') || '', veg: (p.get('veg') || '').split(',').filter(Boolean), at: p.get('at') || '', serves: p.get('serves') || '' };
    };
    var toQuery = function (s) {
      var p = new URLSearchParams();
      p.set('base', s.base);
      p.set('protein', s.protein);
      if (s.veg.length) p.set('veg', s.veg.join(','));
      if (s.veg.length && s.at === 'tray') p.set('at', 'tray');
      if (s.serves === 'half') p.set('serves', 'half');
      return '?' + p.toString();
    };

    var render = function () {
      var s = read();
      var base = byId(data.bases, s.base), protein = byId(data.proteins, s.protein);
      if (!base || !protein) { out.innerHTML = ''; return; }
      var veg = s.veg.map(function (id) { return byId(data.vegetables, id); }).filter(Boolean);
      var half = s.serves === 'half', k = half ? 0.5 : 1;
      var inBase = veg.filter(function (v) { return s.at !== 'tray' || v.base_only; });
      var onTray = veg.filter(function (v) { return inBase.indexOf(v) < 0; });
      var trayStart = onTray.filter(function (v) { return !v.delicate; });
      var trayLate = onTray.filter(function (v) { return v.delicate; });
      var name = function (v) { return esc(lc(v.name)); };

      /* frozen vegetables in a rice base: half a cup less liquid, for fluffier rice */
      var liquid = (base.liquid || []).map(function (l) { return { qty: l.qty * k, unit: l.unit, units: l.units, what: l.what }; });
      var lessLiquid = base.rice && liquid.length && inBase.some(function (v) { return v.frozen; });
      if (lessLiquid) liquid[0].qty = Math.max(liquid[0].qty - 0.5, 0.25);
      var liquidText = liquid.length ? liquid.map(function (l) { return esc(amount(l, 1)); }) : [esc(base.liquid_text || 'no liquid')];

      var temp = protein.temp_f || data.temp_default_f;
      var time = range(data.time_min, data.time_max);

      var need = [];
      need.push('<li><b>' + esc(amount(base.amount, k)) + '</b></li>');
      liquid.forEach(function (l) { need.push('<li><b>' + esc(amount(l, 1)) + '</b></li>'); });
      veg.forEach(function (v) { need.push('<li>' + esc(amount(v.amount, k)) + '</li>'); });
      need.push('<li><b>' + esc(amount(protein.amount, k)) + '</b>' + (protein.prep ? ', ' + esc(protein.prep) : '') + '</li>');
      need.push('<li>' + esc(data.oil) + ' and your seasoning</li>');
      if (half) need.push('<li>A sheet of foil for the tray</li>');

      var steps = [];
      steps.push('Put the ' + esc(base.amount.what) + ' and ' + list(liquidText) + ' in the bottom of the pot' +
        (inBase.length ? ', add the ' + list(inBase.map(name)) : '') + ' and stir.' +
        (base.pasta ? ' The pasta should be covered; if it isn’t, add 1/4 cup more liquid.' : ''));
      steps.push('Set the Crisper Tray in the <b>elevated position</b> (legs out), above the base.' + (half ? ' Cover it with foil to protect the base.' : ''));
      steps.push('Toss the ' + name(protein) + (trayStart.length ? ' and the ' + list(trayStart.map(name)) : '') +
        ' with oil and seasoning and spread ' + (trayStart.length ? 'them' : 'it') + ' on the tray in one layer.');
      steps.push('Close the lid and flip the SmartSwitch to <b>Rapid Cooker</b>. Select <b>Speedi Meals</b>, set <b>' + temp + '°F</b> and <b>' + time + ' minutes</b>, then press Start/Stop.');
      steps.push('It steams first' + (base.steam ? ' (' + esc(base.steam) + ' minutes)' : '') + ' while the display shows progress bars, then the timer counts down while it crisps.');
      if (trayLate.length) steps.push('With 5–7 minutes left, open the lid, add the ' + list(trayLate.map(name)) + ' to the tray, close it and let it finish.');
      if (protein.done_f) steps.push('Check the ' + name(protein) + ' reach <b>' + protein.done_f + '°F</b> inside. If not, give them a few more minutes.');
      steps.push('Lift out the tray, stir the base and serve.');

      var notes = [];
      if (lessLiquid) notes.push('Frozen vegetables release water, so this uses 1/2 cup less liquid than the chart for a fluffier base.');
      if (base.note) notes.push(esc(base.note));
      data.notes.forEach(function (n, i) { if (i > 0 || half) notes.push(esc(n)); });

      out.innerHTML =
        '<div class="stats">' +
          '<div><span class="ph">Function</span><b>Speedi Meals</b></div>' +
          '<div><span class="ph">Temp</span><b>' + temp + '°F</b></div>' +
          '<div><span class="ph">Time</span><b>' + time + ' min</b></div>' +
        '</div>' +
        '<h2 class="ph">You’ll need</h2><ul class="need">' + need.join('') + '</ul>' +
        '<h2 class="ph">Steps</h2><ol class="steps">' + steps.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
        '<ul class="notes">' + notes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        '<p class="share"><a class="go" href="' + esc(toQuery(s)) + '">Link to this meal</a></p>';
    };

    var update = function () { render(); replaceURL(location.pathname + toQuery(read())); };
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('a[data-preset]', builder).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var cur = read(), p = fromURL(a.getAttribute('href'));
        p.at = cur.at; p.serves = cur.serves;
        write(p);
        update();
      });
    });
    var start = function () { write(fromURL(location.search)); render(); };
    window.addEventListener('pageshow', start);
    start();
  }
})();