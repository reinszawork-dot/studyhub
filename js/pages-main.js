/* StudyHub — Dashboard, Analytics, Goals pages */
(function () {
  const { esc, bar, ring, $, $$ } = UI;
  const P = window.Pages = window.Pages || {};

  const QUOTES = [
    ['The secret of getting ahead is getting started.', 'Mark Twain'],
    ['It always seems impossible until it’s done.', 'Nelson Mandela'],
    ['Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'],
    ['Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'],
    ['The expert in anything was once a beginner.', 'Helen Hayes'],
    ['Don’t watch the clock; do what it does. Keep going.', 'Sam Levenson'],
    ['Learning never exhausts the mind.', 'Leonardo da Vinci'],
    ['The beautiful thing about learning is that no one can take it away from you.', 'B.B. King'],
    ['We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant'],
    ['You don’t have to be great to start, but you have to start to be great.', 'Zig Ziglar'],
    ['Strive for progress, not perfection.', 'Unknown'],
    ['Small daily improvements are the key to staggering long-term results.', 'Unknown'],
    ['Focus on being productive instead of busy.', 'Tim Ferriss'],
    ['An investment in knowledge pays the best interest.', 'Benjamin Franklin'],
  ];
  P.QUOTES = QUOTES;

  const typeLabel = { exam: 'Exam', assignment: 'Assignment', study: 'Study', other: 'Other' };
  P.typeLabel = typeLabel;

  function deadlineItem(ev) {
    const d = D.parse(ev.date), n = D.days(ev.date), s = S.subject(ev.subjectId);
    const urgent = n <= 3 && (ev.type === 'exam' || ev.type === 'assignment');
    return `<div class="item click" data-act="edit-event" data-id="${ev.id}">
      <div class="date-badge ${ev.type}"><small>${d.toLocaleDateString('en-ZA', { month: 'short' })}</small><b>${d.getDate()}</b></div>
      <div class="item-body"><div class="item-title">${esc(ev.title)}</div>
        <div class="item-meta"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}${ev.time ? ` · ${ev.time}` : ''}</div></div>
      <span class="pill ${urgent ? 'urgent' : ev.type}">${D.rel(ev.date)}</span></div>`;
  }
  P.deadlineItem = deadlineItem;

  function taskRow(t, compact) {
    const s = S.subject(t.subjectId), n = t.due ? D.days(t.due) : null;
    const dueCls = t.done ? '' : n !== null && n < 0 ? 'late' : n !== null && n <= 1 ? 'soon' : '';
    return `<div class="task ${t.done ? 'done' : ''}" data-task="${t.id}">
      <input type="checkbox" class="check" data-toggle="${t.id}" ${t.done ? 'checked' : ''} aria-label="Mark “${esc(t.title)}” complete">
      <div class="item-body"><div class="task-title">${esc(t.title)}</div>
        <div class="item-meta"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}
          ${t.due ? `<span class="due ${dueCls}">${icon('calendar')}${n < 0 && !t.done ? `Overdue · ${D.fmt(t.due)}` : D.rel(t.due)}</span>` : ''}
          ${compact ? '' : `<span class="prio ${t.priority}">${t.priority}</span>`}</div></div>
      ${compact ? `<span class="prio ${t.priority}">${t.priority[0].toUpperCase()}</span>` : `<div class="task-actions"><button class="icon-btn sm plain" data-act="edit-task" data-id="${t.id}" aria-label="Edit task">${icon('edit')}</button><button class="icon-btn sm plain danger" data-act="del-task" data-id="${t.id}" aria-label="Delete task">${icon('trash')}</button></div>`}
    </div>`;
  }
  P.taskRow = taskRow;

  /* shared: toggle task with motivational feedback */
  const CHEERS = ['Nice work — one less thing to worry about.', 'Ticked off! Keep the momentum going.', 'Done and dusted.', 'Another one down. You’re on fire.', 'Progress feels good, doesn’t it?'];
  P.toggleTask = function (id, checked) {
    const t = S.get('tasks', id); if (!t) return;
    S.update('tasks', id, { done: checked, doneAt: checked ? Date.now() : null });
    if (checked) {
      const open = S.data.tasks.filter(x => !x.done).length;
      UI.toast(open === 0 ? 'Every task complete. Take a well-earned break!' : CHEERS[Math.floor(Math.random() * CHEERS.length)], { title: open === 0 ? 'All clear!' : 'Task complete', icon: open === 0 ? 'trophy' : 'check', type: open === 0 ? 'celebrate' : '' });
      if (open === 0) UI.confetti();
    }
    setTimeout(() => App.refresh(), 380);
  };

  function stat(ic, tone, tint, valueHtml, label, extra) {
    return `<div class="card stat lift"><div class="stat-top"><div class="stat-icon" style="--tone:${tone};--tint:${tint}">${icon(ic)}</div>${extra || ''}</div>
      <div><div class="stat-value">${valueHtml}</div><div class="stat-label">${label}</div></div></div>`;
  }
  P.stat = stat;

  function delta(cur, prev) {
    if (!prev && !cur) return '<span class="delta">—</span>';
    if (!prev) return `<span class="delta up">${icon('trend')}New</span>`;
    const p = Math.round((cur - prev) / prev * 100);
    return `<span class="delta ${p >= 0 ? 'up' : 'down'}" title="vs the same point last week">${p >= 0 ? '+' : ''}${p}%</span>`;
  }

  const fmtMinBig = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h}<small>h</small> ${r}<small>m</small>` : `${r}<small>m</small>`; };
  function spark(items, hi) {
    const max = Math.max(1, ...items.map(i => i.m));
    return `<div class="spark">${items.map(i => `<span class="${i.k === hi ? 'hi' : ''}" title="${i.label}: ${fmtMin(i.m)}"><i data-h="${Math.max(6, i.m / max * 100)}"></i></span>`).join('')}</div>`;
  }
  function bigStat(o) {
    return `<div class="card bstat lift" style="--tone:${o.tone};--tint:${o.tint}">
      <div class="bstat-top"><span class="bstat-ico">${icon(o.ic)}</span><span class="bstat-pill">${o.pill}</span></div>
      <div class="bstat-body"><div class="bstat-main"><div class="bstat-value">${o.value}</div><div class="bstat-label">${o.label}</div></div>${o.viz}</div>
      <div class="bstat-foot">${o.foot}</div></div>`;
  }

  /* ======================= DASHBOARD ======================= */
  P.dashboard = function (v) {
    const st = S.settings, t = D.today(), tk = D.key(t), hr = new Date().getHours();
    const todayMin = S.minutesOn(tk);
    const ws = D.sow(t), dayIdx = D.between(ws, t);
    const weekMin = S.minutesRange(ws, D.add(ws, 7));
    const lastSoFar = S.minutesRange(D.add(ws, -7), D.add(ws, dayIdx - 6));
    const lastWeek = S.minutesRange(D.add(ws, -7), ws);
    const streak = S.streak(), best = S.bestStreak();
    const tasks = S.data.tasks, open = tasks.filter(x => !x.done);
    const dueToday = open.filter(x => x.due && x.due <= tk).length;
    const doneWeek = tasks.filter(x => x.done && x.doneAt && x.doneAt >= ws.getTime()).length;
    const dailyPct = Math.min(100, todayMin / st.dailyGoalMin * 100);
    const weeklyPct = Math.min(100, weekMin / (st.weeklyGoalHrs * 60) * 100);
    const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const left = st.dailyGoalMin - todayMin;
    const lead = todayMin === 0 ? 'A fresh day and a clean slate. One focused session is all it takes to get going.'
      : dailyPct < 50 ? `Great start — ${fmtMin(todayMin)} done today. Keep the momentum going.`
        : dailyPct < 100 ? `You're only ${fmtMin(left)} away from today's goal. Finish strong!`
          : `Daily goal complete with ${fmtMin(todayMin)} studied. Outstanding work!`;

    const upcoming = S.data.events.filter(e => e.date >= tk && (e.type === 'exam' || e.type === 'assignment')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
    const todayTasks = [...open].sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])).slice(0, 5);

    // weekly summary
    const sess = S.sessionsIn(ws, D.add(ws, 7));
    const bySub = S.bySubject(ws, D.add(ws, 7));
    const subList = S.subjectsWithGeneral().filter(s => bySub[s.id] > 0).map(s => ({ s, m: bySub[s.id] })).sort((a, b) => b.m - a.m);
    const daysStudied = [...Array(dayIdx + 1)].filter((_, i) => S.minutesOn(D.key(D.add(ws, i))) > 0).length;
    const avgSess = sess.length ? weekMin / sess.length : 0;
    const top = subList[0];
    const weakest = [...S.data.subjects].sort((a, b) => (a.grade - a.target) - (b.grade - b.target))[0];
    const goals = S.data.goals.filter(g => g.current < g.target).slice(0, 2);
    const wkEnd = D.key(D.add(ws, 6));
    const dueWeek = open.filter(x => x.due && x.due <= wkEnd).length;
    const last7 = [...Array(7)].map((_, i) => { const d = D.add(t, i - 6), k = D.key(d); return { k, m: S.minutesOn(k), label: D.fmt(d, { weekday: 'short', day: 'numeric', month: 'short' }) }; });
    const weeks6 = [...Array(6)].map((_, i) => { const s0 = D.add(ws, (i - 5) * 7); return { k: i === 5 ? 'cur' : D.key(s0), m: S.minutesRange(s0, D.add(s0, 7)), label: 'Week of ' + D.fmt(s0) }; });
    const weekDots = [...Array(7)].map((_, i) => { const d = D.add(ws, i), k = D.key(d), m = S.minutesOn(k); return `<i class="${m ? 'on' : ''} ${k === tk ? 'today' : ''} ${d > t ? 'future' : ''}" title="${D.fmt(d, { weekday: 'long' })}: ${m ? fmtMin(m) : 'no study'}">${d.toLocaleDateString('en-ZA', { weekday: 'narrow' })}</i>`; }).join('');

    v.innerHTML = `
    <section class="hero">
      <svg class="hero-waves" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true"><path d="M380 0C470 90 430 170 560 210C680 247 740 200 800 160V0Z" fill="rgba(255,255,255,.07)"/><path d="M500 300C560 220 640 200 720 210C760 215 790 230 800 240V300Z" fill="rgba(255,255,255,.06)"/></svg>
      <div class="hero-art" aria-hidden="true">${icon('cap')}</div>
      <div class="hero-text">
        <div class="eyebrow">${icon('calendar')}${D.fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1>${greet}, ${esc(st.name || 'there')}!</h1>
        <p class="lead">${lead}</p>
        <div class="hero-actions">
          <a class="btn btn-light btn-lg" href="#/timer">${icon('play')}Start focus session</a>
          <button class="btn btn-glass btn-lg" data-act="log">${icon('plus')}Log study time</button>
        </div>
      </div>
      <div class="hero-ring">
        <div class="hero-ring-glow"></div>
        ${ring(dailyPct, { size: 180, stroke: 13, c1: '#ffffff', c2: 'var(--mint)' })}
        <div class="ring-center"><b><span data-count="${Math.round(dailyPct)}" data-suffix="%">0%</span></b><small>of daily goal</small><em>${dailyPct >= 100 ? 'Goal reached' : `${fmtMin(left)} to go`}</em></div>
      </div>
    </section>

    <div class="bstats stagger">
      ${bigStat({ ic: 'clock', tone: 'var(--primary)', tint: 'rgb(var(--p-rgb) / .13)', pill: 'Today', value: fmtMinBig(todayMin), label: 'Studied today', foot: `<span>${Math.round(dailyPct)}% of your ${fmtMin(st.dailyGoalMin)} daily goal</span>`, viz: spark(last7, tk) })}
      ${bigStat({ ic: 'chart', tone: '#10b981', tint: 'rgba(16,185,129,.13)', pill: 'This week', value: `<span data-count="${+(weekMin / 60).toFixed(1)}" data-dec="1" data-suffix="h">0h</span>`, label: 'Studied this week', foot: `${delta(weekMin, lastSoFar)}<span>vs last week · goal ${st.weeklyGoalHrs}h</span>`, viz: spark(weeks6, 'cur') })}
      ${bigStat({ ic: 'flame', tone: '#f43f5e', tint: 'rgba(244,63,94,.12)', pill: 'Current streak', value: `<span data-count="${streak}">0</span> <small>day${streak === 1 ? '' : 's'}</small>`, label: `Study streak · best ${best}`, foot: `<span class="week-dots">${weekDots}</span>`, viz: `<div class="illus">${icon('calendar')}<span class="illus-badge">${icon('star')}</span></div>` })}
      ${bigStat({ ic: 'tasks', tone: '#f59e0b', tint: 'rgba(245,158,11,.14)', pill: `${dueToday} due today`, value: `<span data-count="${open.length}">0</span> <small>open</small>`, label: `Tasks · ${dueWeek} due this week`, foot: `<span class="foot-ok">${icon('check')}${doneWeek} completed this week</span>`, viz: `<div class="illus"><span class="checklist"><i></i><i></i><i></i></span></div>` })}
    </div>

    <section class="card qa-card">
      <div class="card-head"><h3>Quick actions</h3><a class="link" href="#/goals">Track progress${icon('arrow')}</a></div>
      <div class="qa-row stagger">
        <a class="qa-btn" href="#/timer"><span class="qa-ico" style="--tone:var(--primary);--tint:rgb(var(--p-rgb) / .13)">${icon('play')}</span>Start timer</a>
        <button class="qa-btn" data-act="add-task"><span class="qa-ico" style="--tone:#f59e0b;--tint:rgba(245,158,11,.14)">${icon('check')}</span>Add task</button>
        <button class="qa-btn" data-act="add-event"><span class="qa-ico" style="--tone:#0284c7;--tint:rgba(2,132,199,.12)">${icon('calendar')}</span>Add event</button>
        <button class="qa-btn" data-act="new-note"><span class="qa-ico" style="--tone:#e11d48;--tint:rgba(225,29,72,.11)">${icon('notes')}</span>New note</button>
        <button class="qa-btn" data-act="log"><span class="qa-ico" style="--tone:#10b981;--tint:rgba(16,185,129,.13)">${icon('clock')}</span>Log session</button>
        <a class="qa-btn" href="#/analytics"><span class="qa-ico" style="--tone:#7c3aed;--tint:rgba(124,58,237,.11)">${icon('chart')}</span>Analytics</a>
      </div>
    </section>

    <div class="grid dash-grid">
      <div class="card span-2">
        <div class="card-head"><div><h3><span class="head-icon">${icon('chart')}</span>This week's study hours</h3><div class="sub">${fmtMin(weekMin)} of ${st.weeklyGoalHrs}h weekly goal · hover a bar for details</div></div><a class="link" href="#/analytics">Full analytics${icon('arrow')}</a></div>
        <div class="chart-box sm"><canvas id="c-week"></canvas></div>
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="head-icon">${icon('target')}</span>Study goals</h3><a class="link" href="#/goals">All goals${icon('arrow')}</a></div>
        <div class="progress-row"><div class="progress-meta"><b>Daily goal</b><span>${fmtMin(todayMin)} / ${fmtMin(st.dailyGoalMin)}</span></div>${bar(dailyPct, dailyPct >= 100 ? 'linear-gradient(90deg,#34d399,#10b981)' : '')}</div>
        <div class="progress-row"><div class="progress-meta"><b>Weekly goal</b><span>${fmtH(weekMin)} / ${st.weeklyGoalHrs}h</span></div>${bar(weeklyPct, weeklyPct >= 100 ? 'linear-gradient(90deg,#34d399,#10b981)' : '')}</div>
        ${goals.map(g => { const s = S.subject(g.subjectId); return `<div class="progress-row"><div class="progress-meta"><b>${esc(g.title)}</b><span>${g.current}/${g.target}</span></div>${bar(g.current / g.target * 100, s.color, 'sm')}</div>`; }).join('')}
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="head-icon">${icon('flag')}</span>Upcoming deadlines</h3><a class="link" href="#/calendar">Calendar${icon('arrow')}</a></div>
        <div class="list stagger">${upcoming.length ? upcoming.map(deadlineItem).join('') : UI.empty('calendar', 'Nothing due soon', 'Add exams and assignments to see them here.', `<button class="btn btn-soft btn-sm" data-act="add-event">${icon('plus')}Add event</button>`)}</div>
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="head-icon">${icon('tasks')}</span>Up next</h3><a class="link" href="#/tasks">All tasks${icon('arrow')}</a></div>
        <div class="list">${todayTasks.length ? todayTasks.map(x => taskRow(x, true)).join('') : UI.empty('check', 'All caught up', 'No open tasks. Add one below.')}</div>
        <form class="quick-add" data-form="quick-task"><input class="input" name="title" placeholder="Quick add a task for today…" maxlength="140" required aria-label="New task"><button class="icon-btn" style="background:var(--grad);color:#fff;border:0" aria-label="Add task">${icon('plus')}</button></form>
      </div>

      <div class="card quote-card">
        <div class="q-mark">${icon('quote')}</div>
        <div class="card-head"><h3><span class="head-icon">${icon('sparkles')}</span>Daily inspiration</h3></div>
        <div class="quote-wrap" id="quote"><p class="quote-text"></p><p class="quote-author"></p></div>
        <div class="dots" id="quote-dots">${QUOTES.slice(0, 7).map((_, i) => `<button data-q="${i}" aria-label="Quote ${i + 1}"></button>`).join('')}<div class="q-progress"><span id="q-bar"></span></div></div>
      </div>

      <div class="card span-all">
        <div class="card-head"><div><h3><span class="head-icon">${icon('trend')}</span>Weekly productivity summary</h3><div class="sub">Week of ${D.fmt(ws, { day: 'numeric', month: 'long' })}</div></div></div>
        <div class="summary-grid">
          <div><b>${fmtH(weekMin)}</b><small>Total studied</small></div>
          <div><b>${sess.length}</b><small>Sessions</small></div>
          <div><b>${daysStudied}/${dayIdx + 1}</b><small>Days studied</small></div>
          <div><b>${fmtMin(avgSess)}</b><small>Avg. session</small></div>
        </div>
        ${subList.length ? subList.slice(0, 4).map(({ s, m }) => `<div class="progress-row"><div class="progress-meta"><b><span class="sdot" style="--c:${s.color};margin-right:6px"></span>${esc(s.name)}</b><span>${fmtMin(m)} · ${Math.round(m / weekMin * 100)}%</span></div>${bar(m / subList[0].m * 100, s.color, 'sm')}</div>`).join('') : UI.empty('chart', 'No study logged yet this week', 'Start the timer or log a session to see your summary.')}
        <div class="insight">${icon('brain')}<div>${top ? `<b>${esc(top.s.name)}</b> has had the most attention this week. ` : ''}${lastWeek ? `Last week you studied <b>${fmtH(lastWeek)}</b>${weekMin >= lastSoFar ? ' — you’re ahead of that pace.' : ' — a couple of sessions will get you back on pace.'}` : ''} ${weakest && weakest.grade < weakest.target ? `Consider an extra session for <b>${esc(weakest.name)}</b>: it's ${weakest.target - weakest.grade}% below target.` : ''}</div></div>
      </div>

    </div>`;

    Charts.weekTotals($('#c-week', v));
    startQuotes(v);

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'log') Forms.session();
      else if (act === 'add-task') Forms.task();
      else if (act === 'add-event') Forms.event();
      else if (act === 'edit-event') Forms.event(S.get('events', a.dataset.id));
      else if (act === 'new-note') { Pages.newNote(); location.hash = '#/notes'; }
    };
    v.onchange = e => { const c = e.target.closest('[data-toggle]'); if (c) { c.closest('.task').classList.toggle('done', c.checked); P.toggleTask(c.dataset.toggle, c.checked); } };
    v.onsubmit = e => {
      const f = e.target.closest('[data-form="quick-task"]'); if (!f) return;
      e.preventDefault();
      const title = f.title.value.trim(); if (!title) return;
      S.add('tasks', { title, subjectId: null, due: tk, priority: 'medium', done: false, created: Date.now(), doneAt: null });
      UI.toast(`“${title}” added for today`, { title: 'Task added', icon: 'tasks' });
      App.refresh();
    };
  };

  function startQuotes(v) {
    const wrap = $('#quote', v), dots = $$('#quote-dots [data-q]', v), qbar = $('#q-bar', v);
    const N = dots.length, DUR = 8000;
    let i = (Math.floor(Date.now() / 864e5)) % N, paused = false, timer;
    const pool = QUOTES.slice(0, N);
    const runBar = () => { qbar.classList.remove('run'); qbar.style.width = '0'; void qbar.offsetWidth; qbar.style.animationDuration = DUR + 'ms'; qbar.style.width = ''; qbar.classList.add('run'); };
    const show = (n, anim = true) => {
      i = (n + N) % N;
      const set = () => { $('.quote-text', wrap).textContent = `“${pool[i][0]}”`; $('.quote-author', wrap).textContent = '— ' + pool[i][1]; dots.forEach((d, k) => d.classList.toggle('on', k === i)); wrap.classList.remove('out'); };
      if (anim) { wrap.classList.add('out'); setTimeout(set, 420); } else set();
      runBar();
    };
    const schedule = () => { clearInterval(timer); timer = setInterval(() => { if (!paused && !document.hidden) show(i + 1); }, DUR); App.track(timer); };
    show(i, false); schedule();
    dots.forEach(d => d.onclick = () => { show(+d.dataset.q); schedule(); });
    const card = wrap.closest('.card');
    card.onmouseenter = () => { paused = true; qbar.style.animationPlayState = 'paused'; };
    card.onmouseleave = () => { paused = false; qbar.style.animationPlayState = 'running'; };
  }

  /* ======================= ANALYTICS ======================= */
  const A = { week: 0, month: 0, dist: 'month' };
  P.analytics = function (v) {
    const t = D.today(), last30 = D.add(t, -29);
    const total = S.totalMinutes();
    const days30 = [...Array(30)].map((_, i) => { const k = D.key(D.add(last30, i)); return { k, m: S.minutesOn(k) }; });
    const studied = days30.filter(d => d.m > 0);
    const avg = studied.length ? studied.reduce((a, d) => a + d.m, 0) / studied.length : 0;
    const bestDay = days30.reduce((b, d) => d.m > b.m ? d : b, { m: 0, k: null });
    const monthSess = S.sessionsIn(D.som(t), D.add(t, 1)).length;
    const consistency = Math.round(studied.length / 30 * 100);

    v.innerHTML = `
    <div class="stats-grid stagger" style="margin-top:8px">
      ${stat('clock', 'var(--primary)', 'rgb(var(--p-rgb) / .12)', `<span data-count="${Math.round(total / 60)}" data-suffix="h">0h</span>`, 'Total study time', `<span class="delta">${S.data.sessions.length} sessions</span>`)}
      ${stat('trend', '#0ea5e9', 'rgba(14,165,233,.12)', fmtMin(avg), 'Avg. per study day (30d)', `<span class="delta up">${consistency}% consistency</span>`)}
      ${stat('star', '#f59e0b', 'rgba(245,158,11,.14)', fmtMin(bestDay.m), 'Best day (30d)', bestDay.k ? `<span class="delta">${D.fmt(bestDay.k, { weekday: 'short', day: 'numeric', month: 'short' })}</span>` : '')}
      ${stat('zap', '#10b981', 'rgba(16,185,129,.12)', `<span data-count="${monthSess}">0</span>`, 'Sessions this month', `<span class="delta">${S.data.stats.pomodoros || 0} timer</span>`)}
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('chart')}</span>Weekly study hours</h3><div class="sub" id="week-label"></div></div>
          <div class="card-actions"><button class="icon-btn sm" data-act="week" data-d="-1" aria-label="Previous week">${icon('left')}</button><button class="btn btn-ghost btn-sm" data-act="week" data-d="0">This week</button><button class="icon-btn sm" data-act="week" data-d="1" aria-label="Next week">${icon('right')}</button></div></div>
        <div class="chart-box"><canvas id="c-weekly"></canvas></div>
        <div class="legend" id="week-legend"></div>
      </div>

      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('trend')}</span>Monthly productivity</h3><div class="sub" id="month-label"></div></div>
          <div class="card-actions"><button class="icon-btn sm" data-act="month" data-d="-1" aria-label="Previous month">${icon('left')}</button><button class="icon-btn sm" data-act="month" data-d="1" aria-label="Next month">${icon('right')}</button></div></div>
        <div class="chart-box"><canvas id="c-monthly"></canvas></div>
        <div class="legend" id="month-legend"></div>
      </div>

      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('award')}</span>Subject performance</h3><div class="sub">Current mark vs target · edit marks on the Subjects page</div></div><a class="link" href="#/subjects">Update marks${icon('arrow')}</a></div>
        <div class="chart-box">${S.data.subjects.length ? '<canvas id="c-perf"></canvas>' : UI.empty('book', 'No subjects yet', 'Add subjects to compare performance.')}</div>
        <div class="legend"><span><i style="--c:var(--primary)"></i>Current mark</span><span><i style="--c:var(--primary-soft);outline:1.5px solid var(--primary)"></i>Target</span></div>
      </div>

      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('pie')}</span>Study time distribution</h3><div class="sub">Hover a slice or tap a subject to toggle it</div></div>
          <div class="seg" id="dist-seg">${[['week', 'Week'], ['month', 'Month'], ['all', 'All time']].map(([k, l]) => `<button data-act="dist" data-r="${k}" class="${A.dist === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="dist-wrap"><div class="chart-box sm"><canvas id="c-dist"></canvas></div><div class="dist-legend" id="dist-legend"></div></div>
      </div>

      <div class="card span-all">
        <div class="card-head"><div><h3><span class="head-icon">${icon('target')}</span>Weekly progress tracking</h3><div class="sub">Last 12 weeks against your ${S.settings.weeklyGoalHrs}h weekly goal</div></div>
          <div class="legend" style="margin:0"><span><i style="--c:var(--primary)"></i>Goal met</span><span><i style="--c:rgb(var(--p-rgb) / .28)"></i>Below goal</span><span><i style="--c:#f59e0b"></i>4-week average</span><span><i class="dash" style="--c:var(--muted)"></i>Goal</span></div></div>
        <div class="chart-box lg"><canvas id="c-progress"></canvas></div>
      </div>
    </div>`;

    let wk = null, mo = null, di = null;
    const drawWeek = () => {
      Charts.kill(wk);
      const ws = D.add(D.sow(t), A.week * 7);
      const tot = S.minutesRange(ws, D.add(ws, 7));
      $('#week-label', v).textContent = `${D.fmt(ws)} – ${D.fmt(D.add(ws, 6), { day: 'numeric', month: 'short', year: 'numeric' })} · ${fmtMin(tot)} total`;
      wk = Charts.weekly($('#c-weekly', v), ws);
      const by = S.bySubject(ws, D.add(ws, 7));
      $('#week-legend', v).innerHTML = S.subjectsWithGeneral().filter(s => by[s.id] > 0).map(s => `<span><i style="--c:${s.color}"></i>${esc(s.name)}</span>`).join('') + `<span><i class="dash" style="--c:var(--primary)"></i>Daily goal</span>`;
      $$('[data-act="week"][data-d="1"]', v).forEach(b => b.disabled = A.week >= 0);
    };
    const drawMonth = () => {
      Charts.kill(mo);
      const m = new Date(t.getFullYear(), t.getMonth() + A.month, 1), p = new Date(m.getFullYear(), m.getMonth() - 1, 1);
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const ongoing = end > t, cur = S.minutesRange(m, ongoing ? D.add(t, 1) : end);
      // compare like-for-like: same number of elapsed days in the previous month
      const pEnd = ongoing ? new Date(p.getFullYear(), p.getMonth(), Math.min(t.getDate() + 1, new Date(p.getFullYear(), p.getMonth() + 1, 0).getDate() + 1)) : m;
      const prev = S.minutesRange(p, pEnd);
      const ch = prev ? Math.round((cur - prev) / prev * 100) : 0;
      $('#month-label', v).innerHTML = `${m.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })} · ${fmtMin(cur)} ${prev ? `<span class="delta ${ch >= 0 ? 'up' : 'down'}" style="margin-left:4px" title="${ongoing ? 'Compared with the same days last month' : 'Compared with the previous month'}">${ch >= 0 ? '+' : ''}${ch}% vs ${p.toLocaleDateString('en-ZA', { month: 'short' })}</span>` : ''}`;
      mo = Charts.monthly($('#c-monthly', v), A.month);
      $('#month-legend', v).innerHTML = `<span><i style="--c:var(--primary)"></i>${m.toLocaleDateString('en-ZA', { month: 'long' })}</span><span><i class="dash" style="--c:var(--muted)"></i>${p.toLocaleDateString('en-ZA', { month: 'long' })}</span>`;
      $$('[data-act="month"][data-d="1"]', v).forEach(b => b.disabled = A.month >= 0);
    };
    const drawDist = () => {
      Charts.kill(di && di.chart);
      di = Charts.distribution($('#c-dist', v), A.dist);
      const L = $('#dist-legend', v);
      L.innerHTML = di.items.length ? di.items.map((it, i) => `<button class="dist-item" data-di="${i}"><span class="dot" style="--c:${it.s.color}"></span><b>${esc(it.s.name)}</b><span>${fmtMin(it.min)}</span><em>${Math.round(it.min / di.total * 100)}%</em></button>`).join('') : UI.empty('pie', 'No sessions in this range', 'Study a little and check back.');
      $$('[data-di]', L).forEach(b => {
        const i = +b.dataset.di;
        b.onclick = () => { if (!di.chart) return; di.chart.toggleDataVisibility(i); di.chart.update(); b.classList.toggle('off', !di.chart.getDataVisibility(i)); };
        b.onmouseenter = () => { if (!di.chart || !di.chart.getDataVisibility(i)) return; di.chart.setActiveElements([{ datasetIndex: 0, index: i }]); di.chart.tooltip.setActiveElements([{ datasetIndex: 0, index: i }], { x: 0, y: 0 }); di.chart.update(); };
        b.onmouseleave = () => { if (!di.chart) return; di.chart.setActiveElements([]); di.chart.tooltip.setActiveElements([], { x: 0, y: 0 }); di.chart.update(); };
      });
    };
    drawWeek(); drawMonth(); drawDist();
    if (S.data.subjects.length) Charts.performance($('#c-perf', v));
    Charts.progress($('#c-progress', v), innerWidth < 600 ? 8 : 12);

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a || a.disabled) return;
      if (a.dataset.act === 'week') { const d = +a.dataset.d; A.week = d === 0 ? 0 : Math.min(0, A.week + d); drawWeek(); }
      if (a.dataset.act === 'month') { A.month = Math.min(0, A.month + +a.dataset.d); drawMonth(); }
      if (a.dataset.act === 'dist') { A.dist = a.dataset.r; $$('#dist-seg button', v).forEach(b => b.classList.toggle('on', b === a)); drawDist(); }
    };
  };

  /* ======================= GOALS ======================= */
  P.goals = function (v) {
    const st = S.settings, t = D.today(), tk = D.key(t), ws = D.sow(t);
    const todayMin = S.minutesOn(tk), weekMin = S.minutesRange(ws, D.add(ws, 7));
    const dPct = Math.min(100, todayMin / st.dailyGoalMin * 100), wPct = Math.min(100, weekMin / (st.weeklyGoalHrs * 60) * 100);
    const streak = S.streak(), best = S.bestStreak();
    const goals = [...S.data.goals].sort((a, b) => (a.current >= a.target) - (b.current >= b.target));
    const ms = Milestones.list();
    const unlocked = ms.filter(m => m.done).length;

    const weeks = innerWidth < 600 ? 15 : 24;
    const start = D.add(D.sow(t), -7 * (weeks - 1));
    let cells = '';
    for (let i = 0; i < weeks * 7; i++) {
      const d = D.add(start, i), k = D.key(d), m = S.minutesOn(k);
      if (d > t) { cells += '<i class="future"></i>'; continue; }
      const l = m === 0 ? 0 : m < 45 ? 1 : m < 90 ? 2 : m < 150 ? 3 : 4;
      cells += `<i class="l${l} ${k === tk ? 'today' : ''}" data-k="${k}" data-m="${m}" title="${D.fmt(k, { weekday: 'short', day: 'numeric', month: 'short' })}: ${m ? fmtMin(m) : 'no study'}"></i>`;
    }
    const activeDays = Object.keys(S.days()).filter(k => k >= D.key(start) && S.minutesOn(k) > 0).length;

    const wb = [...Array(7)].map((_, i) => { const d = D.add(ws, i), k = D.key(d), m = S.minutesOn(k); return `<div class="${k === tk ? 'today' : ''}" title="${D.fmt(k, { weekday: 'long' })}: ${fmtMin(m)}"><div class="wb ${m >= st.dailyGoalMin ? 'met' : ''}"><span data-h="${Math.min(100, m / st.dailyGoalMin * 100)}"></span></div><small>${d.toLocaleDateString('en-ZA', { weekday: 'narrow' })}</small></div>`; }).join('');

    const msg = dPct >= 100 ? 'Daily goal smashed — anything more is a bonus!' : dPct >= 50 ? `Over halfway! ${fmtMin(st.dailyGoalMin - todayMin)} to go.` : todayMin ? `Good start. ${fmtMin(st.dailyGoalMin - todayMin)} left today.` : 'Start a session to begin today’s progress.';

    v.innerHTML = `
    <div class="grid grid-3" style="margin-top:8px">
      <div class="card lift">
        <div class="card-head"><h3><span class="head-icon">${icon('sun')}</span>Daily goal</h3><button class="link" data-act="edit-daily">${icon('edit')}Edit</button></div>
        <div style="display:flex;align-items:center;gap:20px">
          <div style="position:relative;width:120px;height:120px;flex-shrink:0">${ring(dPct, { stroke: 11 })}<div class="ring-center"><b style="font-size:24px;font-weight:800"><span data-count="${Math.round(dPct)}" data-suffix="%">0%</span></b><small class="muted" style="font-size:11px;font-weight:600">complete</small></div></div>
          <div><div class="stat-value" style="font-size:22px">${fmtMin(todayMin)}</div><div class="muted small">of ${fmtMin(st.dailyGoalMin)} today</div><p class="small" style="margin-top:10px;font-weight:600;color:var(--text-2)">${msg}</p></div>
        </div>
      </div>
      <div class="card lift">
        <div class="card-head"><h3><span class="head-icon">${icon('calendar')}</span>Weekly goal</h3><button class="link" data-act="edit-weekly">${icon('edit')}Edit</button></div>
        <div class="progress-meta"><b style="font-size:22px;font-weight:800">${fmtH(weekMin)} <span class="muted" style="font-size:13px;font-weight:600">/ ${st.weeklyGoalHrs}h</span></b><span>${Math.round(wPct)}%</span></div>
        <div style="margin-top:10px">${bar(wPct, wPct >= 100 ? 'linear-gradient(90deg,#34d399,#10b981)' : '', 'lg')}</div>
        <div class="week-bars">${wb}</div>
      </div>
      <div class="card lift">
        <div class="card-head"><h3><span class="head-icon">${icon('flame')}</span>Study streak</h3></div>
        <div class="streak-big"><div class="flame-box">${icon('flame')}</div><div><div class="stat-value"><span data-count="${streak}">0</span> days</div><div class="muted small">Best streak: ${best} days</div></div></div>
        <p class="small" style="margin-top:16px;color:var(--text-2);font-weight:600">${S.minutesOn(tk) ? 'You’ve studied today — streak secured.' : streak ? 'Study today to keep your streak alive!' : 'Study today to start a new streak.'}</p>
        <div style="margin-top:12px">${bar(Math.min(100, streak / Math.max(7, best) * 100), 'linear-gradient(90deg,#fb923c,#f43f5e)', 'sm')}</div>
        <div class="muted small" style="margin-top:6px">${streak >= best && best ? 'This is your personal best!' : `${Math.max(0, best - streak + 1)} more day${best - streak + 1 === 1 ? '' : 's'} to beat your record`}</div>
      </div>
    </div>

    <div class="grid grid-2 mt">
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('target')}</span>Personal academic goals</h3><div class="sub">${goals.filter(g => g.current >= g.target).length} of ${goals.length} achieved</div></div><button class="btn btn-primary btn-sm" data-act="add-goal">${icon('plus')}New goal</button></div>
        <div class="list stagger">${goals.length ? goals.map(g => {
          const s = S.subject(g.subjectId), pct = Math.min(100, g.current / g.target * 100), done = g.current >= g.target;
          const dl = g.deadline ? D.days(g.deadline) : null;
          return `<div class="goal-item ${done ? 'complete' : ''}">
            <div class="goal-top"><div class="item-body"><h4>${esc(g.title)}</h4><div class="item-meta"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}${g.deadline ? ` · ${dl < 0 ? 'Deadline passed' : `${dl} days left`}` : ''}${done ? ` · <span class="pill success">${icon('check')}Achieved</span>` : ''}</div></div>
              <button class="icon-btn sm plain" data-act="edit-goal" data-id="${g.id}" aria-label="Edit goal">${icon('edit')}</button></div>
            <div style="display:flex;align-items:center;gap:12px"><div style="flex:1">${bar(pct, done ? 'linear-gradient(90deg,#34d399,#10b981)' : s.color)}</div>
              <div class="goal-ctrls"><button class="icon-btn sm" data-act="dec" data-id="${g.id}" aria-label="Decrease">${icon('minus')}</button><span class="goal-val">${+g.current.toFixed(2)}/${g.target}${g.unit ? ` <span class="muted" style="font-weight:600">${esc(g.unit)}</span>` : ''}</span><button class="icon-btn sm" data-act="inc" data-id="${g.id}" aria-label="Increase">${icon('plus')}</button></div></div>
          </div>`;
        }).join('') : UI.empty('target', 'No goals yet', 'Set a goal like “Finish 10 past papers” and track it here.', `<button class="btn btn-soft btn-sm" data-act="add-goal">${icon('plus')}Create a goal</button>`)}</div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head"><div><h3><span class="head-icon">${icon('grid')}</span>Visual progress tracker</h3><div class="sub">${activeDays} active days in the last ${weeks} weeks</div></div></div>
          <div class="heatmap" id="heat">${cells}</div>
          <div class="heat-foot"><span class="heat-info" id="heat-info">Hover or tap a day for details</span><span class="heat-scale">Less <i style="background:var(--primary-soft)"></i><i style="background:color-mix(in srgb,var(--primary) 28%,var(--surface))"></i><i style="background:color-mix(in srgb,var(--primary) 50%,var(--surface))"></i><i style="background:color-mix(in srgb,var(--primary) 75%,var(--surface))"></i><i style="background:var(--primary)"></i> More</span></div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3><span class="head-icon">${icon('trophy')}</span>Achievements</h3><div class="sub">${unlocked} of ${ms.length} unlocked</div></div><span class="pill">${Math.round(unlocked / ms.length * 100)}%</span></div>
          <div style="margin-bottom:16px">${bar(unlocked / ms.length * 100)}</div>
          <div class="badges stagger">${ms.map(m => `<div class="badge-card ${m.done ? '' : 'locked'}" title="${esc(m.desc)}">
            <div class="badge-ico">${icon(m.icon)}</div><h5>${esc(m.title)}</h5><p>${esc(m.desc)}</p>
            ${m.done ? `<div class="when">${icon('check', 'ic-inline')} Unlocked ${m.when ? D.fmt(m.when) : ''}</div>` : `${bar(m.cur / m.goal * 100, '', 'sm')}<div class="muted" style="font-size:11px;font-weight:700;margin-top:6px">${m.fmt(m.cur)} / ${m.fmt(m.goal)}</div>`}
          </div>`).join('')}</div>
        </div>
      </div>
    </div>`;

    // fix inline icon size in badges
    $$('.when .ic', v).forEach(i => { i.style.cssText = 'width:12px;height:12px;display:inline-block;vertical-align:-2px'; });

    const info = $('#heat-info', v);
    const showDay = el => { if (!el || !el.dataset.k) return; const m = +el.dataset.m; info.textContent = `${D.fmt(el.dataset.k, { weekday: 'long', day: 'numeric', month: 'long' })} — ${m ? fmtMin(m) + ' studied' : 'no study logged'}`; };
    $('#heat', v).addEventListener('mouseover', e => showDay(e.target.closest('i')));
    $('#heat', v).addEventListener('click', e => showDay(e.target.closest('i')));

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act, g = a.dataset.id && S.get('goals', a.dataset.id);
      if (act === 'add-goal') Forms.goal();
      else if (act === 'edit-goal') Forms.goal(g);
      else if (act === 'inc' || act === 'dec') {
        const was = g.current >= g.target;
        const next = Math.max(0, +(g.current + (act === 'inc' ? 1 : -1)).toFixed(2));
        S.update('goals', g.id, { current: next });
        if (!was && next >= g.target) { UI.toast(`“${g.title}” complete. Incredible dedication!`, { title: 'Goal achieved!', icon: 'trophy', type: 'celebrate', duration: 5200 }); UI.confetti(); }
        App.refresh();
      } else if (act === 'edit-daily' || act === 'edit-weekly') editStudyGoals();
    };
  };

  function editStudyGoals() {
    const st = S.settings;
    UI.modal({
      title: 'Study goals',
      body: `<div class="row"><div class="field"><label>Daily goal (minutes)</label><input class="input" type="number" name="daily" min="10" max="900" step="5" required value="${st.dailyGoalMin}"><span class="hint">${fmtMin(st.dailyGoalMin)} currently</span></div>
        <div class="field"><label>Weekly goal (hours)</label><input class="input" type="number" name="weekly" min="1" max="100" step="0.5" required value="${st.weeklyGoalHrs}"></div></div>`,
      submitLabel: 'Save goals',
      onSubmit(f) {
        Object.assign(S.settings, { dailyGoalMin: Math.round(+f.daily), weeklyGoalHrs: +f.weekly });
        S.commit(); UI.toast('Study goals updated', { icon: 'target' }); App.refresh();
      },
    });
  }
  P.editStudyGoals = editStudyGoals;
})();
