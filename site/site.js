// klerk marketing page. Every piece here is an enhancement: without this script the page still reads in full.
// The class "js" turns on the entrance motion (site.css), so it is added before the body is drawn.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);
  const flash = (el) => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };

  // The printed bill follows the controls under it. Amounts are whole Rial, like in the app.
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (n) => String(n).replace(/\d/g, (d) => FA[d]).replace('.', '٫');
  const state = { name: $('[data-in-name]').value, cur: 'T', disc: 0, qty: 0.5, size: 'a4' };
  const VISIT = 900000;
  const ITEM = 8000000; // one vial, in Rial
  const paper = $('[data-paper]');
  const money = (rial) => (state.cur === 'T' ? `${Math.round(rial / 10).toLocaleString('en-US')} T` : `${rial.toLocaleString('en-US')} R`);
  const render = (changed = []) => {
    const item = Math.round(ITEM * state.qty);
    const disc = Math.round(((VISIT + item) * state.disc) / 100);
    $('[data-out-name]').textContent = state.name.trim() || 'نام کلینیک';
    $('[data-m-visit]').textContent = money(VISIT);
    $('[data-out-qty]').textContent = fa(state.qty);
    $('[data-qty-read]').textContent = fa(state.qty);
    $('[data-m-item]').textContent = money(item);
    $('[data-out-disc-row]').hidden = !disc;
    $('[data-m-disc]').textContent = `−${money(disc)}`;
    $('[data-m-total]').textContent = money(VISIT + item - disc);
    $('[data-out-size]').textContent = state.size === 'a5' ? 'A5' : 'A4';
    paper.classList.toggle('is-a5', state.size === 'a5');
    changed.forEach(flash);
  };
  $('[data-in-name]').addEventListener('input', (e) => { state.name = e.target.value; render([$('[data-out-name]')]); });
  document.querySelectorAll('[data-in-cur]').forEach((r) => r.addEventListener('change', () => { state.cur = r.value; render([...document.querySelectorAll('[data-paper] .m')]); }));
  document.querySelectorAll('[data-in-disc]').forEach((r) => r.addEventListener('change', () => { state.disc = Number(r.value); render([$('[data-m-disc]'), $('[data-m-total]')]); }));
  $('[data-in-qty]').addEventListener('input', (e) => { state.qty = Number(e.target.value); render([$('[data-out-qty]'), $('[data-m-item]'), $('[data-m-total]')]); });
  document.querySelectorAll('[data-in-size]').forEach((r) => r.addEventListener('change', () => { state.size = r.value; render(); }));
  render();

  // The terracotta suns (hero stage, contact block) lean toward the pointer and turn their lit side to face it;
  // a mouse or a finger can grab one and pull it (with growing resistance), and it springs back when let go.
  // Same behaviour as the sun on the app's sign-in page. Skipped under reduced motion: the suns stay still.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still) document.querySelectorAll('.sun').forEach((sun) => {
    const panel = sun.parentElement;
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let grab = null;
    let frame = 0;
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));
    const band = (d, max) => Math.sign(d) * max * (1 - 1 / (Math.abs(d) / max + 1));
    const center = () => {
      const r = sun.getBoundingClientRect();
      return { x: r.left + r.width / 2 - pos.x, y: r.top + r.height / 2 - pos.y };
    };
    const light = (dx, dy) => {
      const d = Math.hypot(dx, dy) || 1;
      sun.style.setProperty('--hx', `${50 + (dx / d) * 24}%`);
      sun.style.setProperty('--hy', `${50 + (dy / d) * 24}%`);
    };
    const step = () => {
      const k = grab ? 0.35 : 0.09;
      const damping = grab ? 0.55 : 0.82;
      for (const a of ['x', 'y']) {
        vel[a] = (vel[a] + (target[a] - pos[a]) * k) * damping;
        pos[a] += vel[a];
      }
      sun.style.translate = `${pos.x.toFixed(2)}px ${pos.y.toFixed(2)}px`;
      const settled = Math.abs(vel.x) + Math.abs(vel.y) < 0.02 && Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) < 0.05;
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const run = () => { if (!frame) frame = requestAnimationFrame(step); };
    const reach = () => Math.min(220, panel.clientWidth * 0.4); // a phone-sized panel gives a shorter pull

    panel.addEventListener('pointermove', (e) => {
      const c = center();
      light(e.clientX - c.x, e.clientY - c.y);
      if (grab) {
        target.x = band(e.clientX - grab.x, reach());
        target.y = band(e.clientY - grab.y, reach());
      } else if (e.pointerType === 'mouse') {
        target.x = clamp((e.clientX - c.x) * 0.06, 22);
        target.y = clamp((e.clientY - c.y) * 0.06, 22);
      }
      run();
    });
    panel.addEventListener('pointerleave', () => {
      if (grab) return;
      target.x = 0; target.y = 0;
      sun.style.removeProperty('--hx'); sun.style.removeProperty('--hy');
      run();
    });
    sun.addEventListener('pointerdown', (e) => {
      grab = { x: e.clientX, y: e.clientY };
      sun.setPointerCapture(e.pointerId);
      sun.classList.add('is-held');
      if (e.pointerType === 'touch') navigator.vibrate?.(8); // a tiny tick on phones that support it
    });
    const release = () => {
      if (!grab) return;
      grab = null;
      target.x = 0; target.y = 0;
      sun.classList.remove('is-held');
      run();
    };
    sun.addEventListener('pointerup', release);
    sun.addEventListener('pointercancel', release);
    sun.classList.add('is-live');
  });

  // Entrances: each section's parts rise in turn the first time the section comes into view.
  const targets = document.querySelectorAll('[data-reveal]');
  targets.forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
});
