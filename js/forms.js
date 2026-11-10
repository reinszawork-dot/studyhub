/* StudyHub — create / edit dialogs shared across pages */
(function () {
  const { esc, cap } = UI;
  const today = () => D.key(D.today());

  const prioritySeg = sel => `<div class="seg radio full">${['low', 'medium', 'high'].map(p => `<label><input type="radio" name="priority" value="${p}" ${p === sel ? 'checked' : ''}><span>${cap(p)}</span></label>`).join('')}</div>`;
  const delBtn = '<button type="button" class="btn btn-text-danger" data-del>' + icon('trash') + 'Delete</button>';

  function wireDelete(m, what, coll, id, after) {
    const b = m.el.querySelector('[data-del]');
    if (!b) return;
    b.onclick = async () => {
      m.close(true);
      if (await UI.confirm(`This ${what} will be permanently removed.`, { title: `Delete ${what}?` })) {
        S.remove(coll, id);
        UI.toast(`${cap(what)} deleted`, { icon: 'trash' });
        after && after();
        App.refresh();
      }
    };
  }

  const Forms = {
    task(t, preset = {}) {
      const e = !!t;
      t = t || { title: '', subjectId: preset.subjectId || '', due: preset.due ?? today(), priority: 'medium' };
      UI.modal({
        title: e ? 'Edit task' : 'New task',
        body: `<div class="field"><label>Task</label><input class="input" name="title" required maxlength="140" value="${esc(t.title)}" placeholder="e.g. Finish chapter 4 summary"></div>
          <div class="row"><div class="field"><label>Subject</label><select class="select" name="subjectId">${UI.subjectOptions(t.subjectId)}</select></div>
          <div class="field"><label>Due date</label><input class="input" type="date" name="due" value="${t.due || ''}"></div></div>
          <div class="field"><label>Priority</label>${prioritySeg(t.priority || 'medium')}</div>`,
        submitLabel: e ? 'Save changes' : 'Add task',
        extraFooter: e ? delBtn : '',
        onOpen: m => e && wireDelete(m, 'task', 'tasks', t.id),
        onSubmit(f) {
          const o = { title: f.title.trim(), subjectId: f.subjectId || null, due: f.due || null, priority: f.priority || 'medium' };
          if (!o.title) return false;
          if (e) S.update('tasks', t.id, o); else S.add('tasks', { ...o, done: false, created: Date.now(), doneAt: null });
          UI.toast(e ? 'Task updated' : `“${o.title}” added to your tasks`, { title: e ? '' : 'Task added', icon: 'tasks' });
          App.refresh();
        },
      });
    },

    event(ev, date) {
      const e = !!ev;
      ev = ev || { title: '', type: 'assignment', subjectId: '', date: date || today(), time: '', notes: '' };
      const types = [['exam', 'Exam'], ['assignment', 'Assignment'], ['study', 'Study session'], ['other', 'Other']];
      UI.modal({
        title: e ? 'Edit event' : 'New calendar event',
        body: `<div class="field"><label>Title</label><input class="input" name="title" required maxlength="100" value="${esc(ev.title)}" placeholder="e.g. Mathematics Paper 2"></div>
          <div class="field"><label>Type</label><div class="seg radio full">${types.map(([v, l]) => `<label><input type="radio" name="type" value="${v}" ${ev.type === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
          <div class="row"><div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${ev.date}"></div>
          <div class="field"><label>Time <span class="muted">(optional)</span></label><input class="input" type="time" name="time" value="${ev.time || ''}"></div></div>
          <div class="field"><label>Subject</label><select class="select" name="subjectId">${UI.subjectOptions(ev.subjectId)}</select></div>
          <div class="field"><label>Notes <span class="muted">(optional)</span></label><textarea class="textarea" name="notes" rows="3" maxlength="500" placeholder="Venue, chapters covered, what to bring…">${esc(ev.notes || '')}</textarea></div>`,
        submitLabel: e ? 'Save changes' : 'Add to calendar',
        extraFooter: e ? delBtn : '',
        onOpen: m => e && wireDelete(m, 'event', 'events', ev.id),
        onSubmit(f) {
          const o = { title: f.title.trim(), type: f.type || 'other', date: f.date, time: f.time || '', subjectId: f.subjectId || null, notes: (f.notes || '').trim() };
          if (!o.title || !o.date) return false;
          if (e) S.update('events', ev.id, o); else S.add('events', o);
          UI.toast(e ? 'Event updated' : `${o.title} · ${D.fmt(o.date, { weekday: 'short', day: 'numeric', month: 'short' })}`, { title: e ? '' : 'Added to calendar', icon: 'calendar' });
          App.refresh();
        },
      });
    },

    session(preset = {}) {
      UI.modal({
        title: 'Log a study session',
        body: `<p class="muted small" style="margin-bottom:14px">Studied without the timer? Add it here so your stats stay accurate.</p>
          <div class="field"><label>Subject</label><select class="select" name="subjectId">${UI.subjectOptions(preset.subjectId ?? (S.data.subjects[0]?.id || ''))}</select></div>
          <div class="row"><div class="field"><label>Date</label><input class="input" type="date" name="date" required max="${today()}" value="${preset.date || today()}"></div>
          <div class="field"><label>Duration (minutes)</label><input class="input" type="number" name="minutes" required min="1" max="720" step="1" value="${preset.minutes || 45}" data-mins></div></div>
          <div class="chips">${[25, 45, 60, 90, 120].map(m => `<button type="button" class="chip" data-set="${m}">${fmtMin(m)}</button>`).join('')}</div>`,
        submitLabel: 'Log session',
        onOpen(m) {
          m.el.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
            m.el.querySelector('[data-mins]').value = b.dataset.set;
            m.el.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          });
        },
        onSubmit(f) {
          const minutes = Math.round(+f.minutes);
          if (!(minutes > 0) || !f.date) return false;
          if (f.date > today()) { UI.toast('You can only log sessions for today or earlier.', { icon: 'alert', type: 'danger' }); return false; }
          S.addSession({ subjectId: f.subjectId || null, date: f.date, minutes, source: 'manual' });
          UI.toast(`${fmtMin(minutes)} of ${S.subject(f.subjectId).name} logged for ${D.rel(f.date).toLowerCase()}.`, { title: 'Session logged', icon: 'clock' });
          App.refresh();
        },
      });
    },

    goal(g) {
      const e = !!g;
      g = g || { title: '', current: 0, target: 10, unit: '', subjectId: '', deadline: '' };
      UI.modal({
        title: e ? 'Edit goal' : 'New academic goal',
        body: `<div class="field"><label>Goal</label><input class="input" name="title" required maxlength="100" value="${esc(g.title)}" placeholder="e.g. Complete 15 past papers"></div>
          <div class="row-3"><div class="field"><label>Progress</label><input class="input" type="number" name="current" min="0" step="any" required value="${g.current}"></div>
          <div class="field"><label>Target</label><input class="input" type="number" name="target" min="1" step="any" required value="${g.target}"></div>
          <div class="field"><label>Unit</label><input class="input" name="unit" maxlength="16" value="${esc(g.unit)}" placeholder="papers"></div></div>
          <div class="row"><div class="field"><label>Subject</label><select class="select" name="subjectId">${UI.subjectOptions(g.subjectId)}</select></div>
          <div class="field"><label>Deadline <span class="muted">(optional)</span></label><input class="input" type="date" name="deadline" value="${g.deadline || ''}"></div></div>`,
        submitLabel: e ? 'Save goal' : 'Create goal',
        extraFooter: e ? delBtn : '',
        onOpen: m => e && wireDelete(m, 'goal', 'goals', g.id),
        onSubmit(f) {
          const o = { title: f.title.trim(), current: Math.max(0, +f.current || 0), target: Math.max(1, +f.target || 1), unit: f.unit.trim(), subjectId: f.subjectId || null, deadline: f.deadline || '' };
          if (!o.title) return false;
          if (e) S.update('goals', g.id, o); else S.add('goals', { ...o, created: Date.now() });
          UI.toast(e ? 'Goal updated' : 'New goal set — you’ve got this.', { title: e ? '' : 'Goal created', icon: 'target' });
          App.refresh();
        },
      });
    },

    subject(s) {
      const e = !!s;
      const used = S.data.subjects.map(x => x.color);
      s = s || { name: '', color: COLORS.find(c => !used.includes(c)) || COLORS[0], grade: 70, target: 80, teacher: '' };
      UI.modal({
        title: e ? 'Edit subject' : 'Add a subject',
        body: `<div class="field"><label>Subject name</label><input class="input" name="name" required maxlength="40" value="${esc(s.name)}" placeholder="e.g. Geography"></div>
          <div class="field"><label>Teacher / lecturer <span class="muted">(optional)</span></label><input class="input" name="teacher" maxlength="40" value="${esc(s.teacher || '')}"></div>
          <div class="row"><div class="field"><label>Current mark (%)</label><input class="input" type="number" name="grade" min="0" max="100" required value="${s.grade}"></div>
          <div class="field"><label>Target mark (%)</label><input class="input" type="number" name="target" min="0" max="100" required value="${s.target}"></div></div>
          <div class="field"><label>Colour</label><div class="swatches">${COLORS.map(c => `<label><input type="radio" name="color" value="${c}" ${c === s.color ? 'checked' : ''}><span style="--c:${c}"></span></label>`).join('')}</div></div>`,
        submitLabel: e ? 'Save subject' : 'Add subject',
        extraFooter: e ? delBtn : '',
        onOpen(m) {
          const b = m.el.querySelector('[data-del]');
          if (b) b.onclick = async () => {
            m.close(true);
            const n = S.data.sessions.filter(x => x.subjectId === s.id).length;
            if (await UI.confirm(`${s.name} will be removed. Its ${n} study sessions, tasks and notes are kept and moved to “General”.`, { title: 'Delete subject?' })) {
              S.remove('subjects', s.id);
              UI.toast(`${s.name} removed`, { icon: 'trash' });
              App.refresh();
            }
          };
        },
        onSubmit(f) {
          const clamp = v => Math.min(100, Math.max(0, Math.round(+v || 0)));
          const o = { name: f.name.trim(), teacher: f.teacher.trim(), grade: clamp(f.grade), target: clamp(f.target), color: f.color || COLORS[0] };
          if (!o.name) return false;
          if (e) S.update('subjects', s.id, o); else S.add('subjects', o);
          UI.toast(e ? 'Subject updated' : `${o.name} added`, { icon: 'book' });
          App.refresh();
        },
      });
    },
  };
  window.Forms = Forms;
})();
