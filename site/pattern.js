// klerk marketing page: the background. A lattice of small dots in brick rows (the bloom artwork's halftone). A slow
// wave grows dots into plus signs (the mark's cross); a few crests turn terracotta. The wave moves with time and with
// the scroll, and the dots near a pointer swell. One fixed canvas behind the page, so it shows from top to bottom
// wherever a section has no fill of its own. Under reduced motion it is drawn once and stays still.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas');
  cv.className = 'bg-pattern';
  cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0, dpr = 1, sp = 52;
  let accent = '#376746', terra = '#c8664a';
  const mouse = { x: -999, y: -999, on: false };
  let last = 0;

  const colours = () => {
    const cs = getComputedStyle(document.documentElement);
    accent = cs.getPropertyValue('--accent').trim() || accent;
    terra = cs.getPropertyValue('--terra').trim() || terra;
  };
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sp = W < 640 ? 40 : 54;
  };
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

  const draw = (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    const sy = scrollY;
    const rowH = sp * 0.866;
    const rows = Math.ceil(H / rowH) + 3;
    const cols = Math.ceil(W / sp) + 2;
    // the lattice rides the scroll a little slower than the page
    const j0 = Math.floor((sy * 0.12) / rowH);
    for (let r = -1; r < rows; r++) {
      const jj = r + j0; // lattice row, stable while it scrolls
      const y = r * rowH - ((sy * 0.12) % rowH);
      for (let c = -1; c < cols; c++) {
        const x = c * sp + (jj & 1 ? sp / 2 : 0);
        // Two slow waves crossing; scroll shifts the first so scrolling sweeps the pattern.
        const w1 = Math.sin((x * 0.9 + y * 0.45 + sy * 0.55) / 210 - t * 0.5);
        const w2 = Math.sin((x * 0.3 - y * 0.8) / 260 + t * 0.32);
        let v = 0.5 + 0.5 * (w1 * 0.62 + w2 * 0.38);
        if (mouse.on) {
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          if (d < 170) v = Math.min(1, v + (1 - d / 170) * 0.55);
        }
        const k = Math.max(0, (v - 0.4) / 0.6);
        const arm = 6.2 * k * k;
        const h = hash(c + (jj & 1) * 0.5, jj);
        const warm = v > 0.82 && h > 0.55 && Math.sin(t * 0.25 + h * 40) > 0.35; // terracotta stays rare
        ctx.strokeStyle = warm ? terra : accent;
        ctx.globalAlpha = 0.1 + v * 0.2 + (warm ? 0.08 : 0);
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
        ctx.stroke();
        if (arm < 0.4) { // a plain dot where the wave is low
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath(); ctx.arc(x, y, 0.9 + v * 1.4, 0, 6.2832); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const loop = (ms) => {
    requestAnimationFrame(loop);
    if (document.hidden || ms - last < 33) return; // about 30 frames a second is plenty for a slow wave
    last = ms;
    draw(ms / 1000);
  };

  const start = () => {
    document.body.prepend(cv);
    colours(); size();
    draw(2);
    if (still) {
      addEventListener('resize', () => { size(); draw(2); });
      addEventListener('scroll', () => draw(2), { passive: true });
      return;
    }
    requestAnimationFrame(loop);
    addEventListener('resize', size);
    addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; } }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.on = false; });
    cv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, easing: 'ease-out' });
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colours(); if (still) draw(2); });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
