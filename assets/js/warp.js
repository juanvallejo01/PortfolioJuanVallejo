'use strict';

(function () {
  const canvas = document.getElementById('warp-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colors = [
    { r: 255, g: 255, b: 255 }, // white
    { r: 255, g: 209, b: 102 }, // orange-yellow-crayola
    { r: 255, g: 166, b: 43 },  // deeper orange
  ];

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const blobCount = 5;
  const blobs = Array.from({ length: blobCount }, (_, i) => ({
    color: colors[i % colors.length],
    baseX: Math.random(),
    baseY: Math.random(),
    ax: 0.25 + Math.random() * 0.25,
    ay: 0.25 + Math.random() * 0.25,
    fx: 0.15 + Math.random() * 0.15,
    fy: 0.15 + Math.random() * 0.15,
    phase: Math.random() * Math.PI * 2,
    radius: 0.28 + Math.random() * 0.18,
    alpha: 0.35 + Math.random() * 0.2,
  }));

  function drawFrame(t) {
    ctx.clearRect(0, 0, width, height);

    const minDim = Math.min(width, height);

    blobs.forEach((blob) => {
      const x = (blob.baseX + Math.sin(t * blob.fx + blob.phase) * blob.ax) * width;
      const y = (blob.baseY + Math.cos(t * blob.fy + blob.phase) * blob.ay) * height;
      const r = blob.radius * minDim;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      const { r: cr, g: cg, b: cb } = blob.color;
      gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${blob.alpha})`);
      gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let rafId = null;

  function loop(now) {
    drawFrame(now / 8000);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    if (prefersReducedMotion) {
      drawFrame(0);
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resize();
    if (prefersReducedMotion) drawFrame(0);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!prefersReducedMotion && !rafId) {
      rafId = requestAnimationFrame(loop);
    }
  });

  start();
})();
