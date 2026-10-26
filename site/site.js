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

  // Entrances: each section's parts rise in turn the first time the section comes into view.
  const targets = document.querySelectorAll('[data-reveal]');
  targets.forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
});
