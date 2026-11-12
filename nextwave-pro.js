/* NextWave Pro — shared Pro unlock for NextWave Digital apps (no build step).
 *
 * Copy this file into an app, load it with <script src="nextwave-pro.js"></script>, then:
 *
 *   NextWavePro.init({
 *     app: 'wisely',                         // wisely | lull | kindling | studyhub | forge
 *     name: 'Wisely Pro',
 *     price: 'R99 once-off',
 *     buyUrl: 'https://payhip.com/b/XXXX',   // the Payhip product page
 *     features: ['Feature one', 'Feature two'],
 *     accent: '#4f8a68',                     // optional; the dialog's button colour
 *   });
 *
 *   NextWavePro.isPro()                       // true once a key is verified
 *   NextWavePro.gate('CSV export', () => {…}) // runs fn if Pro, otherwise opens the upgrade dialog
 *   NextWavePro.open()                        // opens the upgrade / enter-key dialog
 *   window.addEventListener('nextwave-pro-change', (e) => e.detail.pro)
 *
 * The unlock is stored on the device. Keys are re-checked in the background every
 * 14 days when online; a refunded key is switched off by Payhip and the unlock goes.
 * Being offline never removes Pro.
 */
(function () {
  'use strict';
  var API = 'https://nextwave-digital-six.vercel.app/api/verify-license';
  var RECHECK_MS = 14 * 24 * 60 * 60 * 1000;
  var cfg = null;
  var state = null;
  var dialog = null;

  function storeKey() { return 'nextwave:pro:' + cfg.app; }
  function load() {
    try { return JSON.parse(localStorage.getItem(storeKey()) || 'null'); } catch (e) { return null; }
  }
  function save(s) {
    state = s;
    try {
      if (s) localStorage.setItem(storeKey(), JSON.stringify(s));
      else localStorage.removeItem(storeKey());
    } catch (e) { /* storage blocked: Pro lasts for this visit only */ }
    window.dispatchEvent(new CustomEvent('nextwave-pro-change', { detail: { pro: !!s } }));
  }

  function verify(key) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: cfg.app, key: key }),
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, reason: 'Unexpected answer from the licence server.' }; })
        .then(function (j) { j.network = r.status >= 500; return j; });
    }, function () {
      return { ok: false, network: true, reason: 'You seem to be offline. Connect to the internet and try again.' };
    });
  }

  function recheck() {
    if (!state || !navigator.onLine) return;
    if (Date.now() - (state.checkedAt || 0) < RECHECK_MS) return;
    verify(state.key).then(function (res) {
      if (res.ok) save({ key: state.key, plan: res.plan, checkedAt: Date.now() });
      else if (!res.network) save(null);
    });
  }

  // ---------- dialog ----------
  var CSS = [
    '.nwp-back{position:fixed;inset:0;z-index:2147483000;background:rgba(10,8,20,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit}',
    '.nwp-card{background:#fff;color:#1d1a24;width:100%;max-width:400px;border-radius:18px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px;max-height:calc(100vh - 32px);overflow:auto}',
    '.nwp-card h2{margin:0;font-size:20px}',
    '.nwp-muted{color:#6b6478;font-size:14px;margin:0}',
    '.nwp-list{margin:0;padding:0;list-style:none;display:grid;gap:6px;font-size:15px}',
    '.nwp-list li{display:flex;gap:8px}.nwp-list li::before{content:"\\2713";color:var(--nwp-accent);font-weight:700}',
    '.nwp-btn{appearance:none;border:0;border-radius:12px;padding:12px 16px;font:inherit;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;display:block}',
    '.nwp-buy{background:var(--nwp-accent);color:#fff}',
    '.nwp-ghost{background:transparent;color:inherit;border:1px solid currentColor;opacity:.75}',
    '.nwp-btn:focus-visible,.nwp-in:focus-visible{outline:3px solid var(--nwp-accent);outline-offset:2px}',
    '.nwp-row{display:flex;gap:8px}.nwp-row .nwp-in{flex:1;min-width:0}',
    '.nwp-in{border:1px solid #d8d2e3;border-radius:12px;padding:11px 12px;font:inherit;font-size:15px;background:#faf9fc;color:#1d1a24}',
    '.nwp-msg{font-size:14px;margin:0;min-height:1em}.nwp-msg.bad{color:#c0392b}.nwp-msg.ok{color:#2e8b57}',
    '.nwp-x{position:absolute;right:14px;top:10px;background:none;border:0;font-size:24px;cursor:pointer;color:inherit;opacity:.6}',
    '@media (prefers-color-scheme:dark){.nwp-card{background:#1f1c27;color:#f1eef7}.nwp-in{background:#2a2633;color:#f1eef7;border-color:#3a3546}.nwp-muted{color:#a9a3b8}.nwp-msg.bad{color:#ff8a7a}.nwp-msg.ok{color:#6fd39a}}',
  ].join('');

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function close() {
    if (dialog) { dialog.remove(); dialog = null; document.removeEventListener('keydown', onKey); }
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function open(reason) {
    close();
    if (!document.getElementById('nwp-style')) {
      var st = el('style'); st.id = 'nwp-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    var back = el('div', 'nwp-back');
    back.style.setProperty('--nwp-accent', cfg.accent || '#5B2BA0');
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    var card = el('div', 'nwp-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', cfg.name);
    card.style.position = 'relative';
    var x = el('button', 'nwp-x', '×'); x.setAttribute('aria-label', 'Close'); x.onclick = close;
    card.appendChild(x);

    if (state) {
      card.appendChild(el('h2', null, cfg.name + ' is unlocked'));
      card.appendChild(el('p', 'nwp-muted', state.plan === 'all-access' ? 'Unlocked with your NextWave All-Access key.' : 'Thanks for supporting NextWave Digital.'));
      var keyLine = el('p', 'nwp-muted', 'Key: ' + state.key.slice(0, 5) + '…' + state.key.slice(-4));
      card.appendChild(keyLine);
      var rm = el('button', 'nwp-btn nwp-ghost', 'Remove key from this device');
      rm.onclick = function () { save(null); close(); };
      card.appendChild(rm);
    } else {
      card.appendChild(el('h2', null, reason ? reason + ' is a Pro feature' : 'Get ' + cfg.name));
      card.appendChild(el('p', 'nwp-muted', cfg.price + '. Pay once, keep it forever. Everything that is free stays free.'));
      var ul = el('ul', 'nwp-list');
      (cfg.features || []).forEach(function (f) { ul.appendChild(el('li', null, f)); });
      card.appendChild(ul);
      var buy = el('a', 'nwp-btn nwp-buy', 'Buy ' + cfg.name + ' – ' + cfg.price);
      buy.href = cfg.buyUrl; buy.target = '_blank'; buy.rel = 'noopener';
      card.appendChild(buy);
      card.appendChild(el('p', 'nwp-muted', 'Already bought it? Paste the licence key from your Payhip receipt email.'));
      var row = el('div', 'nwp-row');
      var input = el('input', 'nwp-in');
      input.id = 'nwp-key'; input.placeholder = 'XXXXX-XXXXX-XXXXX-XXXXX'; input.autocomplete = 'off'; input.spellcheck = false;
      input.setAttribute('aria-label', 'Licence key');
      var go = el('button', 'nwp-btn nwp-ghost', 'Unlock');
      row.appendChild(input); row.appendChild(go);
      card.appendChild(row);
      var msg = el('p', 'nwp-msg'); msg.setAttribute('role', 'status');
      card.appendChild(msg);
      var submit = function () {
        var key = input.value.trim();
        if (!key) { msg.className = 'nwp-msg bad'; msg.textContent = 'Paste your licence key first.'; return; }
        go.disabled = true; msg.className = 'nwp-msg'; msg.textContent = 'Checking…';
        verify(key).then(function (res) {
          go.disabled = false;
          if (res.ok) {
            save({ key: key, plan: res.plan, checkedAt: Date.now() });
            msg.className = 'nwp-msg ok'; msg.textContent = 'Unlocked. Enjoy ' + cfg.name + '!';
            setTimeout(close, 1200);
          } else {
            msg.className = 'nwp-msg bad'; msg.textContent = res.reason || 'That key didn’t work.';
          }
        });
      };
      go.onclick = submit;
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      setTimeout(function () { input.focus(); }, 0);
    }
    back.appendChild(card);
    document.body.appendChild(back);
    dialog = back;
    document.addEventListener('keydown', onKey);
  }

  window.NextWavePro = {
    init: function (options) {
      cfg = options;
      state = load();
      recheck();
      window.addEventListener('online', recheck);
      return this;
    },
    isPro: function () { return !!state; },
    plan: function () { return state ? state.plan : null; },
    gate: function (featureName, fn) {
      if (state) return fn();
      open(featureName);
    },
    open: function () { open(); },
  };
})();
