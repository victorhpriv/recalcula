(function () {
  var appUrl = (window.SALDO_APP_URL || '').replace(/\/$/, '');

  // Links para o app (Entrar / Criar conta)
  document.querySelectorAll('[data-app]').forEach(function (a) {
    a.setAttribute('href', appUrl + a.getAttribute('data-app'));
  });

  // Ano no rodapé
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Borda do menu ao rolar
  var nav = document.getElementById('nav');
  var onScroll = function () { nav && nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
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

  // Animação de entrada
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
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
