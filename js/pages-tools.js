/* StudyHub — Timer, Tasks, Calendar, Notes, Subjects, Settings pages */
(function () {
  const { esc, bar, $, $$ } = UI;
  const P = window.Pages = window.Pages || {};
  const tkey = () => D.key(D.today());

  /* ======================= TIMER ======================= */
  P.timer = function (v) {
    const s = Timer.s, st = S.settings, tk = tkey();
    const todays = S.data.sessions.filter(x => x.date === tk).sort((a, b) => (b.created || 0) - (a.created || 0));
    const todayMin = todays.reduce((a, x) => a + x.minutes, 0);
    const recent = [...S.data.sessions].filter(x => x.date !== tk).sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0)).slice(0, 6);
    const R = 150, C = 2 * Math.PI * R;
    const row = x => { const sb = S.subject(x.subjectId); return `<div class="session-row"><div class="s-ico" style="--c:${sb.color}">${icon(x.source === 'timer' ? 'timer' : 'clock')}</div><div class="item-body"><b>${esc(sb.name)}</b><div class="item-meta">${x.date === tk ? (x.created ? new Date(x.created).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'Today') : D.fmt(x.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${x.source === 'timer' ? 'Timer' : 'Logged'}</div></div><span class="mins">${fmtMin(x.minutes)}</span><button class="icon-btn sm plain danger" data-act="del-session" data-id="${x.id}" aria-label="Delete session">${icon('trash')}</button></div>`; };

    v.innerHTML = `
    <div class="grid timer-grid" style="margin-top:8px">
      <div class="card timer-card" id="timer-card">
        <div class="seg">${Object.keys(Timer.MODE).map(m => `<button data-act="mode" data-mode="${m}" class="${s.mode === m ? 'on' : ''}">${Timer.MODE[m]}</button>`).join('')}</div>
        <div class="timer-ring">
          <svg class="ring" viewBox="0 0 320 320" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--ring-1)"/><stop offset="1" style="stop-color:var(--ring-2)"/></linearGradient></defs>
            <circle class="bg" cx="160" cy="160" r="${R}" stroke-width="12"/>
            <circle class="fg" cx="160" cy="160" r="${R}" stroke-width="12" stroke="url(#tg)" stroke-dasharray="${C}" stroke-dashoffset="0" data-c="${C}" data-timer-ring/></svg>
          <div class="ring-center"><div class="timer-time" data-timer-time aria-live="off">00:00</div><div class="timer-label" data-timer-label></div></div>
        </div>
        <div class="timer-subject"><span class="label">Studying</span><select class="select" data-timer-subject aria-label="Subject">${UI.subjectOptions(S.validSubject(s.subjectId))}</select></div>
        <div class="timer-ctrls">
          <button class="icon-btn lg" data-act="reset" title="Reset" aria-label="Reset timer">${icon('reset')}</button>
          <button class="play-btn" data-act="toggle" data-timer-toggle aria-label="Start timer">${icon('play')}</button>
          <button class="icon-btn lg" data-act="skip" title="Skip to next" aria-label="Skip">${icon('skip')}</button>
        </div>
        <button class="btn btn-soft btn-sm finish-btn" data-act="finish" data-timer-finish hidden>${icon('check')}Finish early &amp; log time</button>
        <div class="cycle-dots">${[0, 1, 2, 3].map(i => `<span class="${i < (s.cycle % 4) ? 'on' : ''}"></span>`).join('')}</div>
        <p class="muted small" style="margin-top:8px">Focus round ${(s.cycle % 4) + 1} of 4 · long break after every 4th · ${S.data.stats.pomodoros || 0} completed all-time</p>
        <p class="muted small" style="margin-top:4px">Shortcut: press <b>Space</b> to start / pause</p>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head"><div><h3><span class="head-icon">${icon('clock')}</span>Today</h3><div class="sub">${fmtMin(todayMin)} of ${fmtMin(st.dailyGoalMin)} goal</div></div><button class="btn btn-soft btn-sm" data-act="log">${icon('plus')}Log manually</button></div>
          ${bar(todayMin / st.dailyGoalMin * 100, todayMin >= st.dailyGoalMin ? 'linear-gradient(90deg,#34d399,#10b981)' : '')}
          <div style="margin-top:10px">${todays.length ? todays.map(row).join('') : UI.empty('timer', 'No sessions yet today', 'Press play to start your first focus session.')}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="head-icon">${icon('settings')}</span>Timer settings</h3></div>
          ${[['focusMin', 'Focus length', 'Deep-work block', 5, 120], ['shortMin', 'Short break', 'After each focus round', 1, 30], ['longMin', 'Long break', 'After every 4 rounds', 5, 60]].map(([k, l, d, mn, mx]) => `<div class="setting-row"><div><b>${l}</b><small>${d}</small></div><div class="num-input"><button class="icon-btn sm" data-act="len" data-k="${k}" data-d="-${k === 'shortMin' ? 1 : 5}" aria-label="Decrease">${icon('minus')}</button><input class="input" type="number" min="${mn}" max="${mx}" value="${st[k]}" data-len="${k}" aria-label="${l} in minutes"><button class="icon-btn sm" data-act="len" data-k="${k}" data-d="${k === 'shortMin' ? 1 : 5}" aria-label="Increase">${icon('plus')}</button></div></div>`).join('')}
          <div class="setting-row"><div><b>Completion sound</b><small>Gentle chime when a round ends</small></div><label class="switch"><input type="checkbox" data-sound ${st.sound ? 'checked' : ''}><span></span></label></div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="head-icon">${icon('layers')}</span>Recent sessions</h3><a class="link" href="#/analytics">Analytics${icon('arrow')}</a></div>
          ${recent.length ? recent.map(row).join('') : UI.empty('layers', 'No history yet', 'Completed sessions will appear here.')}
        </div>
      </div>
    </div>`;

    const ranges = { focusMin: [5, 120], shortMin: [1, 30], longMin: [5, 60] };
    const setLen = (k, val) => {
      const [mn, mx] = ranges[k];
      S.settings[k] = Math.min(mx, Math.max(mn, Math.round(+val || mn)));
      S.commit(); Timer.syncLength();
      const inp = $(`[data-len="${k}"]`, v); if (inp) inp.value = S.settings[k];
    };

    v.onclick = async e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'toggle') Timer.toggle();
      else if (act === 'reset') {
        if (Timer.s.mode === 'focus' && Timer.elapsed() >= 60 && !(await UI.confirm(`Discard ${fmtMin(Timer.elapsed() / 60)} of focus time? Use “Finish early” to keep it.`, { title: 'Reset timer?', label: 'Discard & reset' }))) return;
        Timer.reset();
      }
      else if (act === 'skip') { Timer.skip(); App.refresh(); }
      else if (act === 'finish') Timer.finish();
      else if (act === 'mode') {
        if (Timer.s.mode === a.dataset.mode) return;
        if (Timer.s.running && !(await UI.confirm('Switching modes will stop the current timer.', { title: 'Switch mode?', label: 'Switch', danger: false }))) return;
        Timer.setMode(a.dataset.mode); $$('[data-act="mode"]', v).forEach(b => b.classList.toggle('on', b === a));
      }
      else if (act === 'log') Forms.session({ subjectId: S.validSubject(Timer.s.subjectId) });
      else if (act === 'len') setLen(a.dataset.k, S.settings[a.dataset.k] + +a.dataset.d);
      else if (act === 'del-session') {
        if (await UI.confirm('This session will be removed from your study log and stats.', { title: 'Delete session?' })) { S.remove('sessions', a.dataset.id); UI.toast('Session deleted', { icon: 'trash' }); App.refresh(); }
      }
    };
    v.onchange = e => {
      if (e.target.matches('[data-timer-subject]')) Timer.setSubject(e.target.value);
      else if (e.target.matches('[data-len]')) setLen(e.target.dataset.len, e.target.value);
      else if (e.target.matches('[data-sound]')) { S.settings.sound = e.target.checked; S.commit(); if (e.target.checked) UI.beep(); }
    };
  };

  /* ======================= TASKS ======================= */
  const TK = { filter: 'active', subj: '__all', sort: 'due' };
  P.tasks = function (v) {
    const tk = tkey(), all = S.data.tasks;
    const done = all.filter(t => t.done).length;
    const pr = { high: 0, medium: 1, low: 2 };
    let list = all.filter(t => TK.subj === '__all' || (t.subjectId || '') === TK.subj);
    const sorter = TK.sort === 'priority' ? (a, b) => pr[a.priority] - pr[b.priority] || (a.due || '9999').localeCompare(b.due || '9999')
      : TK.sort === 'recent' ? (a, b) => (b.created || 0) - (a.created || 0)
        : (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || pr[a.priority] - pr[b.priority];
    list.sort(sorter);
    const open = list.filter(t => !t.done), closed = list.filter(t => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    const wk = D.key(D.add(D.today(), 7));
    const groups = [];
    if (TK.filter !== 'done') {
      if (TK.sort === 'due') {
        groups.push(['Overdue', open.filter(t => t.due && t.due < tk), 'overdue']);
        groups.push(['Today', open.filter(t => t.due === tk)]);
        groups.push(['This week', open.filter(t => t.due && t.due > tk && t.due <= wk)]);
        groups.push(['Later', open.filter(t => t.due && t.due > wk)]);
        groups.push(['No due date', open.filter(t => !t.due)]);
      } else groups.push(['Open', open]);
    }
    if (TK.filter !== 'active') groups.push(['Completed', closed]);
    const shown = groups.filter(g => g[1].length);
    const pct = all.length ? done / all.length * 100 : 0;
    const overdue = all.filter(t => !t.done && t.due && t.due < tk).length;
    const dueToday = all.filter(t => !t.done && t.due === tk).length;

    v.innerHTML = `
    <div class="grid grid-4 stagger" style="margin-top:8px">
      ${P.stat('tasks', 'var(--primary)', 'rgb(var(--p-rgb) / .12)', `<span data-count="${all.length - done}">0</span>`, 'Open tasks')}
      ${P.stat('calendar', '#f59e0b', 'rgba(245,158,11,.14)', `<span data-count="${dueToday}">0</span>`, 'Due today')}
      ${P.stat('alert', '#e11d48', 'rgba(225,29,72,.12)', `<span data-count="${overdue}">0</span>`, 'Overdue')}
      <div class="card stat lift"><div class="stat-top"><div class="stat-icon" style="--tone:#10b981;--tint:rgba(16,185,129,.12)">${icon('check')}</div><span class="delta up">${Math.round(pct)}%</span></div><div><div class="stat-value">${done}/${all.length}</div><div class="stat-label">Completed</div></div>${bar(pct, 'linear-gradient(90deg,#34d399,#10b981)', 'sm')}</div>
    </div>
    <div class="card mt">
      <form class="add-task" data-form="add-task">
        <input class="input" name="title" placeholder="What do you need to do?" maxlength="140" required aria-label="Task title">
        <select class="select" name="subjectId" aria-label="Subject">${UI.subjectOptions(TK.subj !== '__all' ? TK.subj : '')}</select>
        <input class="input" type="date" name="due" value="${tk}" aria-label="Due date">
        <select class="select" name="priority" aria-label="Priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
        <button class="btn btn-primary">${icon('plus')}Add task</button>
      </form>
    </div>
    <div class="card mt">
      <div class="toolbar">
        <div class="seg">${[['active', 'Active'], ['all', 'All'], ['done', 'Completed']].map(([k, l]) => `<button data-act="filter" data-f="${k}" class="${TK.filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="card-actions">
          <select class="select sm" data-tsub aria-label="Filter by subject" style="width:180px">${UI.subjectOptions(TK.subj, { all: true }).replace('value="__all"', `value="__all" ${TK.subj === '__all' ? 'selected' : ''}`)}</select>
          <select class="select sm" data-tsort aria-label="Sort" style="width:150px">${[['due', 'Sort: due date'], ['priority', 'Sort: priority'], ['recent', 'Sort: newest']].map(([k, l]) => `<option value="${k}" ${TK.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          ${done ? `<button class="btn btn-ghost btn-sm" data-act="clear-done">${icon('trash')}Clear completed</button>` : ''}
        </div>
      </div>
      ${shown.length ? shown.map(([title, items, cls]) => `<div class="task-group"><div class="group-title ${cls || ''}">${title}<span class="count">${items.length}</span></div><div class="list stagger">${items.map(t => P.taskRow(t)).join('')}</div></div>`).join('')
        : UI.empty(TK.filter === 'done' ? 'check' : 'sparkles', TK.filter === 'done' ? 'Nothing completed yet' : 'You’re all caught up!', TK.filter === 'done' ? 'Ticked-off tasks will show up here.' : 'No open tasks here. Add one above or enjoy the free time.')}
    </div>`;

    v.onsubmit = e => {
      const f = e.target.closest('[data-form="add-task"]'); if (!f) return;
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f)), title = d.title.trim(); if (!title) return;
      S.add('tasks', { title, subjectId: d.subjectId || null, due: d.due || null, priority: d.priority, done: false, created: Date.now(), doneAt: null });
      UI.toast(`“${title}” added`, { title: 'Task added', icon: 'tasks' });
      App.refresh();
      setTimeout(() => { const i = $('[data-form="add-task"] [name=title]', v); i && i.focus(); }, 30);
    };
    v.onchange = e => {
      const c = e.target.closest('[data-toggle]');
      if (c) { c.closest('.task').classList.toggle('done', c.checked); P.toggleTask(c.dataset.toggle, c.checked); return; }
      if (e.target.matches('[data-tsub]')) { TK.subj = e.target.value; App.refresh(); }
      if (e.target.matches('[data-tsort]')) { TK.sort = e.target.value; App.refresh(); }
    };
    v.onclick = async e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'filter') { TK.filter = a.dataset.f; App.refresh(); }
      else if (act === 'edit-task') Forms.task(S.get('tasks', a.dataset.id));
      else if (act === 'del-task') {
        const el = a.closest('.task'); el.classList.add('leaving');
        const t = S.get('tasks', a.dataset.id);
        setTimeout(() => { S.remove('tasks', t.id); App.refresh(); UI.toast(`“${t.title}” deleted`, { icon: 'trash' }); }, 250);
      } else if (act === 'clear-done') {
        const n = S.data.tasks.filter(t => t.done).length;
        if (await UI.confirm(`Remove ${n} completed task${n === 1 ? '' : 's'}? This can’t be undone.`, { title: 'Clear completed tasks?', label: 'Clear' })) {
          S.data.tasks = S.data.tasks.filter(t => !t.done); S.commit(); UI.toast(`${n} completed task${n === 1 ? '' : 's'} cleared`, { icon: 'trash' }); App.refresh();
        }
      }
    };
  };

  /* ======================= CALENDAR ======================= */
  const CAL = { y: null, m: null, sel: null };
  P.calendar = function (v) {
    const t = D.today(), tk = D.key(t);
    if (CAL.y === null) { CAL.y = t.getFullYear(); CAL.m = t.getMonth(); CAL.sel = tk; }
    const first = new Date(CAL.y, CAL.m, 1), start = D.sow(first);
    const byDate = {};
    S.data.events.forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
    Object.values(byDate).forEach(a => a.sort((x, y) => (x.time || '99').localeCompare(y.time || '99')));
    const dueTasks = {};
    S.data.tasks.filter(x => !x.done && x.due).forEach(x => (dueTasks[x.due] = dueTasks[x.due] || []).push(x));

    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = D.add(start, i), k = D.key(d), evs = byDate[k] || [], other = d.getMonth() !== CAL.m;
      if (i === 35 && other) break;
      const wk = d.getDay() === 0 || d.getDay() === 6;
      cells += `<button class="cal-day ${other ? 'other' : ''} ${k === tk ? 'today' : ''} ${k === CAL.sel ? 'sel' : ''} ${wk ? 'weekend' : ''}" data-act="day" data-date="${k}" aria-label="${D.fmt(k, { weekday: 'long', day: 'numeric', month: 'long' })}, ${evs.length} events">
        <span class="num">${d.getDate()}</span>
        ${evs.slice(0, 2).map(e => `<span class="cal-ev t-${e.type}">${e.time ? e.time + ' ' : ''}${esc(e.title)}</span>`).join('')}
        ${evs.length > 2 ? `<span class="cal-more">+${evs.length - 2} more</span>` : ''}
        ${dueTasks[k] && !evs.length ? `<span class="cal-more">${dueTasks[k].length} task${dueTasks[k].length > 1 ? 's' : ''} due</span>` : ''}
        <span class="cal-dots">${evs.slice(0, 3).map(e => `<i class="t-${e.type}"></i>`).join('')}</span>
      </button>`;
    }
    const sel = CAL.sel, selEvs = byDate[sel] || [], selTasks = dueTasks[sel] || [];
    const upcoming = S.data.events.filter(e => e.date >= tk).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(0, 6);
    const monthEvs = S.data.events.filter(e => { const d = D.parse(e.date); return d.getFullYear() === CAL.y && d.getMonth() === CAL.m; });
    const count = ty => monthEvs.filter(e => e.type === ty).length;

    v.innerHTML = `
    <div class="cal-layout" style="margin-top:8px">
      <div class="card">
        <div class="cal-head">
          <h3>${first.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</h3>
          <button class="icon-btn sm" data-act="nav" data-d="-1" aria-label="Previous month">${icon('left')}</button>
          <button class="btn btn-ghost btn-sm" data-act="today">Today</button>
          <button class="icon-btn sm" data-act="nav" data-d="1" aria-label="Next month">${icon('right')}</button>
          <button class="btn btn-primary btn-sm" data-act="add">${icon('plus')}New event</button>
        </div>
        <div class="cal-grid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="cal-dow">${innerWidth < 600 ? d[0] : d}</div>`).join('')}${cells}</div>
        <div class="type-legend"><span class="t-exam"><i></i>Exams (${count('exam')})</span><span class="t-assignment"><i></i>Assignments (${count('assignment')})</span><span class="t-study"><i></i>Study sessions (${count('study')})</span><span class="t-other"><i></i>Other (${count('other')})</span></div>
      </div>
      <div class="stack">
        <div class="card">
          <div class="card-head"><div><h3>${D.fmt(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h3><div class="sub">${sel === tk ? 'Today' : D.rel(sel)} · ${selEvs.length} event${selEvs.length === 1 ? '' : 's'}</div></div><button class="icon-btn sm" data-act="add" aria-label="Add event on this day">${icon('plus')}</button></div>
          <div class="list stagger">
            ${selEvs.map(e => { const s = S.subject(e.subjectId); return `<div class="item click" data-act="edit" data-id="${e.id}"><span class="ev-time">${e.time || 'All day'}</span><div class="item-body"><div class="item-title">${esc(e.title)}</div><div class="item-meta"><span class="pill ${e.type}">${P.typeLabel[e.type]}</span><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}</div>${e.notes ? `<div class="item-meta" style="margin-top:4px">${esc(e.notes)}</div>` : ''}</div>${icon('edit')}</div>`; }).join('')}
            ${selTasks.map(x => `<div class="item"><span class="ev-time">Task</span><div class="item-body"><div class="item-title">${esc(x.title)}</div><div class="item-meta"><span class="prio ${x.priority}">${x.priority}</span>${esc(S.subject(x.subjectId).name)}</div></div></div>`).join('')}
            ${!selEvs.length && !selTasks.length ? UI.empty('calendar', 'Free day', 'Nothing scheduled. Plan a study session?', `<button class="btn btn-soft btn-sm" data-act="add">${icon('plus')}Add event</button>`) : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="head-icon">${icon('flag')}</span>Coming up</h3></div>
          <div class="list">${upcoming.length ? upcoming.map(P.deadlineItem).join('') : UI.empty('calendar', 'Nothing upcoming', 'Your schedule is clear.')}</div>
        </div>
      </div>
    </div>`;

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'nav') { const d = new Date(CAL.y, CAL.m + +a.dataset.d, 1); CAL.y = d.getFullYear(); CAL.m = d.getMonth(); App.refresh(); }
      else if (act === 'today') { CAL.y = t.getFullYear(); CAL.m = t.getMonth(); CAL.sel = tk; App.refresh(); }
      else if (act === 'day') {
        const d = D.parse(a.dataset.date); CAL.sel = a.dataset.date;
        if (d.getMonth() !== CAL.m) { CAL.y = d.getFullYear(); CAL.m = d.getMonth(); }
        App.refresh();
      }
      else if (act === 'add') Forms.event(null, CAL.sel);
      else if (act === 'edit' || act === 'edit-event') Forms.event(S.get('events', a.dataset.id));
    };
    v.ondblclick = e => { const a = e.target.closest('[data-act="day"]'); if (a) Forms.event(null, a.dataset.date); };
  };

  /* ======================= NOTES ======================= */
  const N = { id: null, q: '', subj: '__all', editing: false };
  P.newNote = function () {
    const n = S.add('notes', { title: '', body: '', subjectId: N.subj !== '__all' ? N.subj || null : null, pinned: false, updated: Date.now() });
    N.id = n.id; N.editing = true; N.focusTitle = true;
    return n;
  };
  P.notes = function (v) {
    const filtered = () => {
      const q = N.q.toLowerCase();
      return S.data.notes.filter(n => (N.subj === '__all' || (n.subjectId || '') === N.subj) && (!q || (n.title + ' ' + n.body).toLowerCase().includes(q)))
        .sort((a, b) => (b.pinned - a.pinned) || b.updated - a.updated);
    };
    let list = filtered();
    if (!S.get('notes', N.id)) { N.id = list[0]?.id || null; N.editing = false; }
    const note = S.get('notes', N.id);
    const wc = s => (s.trim().match(/\S+/g) || []).length;
    const ago = ts => { const m = Math.round((Date.now() - ts) / 6e4); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(ts).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); };
    const itemHtml = n => { const s = S.subject(n.subjectId); return `<button class="note-item ${n.id === N.id ? 'active' : ''}" data-act="open" data-id="${n.id}"><h4>${n.pinned ? icon('pin') : ''}<span>${esc(n.title || 'Untitled note')}</span></h4><p>${esc(n.body.slice(0, 140)) || '<i>Empty note</i>'}</p><div class="item-meta"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)} · ${ago(n.updated)}</div></button>`; };
    const listHtml = () => { list = filtered(); return list.length ? list.map(itemHtml).join('') : UI.empty('notes', N.q ? 'No matching notes' : 'No notes yet', N.q ? 'Try a different search term.' : 'Create your first note to get started.'); };

    v.innerHTML = `
    <div class="notes-layout ${N.editing ? 'editing' : ''}" id="notes-layout" style="margin-top:8px">
      <div class="card notes-list">
        <div style="display:flex;gap:8px"><div class="search" style="flex:1">${icon('search')}<input class="input" placeholder="Search notes…" value="${esc(N.q)}" data-nq aria-label="Search notes"></div><button class="btn btn-primary" data-act="new" aria-label="New note" style="padding:0 13px">${icon('plus')}</button></div>
        <select class="select sm" data-nsub aria-label="Filter notes by subject">${UI.subjectOptions(N.subj, { all: true }).replace('value="__all"', `value="__all" ${N.subj === '__all' ? 'selected' : ''}`)}</select>
        <div class="notes-scroll" id="notes-scroll">${listHtml()}</div>
        <div class="muted small" style="text-align:center">${S.data.notes.length} note${S.data.notes.length === 1 ? '' : 's'} · saved on this device</div>
      </div>
      <div class="card note-editor">
        ${note ? `
        <div class="note-toolbar">
          <button class="icon-btn sm back-btn" data-act="back" aria-label="Back to notes">${icon('left')}</button>
          <select class="select sm" data-nfield="subjectId" aria-label="Note subject">${UI.subjectOptions(note.subjectId)}</select>
          <span class="spacer"></span>
          <button class="icon-btn sm ${note.pinned ? 'on' : ''}" data-act="pin" title="${note.pinned ? 'Unpin' : 'Pin to top'}" aria-label="Pin note">${icon('pin')}</button>
          <button class="icon-btn sm danger" data-act="delete" title="Delete note" aria-label="Delete note">${icon('trash')}</button>
        </div>
        <input class="note-title" data-nfield="title" value="${esc(note.title)}" placeholder="Untitled note" maxlength="120" aria-label="Note title">
        <textarea class="note-body" data-nfield="body" placeholder="Start writing… definitions, formulas, summaries, anything." aria-label="Note content">${esc(note.body)}</textarea>
        <div class="note-foot"><span class="saved" id="saved">${icon('check')}Saved</span><span id="wc">${wc(note.body)} words · edited ${ago(note.updated)}</span></div>`
        : `<div style="margin:auto">${UI.empty('notes', 'Select or create a note', 'Your notes save automatically as you type.', `<button class="btn btn-primary btn-sm" data-act="new">${icon('plus')}New note</button>`)}</div>`}
      </div>
    </div>`;

    if (N.focusTitle) { N.focusTitle = false; setTimeout(() => { const ti = $('.note-title', v); ti && ti.focus(); }, 60); }

    let saveT;
    v.oninput = e => {
      if (e.target.matches('[data-nq]')) { N.q = e.target.value; $('#notes-scroll', v).innerHTML = listHtml(); return; }
      const f = e.target.dataset.nfield; if (!f || !note) return;
      note[f] = e.target.value; note.updated = Date.now();
      const sv = $('#saved', v); sv.style.opacity = .5; sv.lastChild.textContent = 'Saving…';
      clearTimeout(saveT);
      saveT = setTimeout(() => { S.save(); sv.style.opacity = 1; sv.lastChild.textContent = 'Saved'; }, 350);
      $('#wc', v).textContent = `${wc(note.body)} words · edited just now`;
      const it = $(`.note-item[data-id="${note.id}"]`, v);
      if (it) { $('h4 span', it).textContent = note.title || 'Untitled note'; $('p', it).textContent = note.body.slice(0, 140); }
    };
    v.onchange = e => {
      if (e.target.matches('[data-nsub]')) { N.subj = e.target.value; App.refresh(); }
      else if (e.target.dataset.nfield === 'subjectId' && note) { S.update('notes', note.id, { subjectId: e.target.value || null, updated: Date.now() }); App.refresh(); }
    };
    v.onclick = async e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'open') { S.save(); N.id = a.dataset.id; N.editing = true; App.refresh(); }
      else if (act === 'new') { S.save(); P.newNote(); App.refresh(); }
      else if (act === 'back') { S.save(); N.editing = false; App.refresh(); }
      else if (act === 'pin') { S.update('notes', note.id, { pinned: !note.pinned }); UI.toast(note.pinned ? 'Note pinned to top' : 'Note unpinned', { icon: 'pin' }); App.refresh(); }
      else if (act === 'delete') {
        if (await UI.confirm(`“${note.title || 'Untitled note'}” will be permanently deleted.`, { title: 'Delete note?' })) {
          S.remove('notes', note.id); N.id = null; N.editing = false; UI.toast('Note deleted', { icon: 'trash' }); App.refresh();
        }
      }
    };
  };
  P.leaveNotes = function () {
    // drop untouched empty notes so they don't clutter the list
    S.data.notes = S.data.notes.filter(n => (n.title || '').trim() || (n.body || '').trim());
    S.save();
  };

  /* ======================= SUBJECTS ======================= */
  P.subjects = function (v) {
    const t = D.today(), som = D.som(t), tk = D.key(t);
    const month = S.bySubject(som, null), all = S.bySubject(null, null);
    const subs = S.data.subjects;
    const avg = subs.length ? subs.reduce((a, s) => a + s.grade, 0) / subs.length : 0;
    const onTarget = subs.filter(s => s.grade >= s.target).length;

    v.innerHTML = `
    <div class="grid grid-4 stagger" style="margin-top:8px">
      ${P.stat('book', 'var(--primary)', 'rgb(var(--p-rgb) / .12)', `<span data-count="${subs.length}">0</span>`, 'Subjects')}
      ${P.stat('award', '#0ea5e9', 'rgba(14,165,233,.12)', `<span data-count="${Math.round(avg)}" data-suffix="%">0%</span>`, 'Average mark')}
      ${P.stat('target', '#10b981', 'rgba(16,185,129,.12)', `${onTarget}/${subs.length}`, 'At or above target')}
      ${P.stat('clock', '#f59e0b', 'rgba(245,158,11,.14)', fmtH(Object.values(month).reduce((a, b) => a + b, 0)), 'Studied this month')}
    </div>
    <div class="section-head"><div><h3>Your subjects</h3><p>Track marks, study time, tasks and upcoming exams for each subject.</p></div><button class="btn btn-primary" data-act="add">${icon('plus')}Add subject</button></div>
    <div class="subj-grid stagger">
      ${subs.map(s => {
        const openT = S.data.tasks.filter(x => !x.done && x.subjectId === s.id).length;
        const next = S.data.events.filter(e => e.subjectId === s.id && e.date >= tk && e.type === 'exam').sort((a, b) => a.date.localeCompare(b.date))[0];
        const notes = S.data.notes.filter(n => n.subjectId === s.id).length;
        const gap = s.target - s.grade;
        return `<div class="card subj-card lift" style="--c:${s.color}">
          <div class="subj-head"><div class="subj-icon">${icon('book')}</div><div class="item-body"><h4>${esc(s.name)}</h4><div class="item-meta">${s.teacher ? esc(s.teacher) + ' · ' : ''}${notes} note${notes === 1 ? '' : 's'}</div></div>
            <button class="icon-btn sm plain" data-act="edit" data-id="${s.id}" aria-label="Edit ${esc(s.name)}">${icon('edit')}</button></div>
          <div class="mini-stats"><div><b>${fmtH(month[s.id] || 0)}</b><small>This month</small></div><div><b>${fmtH(all[s.id] || 0, 0)}</b><small>All time</small></div><div><b>${openT}</b><small>Open tasks</small></div></div>
          <div class="progress-meta"><b>Current mark</b><span><b style="color:var(--text)">${s.grade}%</b> · target ${s.target}%</span></div>
          <div class="bar-wrap" style="margin-top:8px">${bar(s.grade, s.color)}<span class="target" style="left:${s.target}%" title="Target ${s.target}%"></span></div>
          <div class="item-meta" style="margin-top:12px;justify-content:space-between">
            <span>${gap > 0 ? `<span class="pill soft">${gap}% to target</span>` : `<span class="pill success">${icon('check')}On target</span>`}</span>
            <span>${next ? `${icon('flag', 'ic-inline')} ${esc(next.title)} · ${D.rel(next.date)}` : 'No exams scheduled'}</span>
          </div>
          <div class="card-actions" style="margin-top:16px">
            <button class="btn btn-soft btn-sm" data-act="study" data-id="${s.id}">${icon('play')}Study now</button>
            <button class="btn btn-ghost btn-sm" data-act="task" data-id="${s.id}">${icon('plus')}Task</button>
            <button class="btn btn-ghost btn-sm" data-act="grade" data-id="${s.id}">${icon('award')}Update mark</button>
          </div>
        </div>`;
      }).join('')}
      <button class="card add-card" data-act="add"><span class="e-ico">${icon('plus')}</span>Add a subject</button>
    </div>`;
    $$('.ic-inline', v).forEach(i => i.style.cssText = 'width:13px;height:13px;display:inline-block;vertical-align:-2px');

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const s = a.dataset.id && S.get('subjects', a.dataset.id);
      switch (a.dataset.act) {
        case 'add': Forms.subject(); break;
        case 'edit': Forms.subject(s); break;
        case 'study': Timer.setSubject(s.id); if (!Timer.s.running && Timer.s.mode !== 'focus') Timer.setMode('focus'); location.hash = '#/timer'; break;
        case 'task': Forms.task(null, { subjectId: s.id }); break;
        case 'grade':
          UI.modal({
            title: `Update ${s.name} mark`,
            body: `<div class="row"><div class="field"><label>Current mark (%)</label><input class="input" type="number" name="grade" min="0" max="100" required value="${s.grade}" autofocus></div><div class="field"><label>Target (%)</label><input class="input" type="number" name="target" min="0" max="100" required value="${s.target}"></div></div>`,
            submitLabel: 'Save',
            onSubmit(f) {
              const g = Math.min(100, Math.max(0, Math.round(+f.grade))), tg = Math.min(100, Math.max(0, Math.round(+f.target)));
              const hit = s.grade < s.target && g >= tg;
              S.update('subjects', s.id, { grade: g, target: tg });
              if (hit) { UI.toast(`You've hit your ${s.name} target of ${tg}%!`, { title: 'Target reached!', icon: 'trophy', type: 'celebrate' }); UI.confetti(); }
              else UI.toast(`${s.name} mark updated to ${g}%`, { icon: 'award' });
              App.refresh();
            },
          });
          break;
      }
    };
  };

  /* ======================= SETTINGS ======================= */
  P.settings = function (v) {
    const st = S.settings, dark = document.documentElement.dataset.theme === 'dark';
    const d = S.data;
    v.innerHTML = `
    <div class="grid settings-grid" style="margin-top:8px">
      <div class="card">
        <div class="card-head"><h3><span class="head-icon">${icon('user')}</span>Profile</h3></div>
        <form data-form="profile">
          <div class="row"><div class="field"><label>Your name</label><input class="input" name="name" maxlength="30" value="${esc(st.name)}" required></div>
          <div class="field"><label>Grade / year</label><input class="input" name="level" maxlength="40" value="${esc(st.level)}" placeholder="e.g. Grade 12, 2nd-year BCom"></div></div>
          <div class="row"><div class="field"><label>Daily study goal (minutes)</label><input class="input" type="number" name="daily" min="10" max="900" step="5" value="${st.dailyGoalMin}" required></div>
          <div class="field"><label>Weekly study goal (hours)</label><input class="input" type="number" name="weekly" min="1" max="100" step="0.5" value="${st.weeklyGoalHrs}" required></div></div>
          <button class="btn btn-primary">${icon('check')}Save profile</button>
        </form>
      </div>
      <div class="card">
        <div class="card-head"><h3><span class="head-icon">${icon(dark ? 'moon' : 'sun')}</span>Appearance &amp; sound</h3></div>
        <div class="setting-row"><div><b>Theme</b><small>Your choice is remembered on this device</small></div>
          <div class="seg">${[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']].map(([k, l, ic]) => `<button data-act="theme" data-t="${k}" class="${(dark ? 'dark' : 'light') === k ? 'on' : ''}" style="display:inline-flex;align-items:center;gap:6px">${icon(ic).replace('class="ic', 'style="width:15px;height:15px" class="ic')}${l}</button>`).join('')}</div></div>
        <div class="setting-row" style="flex-wrap:wrap"><div><b>Colour palette</b><small>Pick the look that suits you</small></div>
          <div class="palettes">${[['teal', 'Teal & mint', '#0d9488', '#5eead4'], ['forest', 'Forest & sage', '#2f7a55', '#a7c7a5']].map(([k, l, c1, c2]) => `<button class="palette ${App.accent() === k ? 'on' : ''}" data-act="accent" data-a="${k}" aria-pressed="${App.accent() === k}"><span class="pal-sw" style="background:linear-gradient(135deg,${c2} 0 50%,${c1} 50% 100%)"></span>${l}</button>`).join('')}</div></div>
        <div class="setting-row"><div><b>Timer sound</b><small>Chime when focus sessions and breaks end</small></div><label class="switch"><input type="checkbox" data-sound ${st.sound ? 'checked' : ''}><span></span></label></div>
        <div class="setting-row"><div><b>Focus / break lengths</b><small>${st.focusMin} / ${st.shortMin} / ${st.longMin} minutes</small></div><a class="btn btn-ghost btn-sm" href="#/timer">Adjust</a></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('layers')}</span>Your data</h3><div class="sub">Everything is stored privately in this browser</div></div></div>
        <div class="summary-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          <div><b>${d.sessions.length}</b><small>Sessions</small></div><div><b>${d.tasks.length}</b><small>Tasks</small></div><div><b>${d.notes.length}</b><small>Notes</small></div>
          <div><b>${d.events.length}</b><small>Events</small></div><div><b>${d.subjects.length}</b><small>Subjects</small></div><div><b>${d.goals.length}</b><small>Goals</small></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost" data-act="export">${icon('download')}Export backup</button>
          <label class="btn btn-ghost" style="cursor:pointer">${icon('upload')}Import backup<input type="file" accept="application/json,.json" data-import hidden></label>
        </div>
      </div>
      <div class="card danger-zone">
        <div class="card-head"><div><h3><span class="head-icon" style="background:var(--danger-soft);color:var(--danger)">${icon('alert')}</span>Reset</h3><div class="sub">These actions replace your current data</div></div></div>
        <div class="setting-row"><div><b>Restore sample data</b><small>Reload the realistic demo dataset</small></div><button class="btn btn-ghost btn-sm" data-act="sample">${icon('reset')}Restore</button></div>
        <div class="setting-row"><div><b>Start fresh</b><small>Delete all sessions, tasks, notes, subjects and goals</small></div><button class="btn btn-danger btn-sm" data-act="wipe">${icon('trash')}Clear all</button></div>
      </div>
    </div>
    <p class="muted small" style="text-align:center;margin-top:28px">StudyHub · Built for focused, consistent students · v1.0</p>`;

    v.onsubmit = e => {
      const f = e.target.closest('[data-form="profile"]'); if (!f) return;
      e.preventDefault();
      const x = Object.fromEntries(new FormData(f));
      Object.assign(st, { name: x.name.trim() || 'Student', level: x.level.trim(), dailyGoalMin: Math.max(10, Math.round(+x.daily)), weeklyGoalHrs: Math.max(1, +x.weekly) });
      S.commit(); UI.toast('Your profile has been updated.', { title: 'Saved', icon: 'check' }); App.refresh();
    };
    v.onchange = e => {
      if (e.target.matches('[data-sound]')) { st.sound = e.target.checked; S.commit(); if (st.sound) UI.beep(); }
      if (e.target.matches('[data-import]')) {
        const file = e.target.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = async () => {
          try {
            const data = JSON.parse(r.result);
            if (!data || data.version !== 1 || !Array.isArray(data.subjects) || !Array.isArray(data.sessions)) throw new Error('bad');
            if (await UI.confirm(`Replace your current data with the backup “${file.name}”?`, { title: 'Import backup?', label: 'Import', danger: false })) {
              S.replace(data); Milestones.check(true); UI.toast('Backup restored successfully.', { title: 'Imported', icon: 'upload' }); App.refresh();
            }
          } catch (err) { UI.toast('That file isn’t a valid StudyHub backup.', { title: 'Import failed', icon: 'alert', type: 'danger' }); }
          e.target.value = '';
        };
        r.readAsText(file);
      }
    };
    v.onclick = async e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.dataset.act;
      if (act === 'theme') App.setTheme(a.dataset.t);
      else if (act === 'accent') { App.setAccent(a.dataset.a); UI.toast(`${a.dataset.a === 'forest' ? 'Forest & sage' : 'Teal & mint'} palette applied`, { icon: 'sparkles' }); }
      else if (act === 'export') { UI.download(`studyhub-backup-${tkey()}.json`, JSON.stringify(S.data, null, 2)); UI.toast('Backup file downloaded.', { title: 'Exported', icon: 'download' }); }
      else if (act === 'sample') { if (await UI.confirm('Your current data will be replaced with the sample dataset.', { title: 'Restore sample data?', label: 'Restore' })) { S.reset(); Milestones.check(true); UI.toast('Sample data restored', { icon: 'reset' }); App.refresh(); } }
      else if (act === 'wipe') { if (await UI.confirm('All your sessions, tasks, notes, events, subjects and goals will be permanently deleted. Consider exporting a backup first.', { title: 'Clear everything?', label: 'Delete everything' })) { S.clear(); Timer.s.subjectId = ''; Timer.reset(); UI.toast('All data cleared. A fresh start!', { icon: 'sparkles' }); App.refresh(); } }
    };
  };
})();
