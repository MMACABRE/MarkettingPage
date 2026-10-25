// klerk marketing page. Every piece here is an enhancement: without this script the page still reads in full.
// The class "js" turns on the entrance motion (site.css), so it is added before the body is drawn.
document.documentElement.classList.add('js');

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (s) => String(s).replace(/\d/g, (d) => FA[d]).replace('.', '٫');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Runs a DOM change inside a view transition where the browser has one, so state changes cross-fade.
const transition = (fn) => (document.startViewTransition && !reduce ? document.startViewTransition(fn) : fn());
const flash = (el) => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };

document.addEventListener('DOMContentLoaded', () => {
  // 1. Hero: the visitor's own date and time, read from their computer, and the visit that is due now.
  // Built from parts: some browsers order the joined Persian date oddly («۱۴۰۵ آبان ۳, یکشنبه»).
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateFmt = { format: (d) => { const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value])); return `${p.weekday} ${p.day} ${p.month} ${p.year}`; } };
  const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const today = document.querySelector('[data-today]');
  const clock = document.querySelector('[data-clock]');
  const read = document.querySelector('[data-read]');
  const visits = [...document.querySelectorAll('[data-visits] li')];
  const tick = () => {
    const now = new Date();
    const date = dateFmt.format(now);
    today.textContent = date;
    clock.textContent = hhmm(now);
    read.textContent = `این کارت را رایانه‌ی خود شما پر کرد: ${date}، ساعت ${fa(hhmm(now))}.`;
    // The next visit not yet done whose time (plus 30 minutes) has not passed is the one "now".
    const mins = now.getHours() * 60 + now.getMinutes();
    const due = visits.find((li) => {
      const [h, m] = li.dataset.t.split(':').map(Number);
      return !li.classList.contains('is-done') && h * 60 + m + 30 >= mins;
    });
    visits.forEach((li) => li.classList.toggle('is-now', li === due));
  };
  tick();
  setInterval(tick, 15000);
  visits.forEach((li) => li.querySelector('button').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    transition(() => {
      const done = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(done));
      li.classList.toggle('is-done', done);
      tick();
    });
  }));

  // 2. The middle visit row is live: recording the payment settles it.
  const live = document.querySelector('[data-live-visit]');
  live.querySelector('[data-pay]').addEventListener('click', () => transition(() => {
    const chip = live.querySelector('[data-chip]');
    chip.className = 'chip chip-done';
    chip.textContent = 'بدون بدهی';
    live.classList.add('is-paid');
    live.querySelector('.vr-who small').innerHTML = '<span class="code">P-000006</span> · کارت به کارت · حساب بانکی';
    document.querySelector('[data-state-word]').textContent = 'همین حالا تسویه شد';
    flash(chip);
  }));

  // 3. The printed bill follows the controls beside it. Amounts are whole Rial, like in the app.
  const state = { name: 'KLERK | کلرک', cur: 'T', qty: 0.5, disc: 0, size: 'a4' };
  const VISIT = 900000;
  const ITEM = 8000000;
  const money = (rial) => (state.cur === 'T' ? `${Math.round(rial / 10).toLocaleString('en-US')} T` : `${rial.toLocaleString('en-US')} R`);
  const $ = (sel) => document.querySelector(sel);
  const paper = $('[data-paper]');
  const render = (changed) => {
    const item = Math.round(ITEM * state.qty);
    const disc = Math.round(((VISIT + item) * state.disc) / 100);
    $('[data-out-name]').textContent = state.name.trim() || 'نام کلینیک';
    $('[data-m]').textContent = money(VISIT);
    $('[data-out-qty]').textContent = fa(state.qty);
    $('[data-out-item]').textContent = money(item);
    $('[data-out-disc-row]').hidden = !disc;
    $('[data-out-disc]').textContent = money(-disc).replace('-', '−');
    $('[data-out-total]').textContent = money(VISIT + item - disc);
    $('[data-qty-read]').textContent = fa(state.qty);
    $('[data-out-size]').textContent = `${state.size === 'a5' ? 'A5' : 'A4'} · چاپ یا ذخیره به PDF از مرورگر`;
    paper.classList.toggle('is-a5', state.size === 'a5');
    for (const el of changed ?? []) flash(el);
  };
  $('[data-in-name]').addEventListener('input', (e) => { state.name = e.target.value; render([$('[data-out-name]')]); });
  document.querySelectorAll('[data-in-cur]').forEach((r) => r.addEventListener('change', () => { state.cur = r.value; render([...paper.querySelectorAll('.m')]); }));
  $('[data-in-qty]').addEventListener('input', (e) => { state.qty = Number(e.target.value); render([$('[data-out-qty]'), $('[data-out-item]'), $('[data-out-total]')]); });
  document.querySelectorAll('[data-in-disc]').forEach((r) => r.addEventListener('change', () => { state.disc = Number(r.value); render([$('[data-out-disc]'), $('[data-out-total]')]); }));
  document.querySelectorAll('[data-in-size]').forEach((r) => r.addEventListener('change', () => { state.size = r.value; render(); }));
  render();

  // 5. Light or dark: the real dashboard in either theme.
  const themeShot = $('[data-theme-shot]');
  document.querySelectorAll('[data-in-theme]').forEach((r) => r.addEventListener('change', () => themeShot.classList.toggle('show-dark', r.value === 'dark')));

  // 7. The contact field opens a ready email (the form alone also works, without this script).
  const form = $('[data-contact]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const body = form.elements.body.value.trim();
    if (!body) return form.elements.body.focus();
    location.href = `mailto:hosseinhoveysi@gmail.com?subject=${encodeURIComponent('درخواست نمایش klerk')}&body=${encodeURIComponent(body)}`;
  });

  // 8. Local time in Tehran, in the footer.
  const tehran = $('[data-tehran]');
  const tFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tehran' });
  const tTick = () => { tehran.textContent = `ساعت تهران ${tFmt.format(new Date())}`; };
  tTick();
  setInterval(tTick, 30000);

  // Entrances: each section's parts rise in turn the first time the section comes into view.
  const targets = document.querySelectorAll('[data-reveal], .visit');
  targets.forEach((el) => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
  document.querySelectorAll('.visit-rows > *').forEach((c, i) => c.style.setProperty('--i', i + 1));
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
});
