(function () {
  'use strict';
  var appUrl = (window.SALDO_APP_URL || '').replace(/\/$/, '');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        void form.offsetWidth; // reinicia a animação
        form.classList.add('invalid');
        input.focus();
        return;
      }
      var url = appUrl + '/cadastro' + (email ? '?email=' + encodeURIComponent(email) : '');
      window.location.href = url;
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

  // ---------- marquee contínuo: duplica os itens ----------
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });

  // ---------- rolagem: borda do menu, inclinação da vitrine e CTA fixo ----------
  var showcase = document.querySelector('[data-tilt]');
  var browser = showcase && showcase.querySelector('.browser');
  var hero = document.querySelector('.hero');
  var sticky = document.getElementById('stickyCta');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 8);

    if (browser && !reduceMotion && window.innerWidth > 760) {
      var rect = showcase.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 quando a vitrine entra pela base da tela, 1 quando chega a ~30% do topo
      var p = Math.min(Math.max((vh - rect.top) / (vh * 0.7), 0), 1);
      browser.style.setProperty('--tilt', (12 * (1 - p)).toFixed(2) + 'deg');
      browser.style.setProperty('--scale', (0.96 + 0.04 * p).toFixed(3));
    }

    if (sticky && hero) {
      var heroBottom = hero.getBoundingClientRect().bottom;
      var nearEnd = window.innerHeight + y > document.body.scrollHeight - 280;
      sticky.classList.toggle('show', heroBottom < 0 && !nearEnd);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---------- paralaxe dos ícones 3D com o mouse ----------
  if (showcase && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var floats = showcase.querySelectorAll('[data-depth]');
    showcase.addEventListener('pointermove', function (e) {
      var r = showcase.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      floats.forEach(function (el) {
        var d = Number(el.getAttribute('data-depth')) || 0;
        el.style.setProperty('--px', (dx * d).toFixed(1) + 'px');
        el.style.setProperty('--py', (dy * d).toFixed(1) + 'px');
      });
    });
    showcase.addEventListener('pointerleave', function () {
      floats.forEach(function (el) { el.style.setProperty('--px', '0px'); el.style.setProperty('--py', '0px'); });
    });
  }

  // ---------- luz que segue o mouse nos cards de recursos ----------
  document.querySelectorAll('[data-spotlight] .feature').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ---------- FAQ: só uma resposta aberta por vez ----------
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  // ---------- revelação ao rolar ----------
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
