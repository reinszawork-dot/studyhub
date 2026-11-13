/* StudyHub Pro — exam countdown planner, grade calculator & APS, extra palettes.
   All free, no payments. */
(function () {
  const { esc, $$ } = UI;
  const P = window.Pages = window.Pages || {};
  const tkey = () => D.key(D.today());

  /* No payments: every feature is free. This stand-in keeps the old
     NextWavePro calls working with everything unlocked. */
  window.NextWavePro = { init() {}, open() {}, isPro: () => true, plan: () => 'free', gate: (_f, fn) => fn && fn() };

  const isPro = () => NextWavePro.isPro();
  const badge = '<span class="pro-badge" aria-label="Pro feature">Pro</span>';

  /* ---------------- Extra palettes ---------------- */
  const FREE_PALETTES = [['teal', 'Teal & mint', '#0d9488', '#5eead4'], ['forest', 'Forest & sage', '#2f7a55', '#a7c7a5']];
  const PRO_PALETTES = [['ocean', 'Ocean & sky', '#1d6fb8', '#7cc4f2'], ['sunset', 'Sunset & coral', '#d0532f', '#f6a97c'], ['slate', 'Slate & sand', '#475569', '#d6c7a1']];
  const PRO_KEYS = PRO_PALETTES.map(p => p[0]);
  const ALL_PALETTES = [...FREE_PALETTES, ...PRO_PALETTES];

  /* Pro data lives inside the normal StudyHub data, so backups include it. */
  function pd() {
    const d = S.data;
    if (!d.pro || typeof d.pro !== 'object') d.pro = {};
    d.pro.grades = d.pro.grades || {};
    d.pro.plans = d.pro.plans || {};
    return d.pro;
  }

  /* ======================= EXAM PLANNER ======================= */
  function subjectMinutesOn(subjectId, date) {
    let m = 0;
    for (const s of S.data.sessions) if (s.date === date && (s.subjectId || '') === (subjectId || '')) m += +s.minutes || 0;
    return m;
  }
  function planDays(perWeek, examDate) {
    const t = D.today(), ex = D.parse(examDate), total = D.between(t, ex);
    if (total <= 0) return [];
    const days = [];
    // walk week by week, spreading `perWeek` sessions evenly over the 7 days; stop the day before the exam
    const step = 7 / perWeek;
    for (let w = 0; w * 7 < total; w++) {
      for (let i = 0; i < perWeek; i++) {
        const off = w * 7 + Math.floor(i * step);
        if (off < total) days.push(D.key(D.add(t, off)));
      }
    }
    return [...new Set(days)];
  }
  function planStatus(ev) {
    const plan = pd().plans[ev.id];
    if (!plan) return null;
    const tk = tkey();
    const days = plan.days.map(d => ({ date: d, mins: subjectMinutesOn(ev.subjectId, d) }));
    days.forEach(x => { x.done = x.mins >= plan.minutes * 0.8; x.past = x.date < tk; x.today = x.date === tk; });
    return { plan, days, done: days.filter(x => x.done).length, missed: days.filter(x => x.past && !x.done).length };
  }
  function buildPlan(ev) {
    const old = pd().plans[ev.id];
    UI.modal({
      title: `Revision plan · ${ev.title}`,
      body: `<p class="muted" style="margin-bottom:14px">StudyHub spreads revision sessions from today until the day before the exam (${D.fmt(ev.date, { weekday: 'long', day: 'numeric', month: 'long' })}). A session ticks off by itself when you log enough study time for that subject on the day.</p>
        <div class="field"><label>Sessions per week</label><div class="seg radio full">${[2, 3, 4, 5, 7].map(n => `<label><input type="radio" name="per" value="${n}" ${(old ? old.perWeek : 4) === n ? 'checked' : ''}><span>${n}×</span></label>`).join('')}</div></div>
        <div class="field"><label>Minutes per session</label><div class="seg radio full">${[25, 45, 60, 90].map(n => `<label><input type="radio" name="min" value="${n}" ${(old ? old.minutes : 45) === n ? 'checked' : ''}><span>${n} min</span></label>`).join('')}</div></div>`,
      submitLabel: old ? 'Rebuild plan' : 'Create plan',
      onSubmit(f) {
        const per = +f.per || 4, min = +f.min || 45;
        const days = planDays(per, ev.date);
        if (!days.length) { UI.toast('This exam is today or already past.', { icon: 'alert', type: 'danger' }); return; }
        pd().plans[ev.id] = { perWeek: per, minutes: min, days, created: Date.now() };
        S.commit();
        UI.toast(`${days.length} revision sessions of ${min} min until ${D.fmt(ev.date)}.`, { title: 'Revision plan ready', icon: 'flag' });
        App.refresh();
      },
    });
  }

  P.exams = function (v) {

    const tk = tkey();
    const exams = S.data.events.filter(e => e.type === 'exam' && e.date >= tk).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const next = exams[0];
    const today = exams.map(ev => ({ ev, st: planStatus(ev) })).filter(x => x.st && x.st.days.some(d => d.today));
    const two = D.add(D.today(), -14);

    v.innerHTML = `
    ${next ? `<div class="hero exam-hero" style="margin-top:8px">
      <div class="hero-text">
        <div class="eyebrow">${icon('flag')}Next exam</div>
        <h1>${esc(next.title)}</h1>
        <p class="lead">${D.fmt(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}${next.time ? ` at ${next.time}` : ''} · ${esc(S.subject(next.subjectId).name)}</p>
      </div>
      <div class="exam-count"><b>${D.days(next.date)}</b><small>${D.days(next.date) === 1 ? 'day to go' : 'days to go'}</small></div>
    </div>` : ''}
    <div class="grid grid-2" style="margin-top:22px">
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('play')}</span>Today’s revision</h3><div class="sub">From your revision plans</div></div></div>
        <div class="list">${today.length ? today.map(({ ev, st }) => {
          const d = st.days.find(x => x.today), s = S.subject(ev.subjectId);
          return `<div class="item"><span class="sdot" style="--c:${s.color}"></span><div class="item-body"><div class="item-title">${esc(s.name)} · ${st.plan.minutes} min</div><div class="item-meta">For ${esc(ev.title)} · ${fmtMin(d.mins)} logged today</div></div>
            ${d.done ? `<span class="pill success">${icon('check')}Done</span>` : `<button class="btn btn-soft btn-sm" data-act="study" data-id="${ev.id}">${icon('play')}Study</button>`}</div>`;
        }).join('') : UI.empty('coffee', 'Nothing planned for today', exams.length ? 'Build a revision plan for an exam below.' : 'Add an exam to get started.')}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('calendar')}</span>Exam season at a glance</h3><div class="sub">${exams.length} upcoming exam${exams.length === 1 ? '' : 's'}</div></div>
          <button class="btn btn-ghost btn-sm" data-act="add">${icon('plus')}Add exam</button></div>
        <div class="list">${exams.length ? exams.slice(0, 5).map(P.deadlineItem).join('') : UI.empty('flag', 'No exams yet', 'Add an exam in the calendar and choose the type “Exam”.')}</div>
      </div>
    </div>
    <div class="section-head"><div><h3>Countdowns &amp; revision plans</h3><p>Readiness is how much you studied each subject over the last 14 days.</p></div></div>
    <div class="subj-grid stagger">
      ${exams.map(ev => {
        const s = S.subject(ev.subjectId), n = D.days(ev.date), st = planStatus(ev);
        const recent = S.bySubject(two, null)[S.validSubject(ev.subjectId)] || 0;
        const pct = st ? Math.round(st.done / st.days.length * 100) : 0;
        return `<div class="card subj-card" style="--c:${s.color}">
          <div class="subj-head"><div class="date-badge exam"><small>${D.parse(ev.date).toLocaleDateString('en-ZA', { month: 'short' })}</small><b>${D.parse(ev.date).getDate()}</b></div>
            <div class="item-body"><h4>${esc(ev.title)}</h4><div class="item-meta"><span class="sdot" style="--c:${s.color}"></span>${esc(s.name)}${ev.time ? ` · ${ev.time}` : ''}</div></div>
            <span class="pill ${n <= 3 ? 'urgent' : 'exam'}">${n === 0 ? 'Today' : `${n} day${n === 1 ? '' : 's'}`}</span></div>
          <div class="mini-stats"><div><b>${fmtH(recent)}</b><small>Last 14 days</small></div><div><b>${st ? `${st.done}/${st.days.length}` : '–'}</b><small>Plan done</small></div><div><b>${st ? st.missed : '–'}</b><small>Missed</small></div></div>
          ${st ? `<div class="progress-meta" style="margin-top:4px"><b>Revision plan</b><span>${st.plan.perWeek}× a week · ${st.plan.minutes} min</span></div>
            <div style="margin-top:8px">${UI.bar(pct, s.color)}</div>
            <div class="plan-days">${st.days.slice(0, 21).map(x => `<span class="plan-day ${x.done ? 'done' : x.past ? 'missed' : x.today ? 'today' : ''}" title="${D.fmt(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}${x.done ? ' · done' : x.past ? ' · missed' : ''}">${D.parse(x.date).getDate()}</span>`).join('')}${st.days.length > 21 ? `<span class="plan-day more">+${st.days.length - 21}</span>` : ''}</div>`
            : `<p class="muted small" style="margin-top:6px">No revision plan yet. ${n > 0 ? `You have ${n} day${n === 1 ? '' : 's'} to prepare.` : ''}</p>`}
          <div class="card-actions" style="margin-top:16px">
            ${n > 0 ? `<button class="btn btn-soft btn-sm" data-act="plan" data-id="${ev.id}">${icon(st ? 'reset' : 'sparkles')}${st ? 'Rebuild plan' : 'Build revision plan'}</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-act="study" data-id="${ev.id}">${icon('play')}Study now</button>
            ${st ? `<button class="btn btn-ghost btn-sm" data-act="unplan" data-id="${ev.id}">${icon('trash')}Remove plan</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;

    v.onclick = async e => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const ev = a.dataset.id && S.get('events', a.dataset.id);
      switch (a.dataset.act) {
        case 'add': Forms.event(null); break;
        case 'edit-event': Forms.event(ev); break;
        case 'plan': NextWavePro.gate('Exam planner', () => buildPlan(ev)); break;
        case 'unplan':
          if (await UI.confirm(`Remove the revision plan for ${ev.title}? Your logged study time stays.`, { title: 'Remove plan?', label: 'Remove' })) { delete pd().plans[ev.id]; S.commit(); App.refresh(); }
          break;
        case 'study':
          if (ev.subjectId) Timer.setSubject(ev.subjectId);
          if (!Timer.s.running && Timer.s.mode !== 'focus') Timer.setMode('focus');
          location.hash = '#/timer';
          break;
      }
    };
  };

  /* ======================= GRADES & APS ======================= */
  const APS_BANDS = [[80, 7], [70, 6], [60, 5], [50, 4], [40, 3], [30, 2], [0, 1]];
  const apsPoints = m => APS_BANDS.find(([min]) => m >= min)[1];
  const isLO = s => /life\s*orientation/i.test(s.name);
  function weighted(list) {
    const w = list.reduce((a, x) => a + (+x.weight || 0), 0);
    if (!w) return null;
    return { mark: list.reduce((a, x) => a + (+x.weight || 0) * (+x.mark || 0), 0) / w, weight: w };
  }

  function assessmentForm(s, item) {
    const edit = !!item;
    item = item || { name: '', weight: 25, mark: '' };
    UI.modal({
      title: edit ? 'Edit assessment' : `Add ${s.name} assessment`,
      body: `<div class="field"><label>Assessment</label><input class="input" name="name" required maxlength="60" value="${esc(item.name)}" placeholder="e.g. June exam, Project, Test 2"></div>
        <div class="row"><div class="field"><label>Weight (% of final mark)</label><input class="input" type="number" name="weight" min="1" max="100" step="0.5" required value="${item.weight}"></div>
        <div class="field"><label>Your mark (%)</label><input class="input" type="number" name="mark" min="0" max="100" step="0.5" required value="${item.mark}"></div></div>`,
      submitLabel: edit ? 'Save' : 'Add',
      extraFooter: edit ? `<button type="button" class="btn btn-text-danger" data-del>${icon('trash')}Delete</button>` : '',
      onOpen(m) {
        const d = m.el.querySelector('[data-del]');
        if (d) d.onclick = () => { const l = pd().grades[s.id]; l.splice(l.indexOf(item), 1); S.commit(); m.close(true); App.refresh(); };
      },
      onSubmit(f) {
        const o = { name: f.name.trim(), weight: Math.min(100, Math.max(0.5, +f.weight)), mark: Math.min(100, Math.max(0, +f.mark)) };
        if (!o.name) return false;
        const list = pd().grades[s.id] = pd().grades[s.id] || [];
        if (edit) Object.assign(item, o); else list.push(o);
        S.commit(); App.refresh();
      },
    });
  }

  P.grades = function (v) {

    const subs = S.data.subjects, g = pd().grades;
    const ranked = subs.filter(s => !isLO(s)).map(s => ({ s, pts: apsPoints(s.grade) })).sort((a, b) => b.pts - a.pts);
    const best6 = ranked.slice(0, 6), aps = best6.reduce((a, x) => a + x.pts, 0);
    const avg = subs.length ? subs.reduce((a, s) => a + s.grade, 0) / subs.length : 0;

    v.innerHTML = `
    <div class="grid grid-2" style="margin-top:8px">
      <div class="card aps-card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('cap')}</span>Your APS score</h3><div class="sub">Admission Point Score from current marks${subs.some(isLO) ? ' · Life Orientation excluded' : ''}</div></div></div>
        <div class="aps-top"><div class="aps-num"><b>${aps}</b><small>of 42</small></div>
          <p class="muted small">Universities use APS to decide admission; many degrees ask for 30 or more. Check the exact requirement in your chosen university’s prospectus.${ranked.length < 6 ? ` Add ${6 - ranked.length} more subject${6 - ranked.length === 1 ? '' : 's'} for a full score.` : ''}</p></div>
        <div class="list" style="margin-top:14px">${best6.map(({ s, pts }) => `<div class="item"><span class="sdot" style="--c:${s.color}"></span><div class="item-body"><div class="item-title">${esc(s.name)}</div><div class="item-meta">${s.grade}%</div></div><span class="pill">${pts} pt${pts === 1 ? '' : 's'}</span></div>`).join('') || UI.empty('book', 'No subjects yet', 'Add subjects to see your APS.')}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3><span class="head-icon">${icon('award')}</span>Mark bands</h3><div class="sub">Average across subjects: ${avg.toFixed(1)}%</div></div></div>
        <div class="list">${[[80, 100, 7, 'Outstanding'], [70, 79, 6, 'Meritorious'], [60, 69, 5, 'Substantial'], [50, 59, 4, 'Adequate'], [40, 49, 3, 'Moderate'], [30, 39, 2, 'Elementary'], [0, 29, 1, 'Not achieved']].map(([a, b, p, l]) => {
          const n = subs.filter(s => s.grade >= a && s.grade <= b).length;
          return `<div class="item band-row"><b class="band-pts">${p}</b><div class="item-body"><div class="item-title">${l}</div><div class="item-meta">${a}–${b}%</div></div>${n ? `<span class="pill">${n} subject${n === 1 ? '' : 's'}</span>` : ''}</div>`;
        }).join('')}</div>
      </div>
    </div>
    <div class="section-head"><div><h3>Grade calculator</h3><p>Add each assessment with its weight. StudyHub works out your mark and what you still need.</p></div></div>
    <div class="subj-grid stagger">
      ${subs.map(s => {
        const list = g[s.id] || [], w = weighted(list), left = Math.max(0, 100 - (w ? w.weight : 0));
        const earned = list.reduce((a, x) => a + (+x.weight || 0) * (+x.mark || 0), 0) / 100;
        const need = left > 0 ? (s.target - earned) / left * 100 : null;
        let verdict = '';
        if (w && left > 0) verdict = need <= 0 ? `<span class="pill success">${icon('check')}Target ${s.target}% already secured</span>`
          : need > 100 ? `<span class="pill urgent">Needs ${need.toFixed(0)}% on the last ${left}%: out of reach</span>`
          : `<span class="pill soft">Need <b>${need.toFixed(0)}%</b> on the remaining ${left}% for ${s.target}%</span>`;
        else if (w) verdict = w.mark >= s.target ? `<span class="pill success">${icon('check')}Final: on target</span>` : `<span class="pill soft">Final mark ${w.mark.toFixed(1)}%</span>`;
        return `<div class="card subj-card" style="--c:${s.color}">
          <div class="subj-head"><div class="subj-icon">${icon('book')}</div><div class="item-body"><h4>${esc(s.name)}</h4><div class="item-meta">Target ${s.target}% · current ${s.grade}%</div></div>
            <div class="calc-mark"><b>${w ? w.mark.toFixed(1) + '%' : '–'}</b><small>${w ? `from ${w.weight}%` : 'no marks'}</small></div></div>
          <div class="list" style="gap:6px">${list.map((x, i) => `<button class="item click calc-row" data-act="edit" data-sid="${s.id}" data-i="${i}"><div class="item-body"><div class="item-title">${esc(x.name)}</div><div class="item-meta">Weight ${x.weight}%</div></div><b>${x.mark}%</b></button>`).join('')}</div>
          <div style="margin-top:10px">${verdict}</div>
          <div class="card-actions" style="margin-top:14px">
            <button class="btn btn-soft btn-sm" data-act="add" data-sid="${s.id}">${icon('plus')}Assessment</button>
            ${w ? `<button class="btn btn-ghost btn-sm" data-act="apply" data-sid="${s.id}">${icon('check')}Use ${Math.round(w.mark)}% as current mark</button>` : ''}
          </div>
        </div>`;
      }).join('') || UI.empty('book', 'No subjects yet', 'Add subjects first, then track their assessments here.', '<a class="btn btn-primary" href="#/subjects">Go to subjects</a>')}
    </div>`;

    v.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const s = S.get('subjects', a.dataset.sid); if (!s) return;
      NextWavePro.gate('Grade calculator', () => {
        if (a.dataset.act === 'add') assessmentForm(s);
        else if (a.dataset.act === 'edit') assessmentForm(s, (pd().grades[s.id] || [])[+a.dataset.i]);
        else if (a.dataset.act === 'apply') {
          const w = weighted(pd().grades[s.id] || []); if (!w) return;
          S.update('subjects', s.id, { grade: Math.round(w.mark) });
          UI.toast(`${s.name} current mark set to ${Math.round(w.mark)}%.`, { icon: 'award' });
          App.refresh();
        }
      });
    };
  };

  /* ======================= Settings hooks ======================= */
  window.StudyPro = {
    badge,
    palettes: ALL_PALETTES,
    proPalette: k => PRO_KEYS.includes(k),
    paletteName: k => (ALL_PALETTES.find(p => p[0] === k) || ALL_PALETTES[0])[1],
    paletteButtons(current) {
      return ALL_PALETTES.map(([k, l, c1, c2]) => `<button class="palette ${current === k ? 'on' : ''}" data-act="accent" data-a="${k}" aria-pressed="${current === k}"><span class="pal-sw" style="background:linear-gradient(135deg,${c2} 0 50%,${c1} 50% 100%)"></span>${l}${PRO_KEYS.includes(k) && !isPro() ? badge : ''}</button>`).join('');
    },
    card() { return ''; },
  };

  /* keep the chrome in sync with Pro state */
  function syncPro() {
    document.documentElement.classList.toggle('is-pro', isPro());
    if (!isPro() && PRO_KEYS.includes(document.documentElement.dataset.accent)) App.setAccent('teal');
    if (App.ready) { App.rebuildNav && App.rebuildNav(); App.refresh(); }
  }
  window.addEventListener('nextwave-pro-change', syncPro);
  document.documentElement.classList.toggle('is-pro', isPro());
})();
