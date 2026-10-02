// UI behaviour: active nav link, active "what I do" layer (drives the 3D stack),
// scroll reveals, chart draw-in and the stat count-up.
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.KK = window.KK || { activeLayer: -1 };

  // --- Ambient background glows, moved by scroll position (one rAF per frame at most) ---
  const ambient = document.createElement('div');
  ambient.className = 'ambient';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = '<i></i><i></i>';
  document.body.prepend(ambient);
  if (!reduceMotion) {
    let ticking = false;
    const setScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      document.documentElement.style.setProperty('--scroll', max > 0 ? (scrollY / max).toFixed(3) : 0);
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(setScroll); } }, { passive: true });
    setScroll();
  }

  // --- Nav height as a CSS variable, so sticky elements sit flush under the (wrapping) nav ---
  const nav = document.querySelector('.nav');
  if (nav) {
    const setNavH = () => document.documentElement.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
    setNavH();
    if ('ResizeObserver' in window) new ResizeObserver(setNavH).observe(nav);
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // --- Benchmark numbers (js/listing-benchmark.js), rounded so copy never goes stale ---
  const B = window.LC_BENCH;
  if (B) {
    const val = {
      count: `${(Math.floor(B.n / 100) * 100).toLocaleString('en-US')}+`,
      median: String(B.medianTotal), p90: String(B.p90Total), max: String(B.maxTotal),
      snapshot: new Date(`${B.snapshot}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    };
    Object.entries(B.stats || {}).forEach(([k, v]) => { val[`stat-${k}`] = `${v}%`; });
    (B.dimMedian || []).forEach((v, i) => { val[`dim-${i}`] = `${v}/10`; });
    document.querySelectorAll('[data-bench]').forEach((el) => {
      const v = val[el.dataset.bench];
      if (!v) return;
      if (el.classList.contains('proof-num')) el.innerHTML = `<span data-count="${parseInt(v, 10)}">${parseInt(v, 10)}</span>%`;
      else el.textContent = v;
      if (el.classList.contains('dim-med')) el.style.setProperty('--v', parseFloat(v) / 10);
    });
  }

  // Everything below needs IntersectionObserver; without it, content simply shows unanimated.
  if (!('IntersectionObserver' in window)) return;

  // --- Active nav link (in-page sections only) ---
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (links.length) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const a = byId.get(e.target.id);
          if (!a) return;
          if (e.isIntersecting) {
            links.forEach((l) => l.removeAttribute('aria-current'));
            a.setAttribute('aria-current', 'true');
          } else if (a.getAttribute('aria-current')) {
            a.removeAttribute('aria-current');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    byId.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // --- Layers: one active at a time ---
  const layers = [...document.querySelectorAll('.layer')];
  if (layers.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = Number(e.target.dataset.layer);
          layers.forEach((l, j) => l.classList.toggle('is-active', i === j));
          window.KK.activeLayer = i;
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    layers.forEach((l) => io.observe(l));
  }

  // --- Reveal on scroll (cards, chart) ---
  const reveals = document.querySelectorAll('.reveal');
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        revealIO.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
  );
  reveals.forEach((el, i) => {
    el.style.transitionDelay = reduceMotion ? '0s' : `${(i % 4) * 70}ms`;
    revealIO.observe(el);
  });
  window.KK.reveal = true; // the inline <head> check un-hides everything if this never runs

  // --- Count-up for [data-count] ---
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) return;
    el.textContent = '1';
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min(1, (now - t0) / 1200);
        el.textContent = String(Math.max(1, Math.round(target * (1 - Math.pow(1 - t, 3)))));
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    }).observe(el);
  });
})();
