(function () {
  'use strict';
  var appUrl = (window.SALDO_APP_URL || '').replace(/\/$/, '');

  // ---------- links para o app ----------
  document.querySelectorAll('[data-app]').forEach(function (a) {
    a.setAttribute('href', appUrl + a.getAttribute('data-app'));
  });

  // ---------- cadastro rápido: leva o e-mail para a tela de cadastro ----------
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll('[data-signup]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type=email]');
      var email = (input && input.value || '').trim();
      if (email && !EMAIL_RE.test(email)) {
        form.classList.remove('invalid');
        void form.offsetWidth;
        form.classList.add('invalid');
        input.focus();
        return;
      }
      window.location.href = appUrl + '/cadastro' + (email ? '?email=' + encodeURIComponent(email) : '');
    });
    form.addEventListener('animationend', function () { form.classList.remove('invalid'); });
  });

  // ---------- ano no rodapé ----------
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- menu ----------
  var nav = document.getElementById('nav');
  var btn = document.getElementById('menuBtn');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    });
  }

  // ---------- borda do menu ao rolar ----------
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- simulador do mês ----------
  var sim = document.getElementById('sim');
  if (!sim) return;

  var DAYS = 30, W = 360, H = 150, PAD_T = 8, PAD_B = 6;
  var chart = sim.querySelector('.sim-chart');
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function parseMoney(v) {
    var s = String(v || '').replace(/[^\d,.-]/g, '');
    // "1.900,50" -> 1900.50 ; "1900.5" -> 1900.5
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? Math.min(n, 1e7) : 0;
  }
  function fmtInput(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }

  var incomeEl = sim.querySelector('[data-sim=income]');
  var dailyEl = sim.querySelector('[data-sim=daily]');
  var rows = Array.prototype.slice.call(sim.querySelectorAll('.sim-bills tbody tr'));
  var line = document.getElementById('simLine');
  var area = document.getElementById('simArea');
  var zero = document.getElementById('simZero');
  var dots = document.getElementById('simDots');
  var label = document.getElementById('simLabel');
  var value = document.getElementById('simValue');
  var note = document.getElementById('simNote');

  function render() {
    W = Math.max(120, Math.round(chart.clientWidth || 360));
    H = Math.max(100, Math.round(chart.clientHeight || 150));
    chart.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    zero.setAttribute('x2', W);
    var income = parseMoney(incomeEl.value);
    var daily = parseMoney(dailyEl.value);
    var byDay = {};
    rows.forEach(function (r) {
      var day = Math.max(1, Math.min(DAYS, parseInt(r.querySelector('[data-day]').value, 10) || 1));
      byDay[day] = (byDay[day] || 0) + parseMoney(r.querySelector('[data-amount]').value);
    });

    var v = income, rate = daily / DAYS, pts = [], marks = [], min = 0, max = Math.max(income, 1);
    for (var d = 1; d <= DAYS; d++) {
      v -= rate;
      var before = v;
      v -= byDay[d] || 0;
      pts.push([d, before, v]);
      if (byDay[d]) marks.push([d, v]);
      min = Math.min(min, before, v);
    }
    var end = v;
    var x = function (d) { return (d / DAYS) * W; };
    var y = function (val) { return PAD_T + (1 - (val - min) / (max - min || 1)) * (H - PAD_T - PAD_B); };

    var p = 'M0,' + y(income).toFixed(1);
    pts.forEach(function (s) {
      p += ' L' + x(s[0]).toFixed(1) + ',' + y(s[1]).toFixed(1);
      if (s[2] !== s[1]) p += ' L' + x(s[0]).toFixed(1) + ',' + y(s[2]).toFixed(1);
    });
    line.setAttribute('d', p);
    area.setAttribute('d', p + ' L' + W + ',' + H + ' L0,' + H + ' Z');
    var zy = y(0).toFixed(1);
    zero.setAttribute('y1', zy); zero.setAttribute('y2', zy);
    dots.innerHTML = marks.map(function (m) {
      return '<circle class="sim-dot" r="3" cx="' + x(m[0]).toFixed(1) + '" cy="' + y(m[1]).toFixed(1) + '"></circle>';
    }).join('');

    var neg = end < 0;
    sim.classList.toggle('neg', neg);
    label.textContent = neg ? 'Faltam no fim do mês' : 'Sobram no fim do mês';
    value.textContent = brl.format(Math.abs(end));
    if (income <= 0) note.textContent = 'Informe a sua renda';
    else if (neg) {
      var firstNeg = pts.filter(function (s) { return s[2] < 0; })[0];
      note.textContent = 'O saldo fica negativo a partir do dia ' + firstNeg[0];
    } else note.textContent = Math.round((end / income) * 100) + '% da renda';
  }

  sim.addEventListener('input', render);
  sim.addEventListener('focusout', function (e) {
    var t = e.target;
    if (t.matches('[data-amount], [data-sim]')) { var n = parseMoney(t.value); t.value = n ? fmtInput(n) : '0'; }
    if (t.matches('[data-day]')) t.value = Math.max(1, Math.min(28, parseInt(t.value, 10) || 1));
    render();
  });
  window.addEventListener('resize', render, { passive: true });
  render();
})();
