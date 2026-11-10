/* StudyHub — UI helpers: modal, toast, animations, confetti, sound */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(msg, o = {}) {
    const root = $('#toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (o.type || '');
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="toast-icon">${icon(o.icon || 'check')}</div>
      <div class="toast-body">${o.title ? `<b>${esc(o.title)}</b>` : ''}${esc(msg)}</div>
      <button class="icon-btn sm plain" aria-label="Dismiss">${icon('x')}</button>`;
    root.appendChild(el);
    let gone = false;
    const kill = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => el.remove(), 350); };
    el.querySelector('button').onclick = kill;
    setTimeout(kill, o.duration || 3800);
    while (root.children.length > 4) root.firstElementChild.remove();
  }

  function modal(o) {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<form class="modal" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
      <div class="modal-head"><h3>${esc(o.title)}</h3><button type="button" class="icon-btn sm plain" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="modal-body">${o.body || ''}</div>
      <div class="modal-foot">${o.extraFooter || ''}<span class="spacer"></span>
        ${o.hideCancel ? '' : `<button type="button" class="btn btn-ghost" data-close>${esc(o.cancelLabel || 'Cancel')}</button>`}
        <button type="submit" class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}">${esc(o.submitLabel || 'Save')}</button>
      </div></form>`;
    root.appendChild(wrap);
    const prevFocus = document.activeElement;
    requestAnimationFrame(() => wrap.classList.add('open'));
    const form = $('form', wrap);
    let closed = false;
    const close = (submitted) => {
      if (closed) return; closed = true;
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 260);
      document.removeEventListener('keydown', onKey);
      if (!submitted && o.onClose) o.onClose();
      if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) { }
    };
    const onKey = e => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(false); });
    $$('[data-close]', wrap).forEach(b => b.onclick = () => close(false));
    form.onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      if (o.onSubmit && o.onSubmit(fd, form) === false) return;
      close(true);
    };
    const api = { close, el: form };
    if (o.onOpen) o.onOpen(api);
    setTimeout(() => { const f = form.querySelector('[autofocus]') || form.querySelector('.modal-body input:not([type=radio]):not([type=hidden]),.modal-body textarea'); if (f && matchMedia('(hover:hover)').matches) f.focus(); }, 80);
    return api;
  }

  function confirm(msg, o = {}) {
    return new Promise(res => {
      modal({
        title: o.title || 'Are you sure?', body: `<p>${esc(msg)}</p>`, submitLabel: o.label || 'Delete', danger: o.danger !== false,
        onSubmit: () => res(true), onClose: () => res(false),
      });
    });
  }

  function countFmt(el, v) {
    const dec = +(el.dataset.dec || 0);
    return (el.dataset.prefix || '') + v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
  }
  function countUp(el) {
    const to = +el.dataset.count, dur = 1100, t0 = performance.now();
    if (reduced()) { el.textContent = countFmt(el, to); return; }
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = countFmt(el, to * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function animate(root, quiet) {
    const bars = $$('[data-w]', root), rings = $$('[data-pct]', root), counts = $$('[data-count]', root), hbars = $$('[data-h]', root);
    const apply = () => {
      bars.forEach(b => b.style.width = Math.min(100, Math.max(0, +b.dataset.w)) + '%');
      hbars.forEach(b => b.style.height = Math.min(100, Math.max(0, +b.dataset.h)) + '%');
      rings.forEach(c => { const C = +c.dataset.c; c.style.strokeDashoffset = C * (1 - Math.min(100, Math.max(0, +c.dataset.pct)) / 100); });
    };
    if (quiet) {
      [...bars, ...rings, ...hbars].forEach(b => b.style.transition = 'none');
      apply();
      void root.offsetWidth;
      [...bars, ...rings, ...hbars].forEach(b => b.style.transition = '');
      counts.forEach(c => c.textContent = countFmt(c, +c.dataset.count));
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(apply));
    counts.forEach(countUp);
  }

  let ringN = 0;
  function ring(pct, o = {}) {
    const size = o.size || 120, sw = o.stroke || 10, r = (size - sw) / 2, C = 2 * Math.PI * r, id = 'rg' + (++ringN);
    const c1 = o.c1 || 'var(--ring-1)', c2 = o.c2 || 'var(--ring-2)';
    const stroke = o.solid ? o.solid : `url(#${id})`;
    return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${c1}"/><stop offset="1" style="stop-color:${c2}"/></linearGradient></defs>
      <circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/>
      <circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}" stroke="${stroke}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-c="${C}" ${o.live ? `${o.live}` : `data-pct="${pct}"`}/></svg>`;
  }

  const bar = (pct, color, cls = '') => `<div class="bar ${cls}"><span data-w="${Math.round(pct * 10) / 10}" ${color ? `style="--c:${color}"` : ''}></span></div>`;

  function confetti() {
    if (reduced()) return;
    const cv = $('#confetti'), ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
    const cols = [v('--primary'), v('--ring-1'), v('--mint'), v('--primary-600'), '#fbbf24', '#ffffff', '#fb7185'];
    const ps = Array.from({ length: 160 }, () => ({
      x: W / 2 + (Math.random() - .5) * W * .25, y: H * .4,
      vx: (Math.random() - .5) * 22 * dpr, vy: (-Math.random() * 17 - 7) * dpr,
      s: (6 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .35,
      c: cols[Math.floor(Math.random() * cols.length)], round: Math.random() < .3,
    }));
    const t0 = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of ps) {
        p.vy += .42 * dpr; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y < H + 40) alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (alive && now - t0 < 4500) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  let actx = null;
  function beep() {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      [[660, 0], [880, .18], [1046, .36]].forEach(([f, d]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.18, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .6);
        o.connect(g).connect(actx.destination); o.start(t + d); o.stop(t + d + .65);
      });
    } catch (e) { }
  }

  function subjectOptions(sel, o = {}) {
    const none = o.noneLabel || 'General';
    return (o.all ? `<option value="__all">All subjects</option>` : '') +
      `<option value="" ${!sel && !o.all ? 'selected' : ''}>${esc(none)}</option>` +
      S.data.subjects.map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  }

  function empty(ic, title, text, action) {
    return `<div class="empty"><div class="e-ico">${icon(ic)}</div><h4>${esc(title)}</h4><p>${esc(text)}</p>${action || ''}</div>`;
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.UI = { esc, $, $$, cap, toast, modal, confirm, animate, ring, bar, confetti, beep, subjectOptions, empty, download, reduced };
})();
