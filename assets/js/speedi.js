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
    var crumbF = $('#crumb-f', charts), crumbPage = $('#crumb-page', charts);
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
      if (crumbF) {
        crumbF.hidden = !mode;
        crumbF.firstChild.textContent = label;
        if (mode) crumbPage.removeAttribute('aria-current'); else crumbPage.setAttribute('aria-current', 'page');
      }
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

  /* ---------- Speedi Meal builder ----------
     After Ninja Test Kitchen's Speedi Recipe Builder: pick a base (1), protein (1), seasoning (up to 2), vegetables (up to 3)
     and toppings (any); a base and either a protein or a vegetable are required. The recipe is written here from
     data/builder.json, which follows Ninja's Speedi quick start guide. URL: ?base=&protein=&seasoning=a,b&vegetables=…&toppings=…
     (&serves=half) shows the recipe; &edit=1 shows the picks. */
  var builder = $('[data-builder]');
  if (builder) {
    var data = JSON.parse($('#rb-data', builder).textContent);
    var sprite = JSON.parse($('#rb-sprite', builder).textContent);
    var form = $('#rb-form', builder), pick = $('#rb-pick', builder), card = $('#rb-recipe', builder);
    var error = $('#rb-error', builder), go = $('.rb-go', builder), savedBox = $('#rb-saved', builder);
    var STORE = 'speedi.saved';
    var steps = data.steps;
    var stepOf = {};
    steps.forEach(function (s) { stepOf[s.id] = s; });
    var byId = function (list, id) { return (list || []).filter(function (x) { return x.id === id; })[0]; };
    var items = function (step, ids) { return ids.map(function (id) { return byId(data[stepOf[step].key], id); }).filter(Boolean); };
    var range = function (a, b) { return b && b !== a ? a + '–' + b : String(a); };
    var lc = function (s) { return String(s).charAt(0).toLowerCase() + String(s).slice(1); };
    var list = function (xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; };
    var amp = function (xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' & ' + xs[xs.length - 1]; };
    var icon = function (step, id) { return '<svg class="i" aria-hidden="true"><use href="' + esc(sprite) + '#' + stepOf[step].icon + '-' + id + '"/></svg>'; };

    /* 1.75 → "1 3/4", 0.5 → "1/2": kitchen fractions, like the quick start guide */
    var FR = [[0, ''], [0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4'], [0.875, '7/8'], [1, '']];
    var fmt = function (n) {
      var w = Math.floor(n + 1e-9), f = n - w, best = FR[0];
      FR.forEach(function (x) { if (Math.abs(x[0] - f) < Math.abs(best[0] - f)) best = x; });
      if (best[0] === 1) { w += 1; best = FR[0]; }
      return ((w ? w + (best[1] ? ' ' : '') : '') + best[1]) || '0';
    };
    var amount = function (a, k) {
      var n = a.qty * k;
      return fmt(n) + ' ' + (n <= 1 ? a.unit : a.units) + (a.what ? ' ' + a.what : '') + (a.detail ? ', ' + a.detail : '') + (a.prep ? ', ' + a.prep : '');
    };

    /* ----- state <-> form <-> URL ----- */
    var read = function () {
      var s = {};
      steps.forEach(function (st) { s[st.id] = $$('input[name="' + st.id + '"]:checked', form).map(function (c) { return c.value; }); });
      s.serves = state.serves || 'full';
      return s;
    };
    var write = function (s) {
      steps.forEach(function (st) {
        var want = s[st.id] || [];
        if (st.limit) want = want.slice(0, st.limit);
        $$('input[name="' + st.id + '"]', form).forEach(function (c) { c.checked = want.indexOf(c.value) >= 0; });
      });
      sync();
    };
    var fromURL = function (search) {
      var p = new URLSearchParams(search), s = { serves: p.get('serves') === 'half' ? 'half' : 'full', edit: p.has('edit') };
      steps.forEach(function (st) {
        s[st.id] = (p.get(st.id) || '').split(',').filter(function (id) { return byId(data[st.key], id); });
      });
      return s;
    };
    var toQuery = function (s, extra) {
      var p = new URLSearchParams();
      steps.forEach(function (st) { if (s[st.id] && s[st.id].length) p.set(st.id, s[st.id].join(',')); });
      if (s.serves === 'half') p.set('serves', 'half');
      if (extra) p.set(extra, '1');
      var q = p.toString().replace(/%2C/g, ',');
      return q ? '?' + q : '';
    };
    var valid = function (s) { return s.base.length && (s.protein.length || s.vegetables.length); };
    var state = { serves: 'full' };

    /* limits (like the original: once a group is full, the other tiles are disabled), progress flags, ready button */
    var sync = function () {
      var all = true;
      steps.forEach(function (st) {
        var boxes = $$('input[name="' + st.id + '"]', form), on = boxes.filter(function (c) { return c.checked; }).length;
        if (st.limit > 1) boxes.forEach(function (c) { c.disabled = !c.checked && on >= st.limit; });
        var li = $('.rb-progress li[data-for="' + st.id + '"]', form);
        li.classList.toggle('done', on > 0);
        if (!on) all = false;
      });
      go.classList.toggle('ready', all);
    };

    /* ----- the recipe ----- */
    var recipe = function (s) {
      var base = items('base', s.base)[0], protein = items('protein', s.protein)[0];
      var seas = items('seasoning', s.seasoning), veg = items('vegetables', s.vegetables), tops = items('toppings', s.toppings);
      var half = s.serves === 'half', k = half ? 0.5 : 1;
      var inBase = veg.filter(function (v) { return v.place === 'base'; });
      var trayStart = veg.filter(function (v) { return v.place === 'tray'; });
      var trayLate = veg.filter(function (v) { return v.place === 'late'; });
      var onTray = (protein ? [protein] : []).concat(trayStart);
      var tray = onTray.length || trayLate.length;
      var nm = function (x) { return esc(String(x.title || x.name).split(' ').map(function (w) { return /^(Brussels|Italian|Alfredo)$/.test(w) ? w : w.toLowerCase(); }).join(' ')); };

      /* frozen vegetables in a rice base: 1/2 cup less liquid, for a fluffier base (quick start guide) */
      var liquid = (base.liquid || []).map(function (l) { return { qty: l.qty * k, unit: l.unit, units: l.units, what: l.what }; });
      var lessLiquid = base.rice && liquid.length && inBase.some(function (v) { return v.frozen; });
      if (lessLiquid) liquid[0].qty -= 0.5 * k;
      var liquidText = liquid.length ? liquid.map(function (l) { return esc(amount(l, 1)); }) : [esc(base.liquid_text || 'no liquid')];

      var temp = protein ? protein.temp_f : data.temp_default_f;
      var time = range(data.time_min, data.time_max);
      var flavor = seas.map(function (x) { return x.title; }).filter(Boolean);
      var title = (flavor.length ? flavor.join(' ') + ' ' : '') +
        (protein ? protein.title + ' with ' + amp([base.title].concat(veg.map(function (v) { return v.title; }))) : amp(veg.map(function (v) { return v.title; })) + ' with ' + base.title);

      var ing = function (head, rows) { return rows.length ? '<h3 class="ph">' + head + '</h3><ul class="need">' + rows.join('') + '</ul>' : ''; };
      var row = function (step, x, text) { return '<li>' + icon(step, x.id) + '<span>' + text + '</span></li>'; };
      var potRows = [row('base', base, '<b>' + esc(amount(base.amount, k)) + '</b>')]
        .concat(liquid.map(function (l) { return '<li><span class="i-sp"></span><span><b>' + esc(amount(l, 1)) + '</b></span></li>'; }))
        .concat(!liquid.length ? ['<li><span class="i-sp"></span><span>' + esc(base.liquid_text) + '</span></li>'] : [])
        .concat(inBase.map(function (v) { return row('vegetables', v, esc(amount(v.amount, k))); }));
      var trayRows = (protein ? [row('protein', protein, '<b>' + esc(amount(protein.amount, k)) + '</b>')] : [])
        .concat(trayStart.concat(trayLate).map(function (v) { return row('vegetables', v, esc(amount(v.amount, k)) + (v.place === 'late' ? ' <small>(last 5–7 min)</small>' : '')); }));
      var seasRows = ['<li><span class="i-sp"></span><span>' + esc(data.oil) + '</span></li>']
        .concat(seas.map(function (x) { return row('seasoning', x, esc(x.use.charAt(0).toUpperCase() + x.use.slice(1))); }));
      if (!seas.length) seasRows.push('<li><span class="i-sp"></span><span>Salt, pepper or your favorite seasoning</span></li>');
      var topRows = tops.map(function (x) { return row('toppings', x, esc(x.name)); });
      if (half && tray) trayRows.push('<li><span class="i-sp"></span><span>A sheet of foil for the tray</span></li>');

      var stepsOut = [];
      stepsOut.push('Put the ' + esc(base.amount.what) + ' and ' + list(liquidText) + ' in the bottom of the pot' +
        (inBase.length ? ', add the ' + list(inBase.map(nm)) : '') + ' and stir.' +
        (base.pasta ? ' The pasta should be covered; if it isn’t, add 1/4 cup more liquid.' : ''));
      if (tray) stepsOut.push('Set the Crisper Tray in the <b>elevated position</b> (legs out), above the base.' + (half ? ' Cover it with foil to protect the base.' : ''));
      var seasonText = seas.length ? list(seas.map(function (x) { return esc(x.use); })) : 'your seasoning';
      if (onTray.length) stepsOut.push('Toss the ' + list(onTray.map(nm)) + ' with oil and ' + seasonText + ', then spread ' + (onTray.length > 1 || (protein && protein.amount.qty > 1) ? 'them' : 'it') + ' on the tray in one layer.');
      else if (seas.length) stepsOut.push('Stir ' + seasonText + ' into the base.');
      stepsOut.push('Close the lid and flip the SmartSwitch to <b>Rapid Cooker</b>. Select <b>Speedi Meals</b>, set <b>' + temp + '°F</b> and <b>' + time + ' minutes</b>, then press Start/Stop.');
      stepsOut.push('It steams first' + (base.steam ? ' (' + esc(base.steam) + ' minutes)' : '') + ' while the display shows progress bars, then the timer counts down while it crisps.');
      if (trayLate.length) stepsOut.push('With 5–7 minutes left, open the lid, toss the ' + list(trayLate.map(nm)) + ' with a little oil' + (seas.length ? ' and seasoning' : '') + ', add ' + (trayLate.length > 1 ? 'them' : 'it') + ' to the tray, close the lid and let it finish.');
      if (protein && protein.done_f) stepsOut.push('Check the ' + nm(protein) + ' reach <b>' + protein.done_f + '°F</b> inside. If not, give them a few more minutes.');
      stepsOut.push((tray ? 'Lift out the tray and stir the base. ' : 'Stir the base. ') + (base.finish ? esc(base.finish) + ' ' : '') +
        (tops.length ? 'Serve topped with ' + list(tops.map(function (x) { return esc(lc(x.name)); })) + '.' : 'Serve.'));

      var est = [base, protein].concat(veg).filter(function (x) { return x && x.estimate; });
      if (!protein) est.unshift({ name: 'Temperature', estimate: 'Ninja’s chart sets the temperature by protein; without one this uses the Speedi Meals default, ' + data.temp_default_f + '°F.' });
      var notes = [];
      if (lessLiquid) notes.push('Frozen vegetables release water, so this uses ' + fmt(0.5 * k) + ' cup less liquid for fluffier rice.');
      if (half) notes.push('For 1–2 servings everything is halved; the temperature and time stay the same.');
      data.notes.forEach(function (n) { notes.push(esc(n)); });

      return '<header class="recipe__h">' +
          '<p class="kicker">My Speedi recipe</p>' +
          '<h2 id="recipe-h" tabindex="-1">' + esc(title) + '</h2>' +
          '<div class="serves" role="group" aria-label="Servings"><span class="ph">Serves</span>' +
            '<button type="button" class="chip-b" data-serves="full" aria-pressed="' + !half + '">3–4</button>' +
            '<button type="button" class="chip-b" data-serves="half" aria-pressed="' + half + '">1–2</button></div>' +
        '</header>' +
        '<div class="stats">' +
          '<div><span class="ph">Function</span><b>Speedi Meals</b></div>' +
          '<div><span class="ph">Temp</span><b>' + temp + '°F</b></div>' +
          '<div><span class="ph">Time</span><b>' + time + ' min</b><small>' + (base.steam ? '+ ' + esc(base.steam) + ' min steaming' : '+ steaming') + '</small></div>' +
        '</div>' +
        '<div class="recipe__cols">' +
          '<section class="recipe__ing" aria-label="Ingredients"><h2 class="ph">Ingredients</h2>' +
            ing('In the pot', potRows) + ing('On the Crisper Tray', trayRows) + ing('Seasoning', seasRows) + ing('To serve', topRows) +
          '</section>' +
          '<section class="recipe__dir" aria-label="Directions"><h2 class="ph">Directions</h2>' +
            '<ol class="steps">' + stepsOut.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
            '<ul class="notes">' + notes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
            (est.length ? '<details class="est"><summary>' + est.length + ' value' + (est.length > 1 ? 's' : '') + ' not in Ninja’s charts</summary><ul>' +
              est.map(function (x) { return '<li><b>' + esc(x.name) + ':</b> ' + esc(x.estimate) + '</li>'; }).join('') + '</ul></details>' : '') +
          '</section>' +
        '</div>' +
        '<div class="recipe__act">' +
          '<button type="button" class="tool" data-act="copy">' + '<span>Copy link</span></button>' +
          '<button type="button" class="tool" data-act="save"><span>Save recipe</span></button>' +
          '<button type="button" class="tool" data-act="edit">Change ingredients</button>' +
          '<button type="button" class="tool tool--plain" data-act="new">Start over</button>' +
          '<span class="recipe__msg" role="status"></span>' +
        '</div>';
    };

    /* ----- saved recipes (this browser only) ----- */
    var loadSaved = function () { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; } };
    var storeSaved = function (xs) { try { localStorage.setItem(STORE, JSON.stringify(xs)); return true; } catch (e) { return false; } };
    var showSaved = function () {
      var xs = loadSaved();
      savedBox.hidden = !xs.length;
      $('ul', savedBox).innerHTML = xs.map(function (x, i) {
        return '<li><a href="' + esc(location.pathname + x.q) + '">' + esc(x.name) + '</a><button type="button" class="tool tool--plain" data-del="' + i + '" aria-label="Remove ' + esc(x.name) + '">Remove</button></li>';
      }).join('');
    };
    savedBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]');
      if (!b) return;
      var xs = loadSaved(); xs.splice(+b.getAttribute('data-del'), 1); storeSaved(xs); showSaved();
    });

    /* ----- views ----- */
    var pageTitle = document.title, site = pageTitle.split(' · ').slice(-1)[0];
    var crumbRecipe = $('#crumb-recipe', builder), crumbBuilder = $('#crumb-page', builder);
    var show = function (s, focus) {
      state = s;
      write(s);
      var isRecipe = !s.edit && valid(s);
      pick.hidden = isRecipe;
      card.hidden = !isRecipe;
      crumbRecipe.hidden = !isRecipe;
      if (isRecipe) crumbBuilder.removeAttribute('aria-current'); else crumbBuilder.setAttribute('aria-current', 'page');
      if (isRecipe) {
        card.innerHTML = recipe(s);
        document.title = $('#recipe-h', card).textContent + ' · ' + site;
      } else {
        error.hidden = true;
        document.title = pageTitle;
        showSaved();
      }
      if (focus) {
        builder.scrollIntoView({ block: 'start' });
        (isRecipe ? $('#recipe-h', card) : $('#builder-h', builder)).focus({ preventScroll: true });
      }
    };
    var navigate = function (s, extra, focus) {
      history.pushState(null, '', location.pathname + toQuery(s, extra));
      show(fromURL(location.search), focus);
    };

    form.addEventListener('change', function (e) {
      error.hidden = true;
      sync();
      if (state.edit || !valid(state)) replaceURL(location.pathname + toQuery(read(), 'edit'));
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = read();
      if (!valid(s)) { error.hidden = false; error.scrollIntoView({ block: 'nearest' }); return; }
      navigate(s, '', true);
    });
    card.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var msg = $('.recipe__msg', card);
      if (b.hasAttribute('data-serves')) {
        state.serves = b.getAttribute('data-serves');
        replaceURL(location.pathname + toQuery(state));
        show(fromURL(location.search));
        $('[data-serves="' + state.serves + '"]', card).focus();
        return;
      }
      var act = b.getAttribute('data-act');
      if (act === 'copy') {
        var url = location.href;
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { msg.textContent = 'Link copied.'; }, function () { msg.textContent = url; });
        else msg.textContent = url;
      } else if (act === 'save') {
        var xs = loadSaved(), q = toQuery(state), name = $('#recipe-h', card).textContent;
        xs = xs.filter(function (x) { return x.q !== q; });
        xs.unshift({ name: name, q: q });
        msg.textContent = storeSaved(xs.slice(0, 30)) ? 'Saved in this browser.' : 'Couldn’t save in this browser.';
      } else if (act === 'edit') {
        navigate(state, 'edit', true);
      } else if (act === 'new') {
        navigate({ serves: 'full' }, '', true);
      }
    });
    $$('.rb-progress a', form).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var fs = $(a.getAttribute('href'));
        fs.scrollIntoView({ block: 'start', behavior: 'smooth' });
        var first = $('input:not(:disabled)', fs);
        if (first) first.focus({ preventScroll: true });
      });
    });
    window.addEventListener('popstate', function () { show(fromURL(location.search), true); });
    show(fromURL(location.search));
  }
})();