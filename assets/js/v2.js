'use strict';

document.documentElement.classList.add('js');

// Sticky nav background after scrolling
const nav = document.querySelector('[data-nav]');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Highlight the nav link of the section in view
const navLinks = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

// Cursor spotlight on cards
document.querySelectorAll('.spot').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Subtle 3D tilt on the portrait (pointer devices only)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tilt = document.querySelector('.tilt');
if (tilt && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  tilt.addEventListener('pointermove', (e) => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  });
  tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
}

// Copy email
const copyBtn = document.querySelector('[data-copy]');
if (copyBtn) {
  const hint = copyBtn.querySelector('.copy-hint');
  copyBtn.addEventListener('click', async () => {
    const email = copyBtn.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
      hint.textContent = 'Copied ✓';
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setTimeout(() => { hint.textContent = 'Copy'; }, 1800);
  });
}

// Demos: read-only list from the existing videos API; section stays hidden if empty
const demos = document.querySelector('[data-demos]');
const demosList = document.querySelector('[data-demos-list]');
if (demos && demosList) {
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };
  fetch('/api/videos')
    .then((res) => (res.ok ? res.json() : []))
    .then((videos) => {
      if (!Array.isArray(videos) || !videos.length) return;
      demosList.innerHTML = videos.map((v) => {
        const media = v.kind === 'image'
          ? `<img src="${esc(v.embed_url)}" alt="${esc(v.title)}" loading="lazy">`
          : `<iframe src="${esc(v.embed_url)}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        return `<li><div class="demo-frame">${media}</div><h3>${esc(v.title)}</h3></li>`;
      }).join('');
      demos.hidden = false;
      demos.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
    })
    .catch(() => {});
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();
