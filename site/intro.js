// klerk marketing page: the opening sun. The page starts with one detailed sun on an empty screen. A tap sends it
// to the hero, where it shrinks into the plain terracotta ball behind the klerk mark. Without this script (or with a
// deep link such as #contact) the page opens as before.
(() => {
  const root = document.documentElement;
  if (location.hash && location.hash !== '#top') return;
  root.classList.add('intro');

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };

  // The sun is drawn in a 400 x 400 box. The disc is 96 units across a radius, so it fills 48% of the box.
  const DISC = 96;
  const BOX = 400;
  function drawSun() {
    const svg = el('svg', { viewBox: `0 0 ${BOX} ${BOX}`, class: 'sun-art', 'aria-hidden': 'true', focusable: 'false' });
    const defs = el('defs', {}, svg);
    const body = el('radialGradient', { id: 'sunBody', cx: '36%', cy: '32%', r: '78%' }, defs);
    el('stop', { offset: '0', class: 'st-light' }, body);
    el('stop', { offset: '.5', class: 'st-mid' }, body);
    el('stop', { offset: '1', class: 'st-deep' }, body);
    const clip = el('clipPath', { id: 'sunClip' }, defs);
    el('circle', { cx: 200, cy: 200, r: DISC }, clip);
    // Halftone dots, the brand's own texture (the bloom artwork): a lattice that grows toward the shaded side.
    const dots = el('g', { class: 'sun-dots', 'clip-path': 'url(#sunClip)' }, svg);
    const step = 11;
    for (let y = 100; y <= 300; y += step) {
      for (let x = 100 - (((y - 100) / step) % 2) * (step / 2); x <= 300; x += step) {
        const dx = x - 200, dy = y - 200;
        const shade = Math.max(0, (dx * 0.62 + dy * 0.78) / DISC + 0.25); // 0 on the lit corner, 1+ on the far edge
        const r = Math.min(4.2, shade * 3.6);
        if (r > 0.5) el('circle', { cx: x, cy: y, r: r.toFixed(2) }, dots);
      }
    }
    // Outer rings: thin, with the second one a dotted ring.
    const rings = el('g', { class: 'sun-rings' }, svg);
    el('circle', { cx: 200, cy: 200, r: 118, class: 'ring' }, rings);
    el('circle', { cx: 200, cy: 200, r: 130, class: 'ring ring-dots' }, rings);
    // Long and short rays, each set turning slowly the opposite way.
    const long = el('g', { class: 'rays rays-long' }, svg);
    for (let i = 0; i < 16; i++) {
      el('path', { d: 'M196 70 L200 30 L204 70 Z', transform: `rotate(${i * 22.5} 200 200)` }, long);
    }
    const short = el('g', { class: 'rays rays-short' }, svg);
    for (let i = 0; i < 48; i++) {
      const long2 = i % 3 === 0;
      el('rect', { x: 199, y: long2 ? 56 : 62, width: 2, height: long2 ? 12 : 7, rx: 1, transform: `rotate(${i * 7.5 + 3.75} 200 200)` }, short);
    }
    // The disc on top, then the mark's cross engraved in it.
    el('circle', { cx: 200, cy: 200, r: DISC, class: 'disc' }, svg);
    const dotsAbove = dots.cloneNode(true);
    dotsAbove.classList.add('sun-dots-top');
    svg.append(dotsAbove);
    dots.remove();
    el('path', { class: 'cross', d: 'M193 174h14v19h19v14h-19v19h-14v-19h-19v-14h19z' }, svg);
    return svg;
  }

  function build() {
    const layer = document.createElement('button');
    layer.type = 'button';
    layer.className = 'intro-layer';
    layer.setAttribute('aria-label', 'ورود به سایت کلرک');
    const sun = document.createElement('span');
    sun.className = 'intro-sun';
    sun.append(drawSun());
    layer.append(sun);
    document.body.prepend(layer);

    const heroSun = document.querySelector('.hero-stage .sun');
    root.classList.add('intro-pending'); // the hero's own sun waits, hidden, for the handoff
    let going = false;

    const finish = () => {
      layer.remove();
      root.classList.remove('intro', 'intro-pending', 'intro-go');
      heroSun?.classList.add('landed');
      root.classList.add('mark-ready');
    };

    const go = () => {
      if (going) return;
      going = true;
      layer.classList.add('is-leaving');
      root.classList.add('intro-go'); // the page behind starts to appear and its entrances run
      root.classList.remove('intro');
      if (!heroSun || still) {
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: still ? 1 : 500, fill: 'forwards' }).finished.then(finish);
        return;
      }
      layer.classList.add('is-simplifying'); // CSS fades rays, rings, dots and the cross while it travels
      const from = sun.getBoundingClientRect(); // the full art box
      const to = heroSun.getBoundingClientRect();
      const scale = to.width / (from.width * (DISC * 2 / BOX));
      // Physics: the sun is a planet. It spirals in and circles the mark on a tilted orbit, so one half of every
      // lap passes in front of the mark (the near side, below its centre) and the other half behind it (the far
      // side, above). A copy of the mark sits above the sun while it flies; the sun swaps between the layers under
      // and over that copy as it crosses the near and far sides. It comes to rest on the far side, which is where
      // the page keeps its ball. The last frame matches the page, so the swap at the end is invisible.
      const stage = heroSun.parentElement.getBoundingClientRect();
      const markEl = document.querySelector('.hero-mark');
      const mw = parseFloat(getComputedStyle(markEl).width);
      const C = { x: stage.left + stage.width / 2, y: stage.top + stage.height / 2 };
      const copy = markEl.cloneNode(true);
      copy.setAttribute('class', 'mark mark-copy');
      copy.setAttribute('width', mw); copy.setAttribute('height', mw);
      copy.style.left = `${C.x - mw / 2}px`; copy.style.top = `${C.y - mw / 2}px`;
      copy.style.width = `${mw}px`; copy.style.height = `${mw}px`;
      layer.append(copy);
      copy.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });

      const k = 0.5; // how far the orbit is tilted: 1 is a flat circle seen from above, 0 an edge-on line
      const TAU = Math.PI * 2;
      const restX = to.left + to.width / 2 - C.x, restY = to.top + to.height / 2 - C.y;
      const startX = from.left + from.width / 2 - C.x, startY = from.top + from.height / 2 - C.y;
      const R = Math.hypot(restX, restY / k);         // the orbit's size at rest
      const thR = Math.atan2(restY / k, restX);       // where on the orbit the ball rests
      const rho0 = Math.hypot(startX, startY / k);    // where the spiral starts
      const th0 = Math.atan2(startY / k, startX);
      const mod = (v) => ((v % TAU) + TAU) % TAU;
      const sweep = mod(thR - th0) + TAU; // one full lap more than the shortest way round
      const T = 3600;
      const smooth = (p) => p * p * p * (p * (6 * p - 15) + 10);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / T);
        const e = smooth(p);
        const rho = R * Math.pow(rho0 / R, 1 - e);    // the radius shrinks evenly, like a falling orbit
        const th = th0 + sweep * (1 - Math.pow(1 - e, 1.6)); // it turns fastest early and settles gently
        const near = Math.sin(th);                     // > 0: below the mark's centre, in front of it
        const depth = 1 + 0.16 * near * (1 - e);       // nearer looks bigger, farther smaller, none at rest
        const sc = Math.exp(Math.log(scale) * e) * depth;
        const x = C.x + rho * Math.cos(th) - (from.left + from.width / 2);
        const y = C.y + k * rho * Math.sin(th) - (from.top + from.height / 2);
        sun.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
        sun.style.zIndex = p >= 1 || near < 0 ? '1' : '3';
        if (p < 1) requestAnimationFrame(tick); else finish();
      };
      sun.style.position = 'relative';
      requestAnimationFrame(tick);
    };
    layer.addEventListener('click', go);
  }

  document.addEventListener('DOMContentLoaded', build);
})();
