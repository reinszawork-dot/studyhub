/* StudyHub — app shell: router, theme, navigation, milestones, timer UI */
(function () {
  const { $, $$, esc } = UI;

  const ROUTES = {
    dashboard: { title: 'Dashboard', icon: 'dashboard', group: 'Overview', sub: () => `${S.settings.level ? S.settings.level + ' · ' : ''}${D.fmt(D.today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` },
    analytics: { title: 'Analytics', icon: 'chart', group: 'Overview', sub: () => 'Interactive insights into how you study' },
    timer: { title: 'Study Timer', icon: 'timer', group: 'Study tools', sub: () => 'Deep, distraction-free focus sessions' },
    tasks: { title: 'Tasks', icon: 'tasks', group: 'Study tools', sub: () => { const n = S.data.tasks.filter(t => !t.done).length; return `${n} open task${n === 1 ? '' : 's'}`; } },
    calendar: { title: 'Calendar', icon: 'calendar', group: 'Study tools', sub: () => 'Exams, assignments and study plans' },
    notes: { title: 'Notes', icon: 'notes', group: 'Study tools', sub: () => 'Autosaving notes, organised by subject' },
    subjects: { title: 'Subjects', icon: 'book', group: 'Study tools', sub: () => `${S.data.subjects.length} subjects` },
    exams: { title: 'Exam Planner', icon: 'flag', group: 'Pro tools', pro: true, sub: () => 'Countdowns and revision plans for every exam' },
    grades: { title: 'Grades & APS', icon: 'cap', group: 'Pro tools', pro: true, sub: () => 'Weighted marks, what you need, and your APS' },
    goals: { title: 'Goals & Progress', icon: 'target', group: 'Growth', sub: () => 'Goals, streaks and achievements' },
    settings: { title: 'Settings', icon: 'settings', group: 'Account', sub: () => 'Profile, preferences and your data' },
  };

  /* ---------------- Milestones ---------------- */
  const hrs = m => `${Math.floor(m)}h`, n = x => `${Math.floor(x)}`;
  const DEFS = [
    { id: 'h10', title: 'First 10 hours', desc: 'Log 10 hours of study', icon: 'clock', goal: 10, val: () => S.totalMinutes() / 60, fmt: hrs },
    { id: 'h50', title: 'Dedicated', desc: 'Log 50 hours of study', icon: 'clock', goal: 50, val: () => S.totalMinutes() / 60, fmt: hrs },
    { id: 'h100', title: 'Century', desc: 'Log 100 hours of study', icon: 'award', goal: 100, val: () => S.totalMinutes() / 60, fmt: hrs },
    { id: 'h250', title: 'Scholar', desc: 'Log 250 hours of study', icon: 'cap', goal: 250, val: () => S.totalMinutes() / 60, fmt: hrs },
    { id: 'h500', title: 'Master mind', desc: 'Log 500 hours of study', icon: 'brain', goal: 500, val: () => S.totalMinutes() / 60, fmt: hrs },
    { id: 'st3', title: 'On a roll', desc: 'Study 3 days in a row', icon: 'flame', goal: 3, val: () => S.bestStreak(), fmt: n },
    { id: 'st7', title: 'Week warrior', desc: 'Study 7 days in a row', icon: 'flame', goal: 7, val: () => S.bestStreak(), fmt: n },
    { id: 'st14', title: 'Fortnight focus', desc: 'Study 14 days in a row', icon: 'zap', goal: 14, val: () => S.bestStreak(), fmt: n },
    { id: 'st30', title: 'Unstoppable', desc: 'Study 30 days in a row', icon: 'rocket', goal: 30, val: () => S.bestStreak(), fmt: n },
    { id: 't10', title: 'Task tamer', desc: 'Complete 10 tasks', icon: 'tasks', goal: 10, val: () => S.data.tasks.filter(t => t.done).length, fmt: n },
    { id: 't25', title: 'Get it done', desc: 'Complete 25 tasks', icon: 'check', goal: 25, val: () => S.data.tasks.filter(t => t.done).length, fmt: n },
    { id: 'p10', title: 'Pomodoro pro', desc: 'Finish 10 timer sessions', icon: 'timer', goal: 10, val: () => S.data.stats.pomodoros || 0, fmt: n },
    { id: 'n5', title: 'Note taker', desc: 'Keep 5 study notes', icon: 'notes', goal: 5, val: () => S.data.notes.filter(x => x.title || x.body).length, fmt: n },
    { id: 'n15', title: 'Knowledge base', desc: 'Keep 15 study notes', icon: 'book', goal: 15, val: () => S.data.notes.filter(x => x.title || x.body).length, fmt: n },
    { id: 'g1', title: 'Goal getter', desc: 'Achieve a personal goal', icon: 'trophy', goal: 1, val: () => S.data.goals.filter(g => g.current >= g.target).length, fmt: n },
    { id: 'gr', title: 'Bullseye', desc: 'Reach a subject target mark', icon: 'target', goal: 1, val: () => S.data.subjects.filter(s => s.grade >= s.target).length, fmt: n },
  ];
  const Milestones = {
    list() { return DEFS.map(d => { const cur = Math.min(d.goal, d.val()); return { ...d, cur, done: !!S.data.achieved[d.id], when: S.data.achieved[d.id] }; }); },
    check(silent) {
      const data = S.data, tk = D.key(D.today()), queue = [];
      for (const d of DEFS) if (!data.achieved[d.id] && d.val() >= d.goal) { data.achieved[d.id] = tk; queue.push(d); }
      const today = S.minutesOn(tk), st = S.settings;
      const dk = 'daily-' + tk, ws = D.sow(D.today()), wkk = 'weekly-' + D.key(ws);
      const dailyHit = today >= st.dailyGoalMin, weeklyHit = S.minutesRange(ws, D.add(ws, 7)) >= st.weeklyGoalHrs * 60;
      const newDaily = dailyHit && !data.celebrated[dk], newWeekly = weeklyHit && !data.celebrated[wkk];
      if (newDaily) data.celebrated[dk] = 1;
      if (newWeekly) data.celebrated[wkk] = 1;
      if (queue.length || newDaily || newWeekly) S.save();
      if (silent) return;
      let delay = 0;
      const show = (fn) => { setTimeout(fn, delay); delay += 1400; };
      if (newWeekly) show(() => { UI.toast(`You hit your ${st.weeklyGoalHrs}h weekly goal. That consistency is what top students are made of.`, { title: 'Weekly goal reached!', icon: 'trophy', type: 'celebrate', duration: 5500 }); UI.confetti(); });
      else if (newDaily) show(() => { UI.toast(`${fmtMin(today)} studied today. Daily goal complete — brilliant work!`, { title: 'Daily goal smashed!', icon: 'target', type: 'celebrate', duration: 5000 }); UI.confetti(); });
      queue.forEach(d => show(() => { UI.toast(`${d.desc}. Keep building on it!`, { title: `Achievement unlocked: ${d.title}`, icon: d.icon, type: 'celebrate', duration: 5000 }); UI.confetti(); }));
    },
  };
  window.Milestones = Milestones;

  /* ---------------- Logo: open book with a graduation cap ---------------- */
  const LOGO = `<svg class="logo" viewBox="0 0 48 48" aria-hidden="true">
    <defs><linearGradient id="lgL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--mint)"/><stop offset="1" style="stop-color:var(--accent)"/></linearGradient>
    <linearGradient id="lgR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--ring-1)"/><stop offset="1" style="stop-color:var(--primary)"/></linearGradient></defs>
    <path d="M24 18c-5-3.6-11.4-4.6-18-3.8v24c6.6-.8 13 .2 18 3.8z" fill="url(#lgL)"/>
    <path d="M24 18c5-3.6 11.4-4.6 18-3.8v24c-6.6-.8-13 .2-18 3.8z" fill="url(#lgR)"/>
    <path d="M24 18v24" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/>
    <path d="M24 3.5 37 9.5 24 15.5 11 9.5z" fill="currentColor"/>
    <path d="M17 12.2v3.6c3.8 2.6 10.2 2.6 14 0v-3.6" fill="currentColor" opacity=".85"/>
    <path d="M37 9.5v6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="37" cy="17" r="1.6" fill="currentColor"/>
  </svg>`;
  window.LOGO = LOGO;

  /* ---------------- Theme ---------------- */
  const Theme = {
    get() { try { return localStorage.getItem('studyhub:theme') || 'light'; } catch (e) { return 'light'; } },
    apply(t, anim) {
      const html = document.documentElement;
      if (anim && !UI.reduced()) { html.classList.add('theme-anim'); clearTimeout(this._t); this._t = setTimeout(() => html.classList.remove('theme-anim'), 600); }
      html.dataset.theme = t;
      try { localStorage.setItem('studyhub:theme', t); } catch (e) { }
      this.meta();
      const b = $('#theme-toggle'); if (b) { b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.title = b.getAttribute('aria-label'); }
    },
    accent() {
      let a = 'teal';
      try { a = localStorage.getItem('studyhub:accent') || 'teal'; } catch (e) { }
      if (a === 'forest' || a === 'teal') return a;
      return window.StudyPro && StudyPro.proPalette(a) && NextWavePro.isPro() ? a : 'teal';
    },
    setAccent(a, anim) {
      const html = document.documentElement;
      if (anim && !UI.reduced()) { html.classList.add('theme-anim'); clearTimeout(this._t); this._t = setTimeout(() => html.classList.remove('theme-anim'), 600); }
      html.dataset.accent = a;
      try { localStorage.setItem('studyhub:accent', a); } catch (e) { }
      this.meta();
    },
    meta() { const m = $('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue('--side-bg').trim(); },
  };

  /* ---------------- Router ---------------- */
  let current = null, intervals = [];
  const App = window.App = {
    ready: false,
    track(id) { intervals.push(id); },
    refresh() { if (current) render(current, false); },
    setTheme(t) { Theme.apply(t, true); setTimeout(() => App.refresh(), 30); },
    setAccent(a) { Theme.setAccent(a, true); setTimeout(() => App.refresh(), 30); },
    accent: () => Theme.accent(),
    rebuildNav: () => { buildNav(); updateChrome(); $$('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === current)); },
    afterTimer() { if (current === 'timer' || current === 'dashboard' || current === 'goals') App.refresh(); updateChrome(); },
    timerUI,
  };

  function route() {
    const name = (location.hash.replace(/^#\/?/, '') || 'dashboard').split(/[?/]/)[0];
    const r = ROUTES[name] ? name : 'dashboard';
    if (current === 'notes' && r !== 'notes') Pages.leaveNotes();
    render(r, true);
    closeDrawer();
  }

  function render(name, anim) {
    const view = $('#view');
    intervals.forEach(clearInterval); intervals = [];
    Charts.destroyAll();
    Charts.quiet = !anim;
    ['onclick', 'onchange', 'oninput', 'onsubmit', 'onkeydown', 'ondblclick'].forEach(h => view[h] = null);
    const y = window.scrollY;
    current = name;
    const r = ROUTES[name];
    $('#page-title').textContent = r.title;
    $('#page-sub').textContent = r.sub();
    document.title = `${r.title} · StudyHub`;
    $$('[data-route]').forEach(a => { const on = a.dataset.route === name; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    view.classList.remove('page-enter');
    view.innerHTML = '';
    try { Pages[name](view); } catch (e) { console.error(e); view.innerHTML = UI.empty('alert', 'Something went wrong', 'Try refreshing the page.'); }
    if (anim) { void view.offsetWidth; view.classList.add('page-enter'); window.scrollTo({ top: 0, behavior: 'instant' }); }
    else window.scrollTo({ top: y, behavior: 'instant' });
    UI.animate(view, !anim);
    Charts.quiet = false;
    updateChrome();
    Timer.emit();
  }

  /* ---------------- Chrome (sidebar, topbar, bottom nav) ---------------- */
  function buildChrome() {
    $('#loader-mark').innerHTML = LOGO;
    $('#brand-mark').innerHTML = LOGO;
    $('#menu-btn').innerHTML = icon('menu');
    $('#theme-toggle').innerHTML = icon('sun') + icon('moon');
    buildNav();
    $('#bottom-nav').innerHTML = [['dashboard', 'Home'], ['timer', 'Timer'], ['tasks', 'Tasks'], ['calendar', 'Calendar']].map(([k, l]) => `<a href="#/${k}" data-route="${k}">${icon(ROUTES[k].icon)}<span>${l}</span></a>`).join('') + `<button id="more-btn" aria-label="More pages">${icon('grid')}<span>More</span></button>`;

    $('#theme-toggle').onclick = () => App.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('#menu-btn').onclick = () => {
      if (innerWidth > 1024) {
        const c = document.documentElement.classList.toggle('side-collapsed');
        try { localStorage.setItem('studyhub:collapsed', c ? '1' : ''); } catch (e) { }
        setTimeout(() => Charts.list.forEach(ch => ch.resize()), 420);
      } else openDrawer();
    };
    try { if (localStorage.getItem('studyhub:collapsed')) document.documentElement.classList.add('side-collapsed'); } catch (e) { }
    $('#more-btn').onclick = openDrawer;
    $('#scrim').onclick = closeDrawer;
    addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', scrollY > 6), { passive: true });
    addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
      if (e.code === 'Space' && current === 'timer' && !e.target.closest('input,textarea,select,button,[contenteditable]') && !$('.modal-backdrop')) { e.preventDefault(); Timer.toggle(); }
    });
    let rz; addEventListener('resize', () => { clearTimeout(rz); const w = innerWidth; rz = setTimeout(() => { if ((w < 600) !== (App._narrow)) { App._narrow = w < 600; if (current === 'analytics' || current === 'goals' || current === 'calendar') App.refresh(); } }, 250); });
    App._narrow = innerWidth < 600;
  }
  function buildNav() {
    const NAV = { dashboard: 'Home', analytics: 'Analytics', timer: 'Timer', tasks: 'Tasks', calendar: 'Calendar', notes: 'Notes', subjects: 'Subjects', exams: 'Exam planner', grades: 'Grades & APS', goals: 'Progress', settings: 'Settings' };
    let html = '', g = null;
    for (const [k, r] of Object.entries(ROUTES)) {
      if (r.group !== g) { g = r.group; html += `<div class="nav-label">${g}</div>`; }
      html += `<a href="#/${k}" data-route="${k}" title="${NAV[k]}">${icon(r.icon)}<span>${NAV[k]}</span>${k === 'tasks' ? '<span class="nav-badge" id="task-badge" hidden></span>' : ''}${r.pro && !NextWavePro.isPro() ? StudyPro.badge : ''}</a>`;
    }
    $('#nav').innerHTML = html;
  }
  function openDrawer() { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); }
  function closeDrawer() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }

  function updateChrome() {
    const st = S.settings, tk = D.key(D.today());
    const initials = (st.name || 'S').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    $('#avatar').textContent = initials;
    const due = S.data.tasks.filter(t => !t.done && t.due && t.due <= tk).length;
    const b = $('#task-badge'); if (b) { b.hidden = !due; b.textContent = due; b.title = `${due} due today or overdue`; }
    const streak = S.streak(), studied = S.minutesOn(tk) > 0;
    const pct = Math.min(100, Math.round(S.minutesOn(tk) / st.dailyGoalMin * 100));
    $('#side-card').innerHTML = `<div class="sc-trophy">${icon('trophy')}</div>
      <b>${pct >= 100 ? 'Goal smashed!' : studied ? 'Keep going!' : 'Ready to start?'}</b>
      <p>${streak ? `${streak}-day streak${studied ? ' — you’re doing great!' : '. Study today to keep it.'}` : 'Start a session to begin a streak.'}</p>
      <div class="sc-bar"><span style="width:${pct}%"></span></div>
      <small>${pct}% of today’s goal</small>
      <a class="btn btn-light btn-sm" href="#/timer">${icon('play')}${Timer.s && Timer.s.running ? 'Timer running' : 'Start focusing'}</a>`;
  }

  /* ---------------- Timer UI binding (called every tick) ---------------- */
  function timerUI(T) {
    const s = T.s, txt = T.text(), left = T.left();
    $$('[data-timer-time]').forEach(e => { if (e.textContent !== txt) e.textContent = txt; });
    const fg = $('[data-timer-ring]');
    if (fg) fg.style.strokeDashoffset = (+fg.dataset.c) * (1 - left / s.duration);
    const lab = $('[data-timer-label]'); if (lab) lab.textContent = s.running ? T.MODE[s.mode] : (T.pristine() ? T.MODE[s.mode] : 'Paused');
    const tg = $('[data-timer-toggle]');
    if (tg && tg.dataset.state !== String(s.running)) { tg.dataset.state = String(s.running); tg.innerHTML = icon(s.running ? 'pause' : 'play'); tg.setAttribute('aria-label', s.running ? 'Pause timer' : 'Start timer'); }
    const fin = $('[data-timer-finish]'); if (fin) fin.hidden = !(s.mode === 'focus' && T.elapsed() >= 60);
    const card = $('#timer-card'); if (card) card.classList.toggle('running', s.running);
    if (App._wasRunning !== s.running) { App._wasRunning = s.running; updateChrome(); }
    const pill = $('#timer-pill'), active = s.running || !T.pristine();
    pill.classList.toggle('show', active && current !== 'timer');
    pill.classList.toggle('paused', !s.running);
    pill.title = `${T.MODE[s.mode]}${s.running ? '' : ' (paused)'} — open timer`;
    const base = ROUTES[current] ? ROUTES[current].title : 'StudyHub';
    document.title = s.running ? `${txt} · ${s.mode === 'focus' ? 'Focus' : 'Break'} — StudyHub` : `${base} · StudyHub`;
  }

  /* ---------------- First-run welcome ---------------- */
  function welcome() {
    const st = S.settings;
    UI.modal({
      title: 'Welcome to StudyHub',
      body: `<p>Your all-in-one study space for planning, focusing and tracking progress. We've loaded realistic sample data so you can explore — everything is fully editable and saved on this device.</p>
        <div class="field" style="margin-top:18px"><label>What should we call you?</label><input class="input" name="name" placeholder="Your first name" maxlength="30" autofocus></div>
        <div class="row"><div class="field"><label>Grade / year</label><input class="input" name="level" value="${esc(st.level)}" maxlength="40"></div>
        <div class="field"><label>Daily study goal</label><select class="select" name="daily">${[60, 90, 120, 150, 180, 240].map(m => `<option value="${m}" ${m === st.dailyGoalMin ? 'selected' : ''}>${fmtMin(m)} a day</option>`).join('')}</select></div></div>`,
      submitLabel: 'Get started', cancelLabel: 'Skip for now',
      onSubmit(f) {
        S.data.firstRun = false;
        Object.assign(st, { name: f.name.trim() || st.name, level: f.level.trim(), dailyGoalMin: +f.daily });
        S.commit(); App.refresh();
        UI.toast(`Let's make today count, ${st.name}.`, { title: 'You’re all set', icon: 'sparkles' });
      },
      onClose() { S.data.firstRun = false; S.save(); },
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    S.load();
    Theme.setAccent(Theme.accent(), false);
    Theme.apply(Theme.get(), false);
    buildChrome();
    Timer.init();
    Milestones.check(true);
    S.on(() => { Milestones.check(false); updateChrome(); });
    addEventListener('hashchange', route);
    route();
    App.ready = true;
    setTimeout(() => { $('#loader').classList.add('done'); if (S.data.firstRun) setTimeout(welcome, 350); }, 700);
    // refresh dashboard at midnight rollover
    let day = D.key(D.today());
    setInterval(() => { const k = D.key(D.today()); if (k !== day) { day = k; App.refresh(); } }, 60000);
  }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
