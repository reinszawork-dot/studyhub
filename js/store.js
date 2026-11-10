/* StudyHub — data store, date helpers and sample data */
(function () {
  const KEY = 'studyhub:data:v1';
  const pad = n => String(n).padStart(2, '0');

  const D = {
    key: d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    parse: k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); },
    today: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; },
    add: (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
    sow: d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; },
    som: d => new Date(d.getFullYear(), d.getMonth(), 1),
    between: (a, b) => Math.round((b - a) / 864e5),
    fmt: (k, o) => (typeof k === 'string' ? D.parse(k) : k).toLocaleDateString('en-ZA', o || { day: 'numeric', month: 'short' }),
    rel(k) {
      const n = D.between(D.today(), D.parse(k));
      if (n === 0) return 'Today';
      if (n === 1) return 'Tomorrow';
      if (n === -1) return 'Yesterday';
      if (n > 1 && n < 7) return `In ${n} days`;
      if (n >= 7 && n < 60) return `In ${n} days`;
      if (n < 0) return `${-n} days ago`;
      return D.fmt(k);
    },
    days: k => D.between(D.today(), D.parse(k)),
  };

  const fmtMin = m => {
    m = Math.max(0, Math.round(m || 0));
    const h = Math.floor(m / 60), r = m % 60;
    if (!h) return `${r}m`;
    return r ? `${h}h ${r}m` : `${h}h`;
  };
  const fmtH = (m, d = 1) => `${(m / 60).toFixed(d).replace(/\.0+$/, '')}h`;
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);

  const COLORS = ['#0d9488', '#0284c7', '#16a34a', '#e11d48', '#f59e0b', '#7c3aed', '#ea580c', '#0891b2', '#65a30d', '#64748b'];
  const DEFAULTS = { name: 'Alex', level: 'Grade 12', dailyGoalMin: 120, weeklyGoalHrs: 12, focusMin: 25, shortMin: 5, longMin: 15, sound: true };

  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function seed() {
    const r = rng(73021), t = D.today(), k = n => D.key(D.add(t, n)), now = Date.now();
    const subjects = [
      { id: 's-math', name: 'Mathematics', color: '#0d9488', grade: 72, target: 80, teacher: 'Mr Naidoo' },
      { id: 's-phys', name: 'Physical Sciences', color: '#0284c7', grade: 68, target: 75, teacher: 'Ms Dlamini' },
      { id: 's-life', name: 'Life Sciences', color: '#16a34a', grade: 81, target: 85, teacher: 'Mrs Botha' },
      { id: 's-eng', name: 'English', color: '#e11d48', grade: 76, target: 80, teacher: 'Mr Peters' },
      { id: 's-acc', name: 'Accounting', color: '#f59e0b', grade: 64, target: 75, teacher: 'Ms Mokoena' },
      { id: 's-hist', name: 'History', color: '#7c3aed', grade: 79, target: 80, teacher: 'Mr van Wyk' },
    ];
    const w = [.25, .19, .15, .14, .16, .11];
    const pick = () => { let x = r(), acc = 0; for (let i = 0; i < w.length; i++) { acc += w[i]; if (x < acc) return subjects[i].id; } return subjects[0].id; };
    const lens = [25, 30, 40, 45, 50, 60, 75, 90];
    const sessions = [];
    for (let i = 150; i >= 1; i--) {
      const d = D.add(t, -i), wk = d.getDay() === 0 || d.getDay() === 6;
      const trend = .72 + .28 * (1 - i / 150);
      let p = (wk ? .55 : .87) * trend;
      if (i <= 11) p = 1;
      if (r() < p) {
        const n = wk ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);
        for (let j = 0; j < n; j++) sessions.push({ id: uid(), subjectId: pick(), date: D.key(d), minutes: lens[Math.floor(r() * lens.length)], created: now - i * 864e5 + j * 36e5 });
      }
    }
    sessions.push({ id: uid(), subjectId: 's-math', date: D.key(t), minutes: 50, created: now - 2 * 36e5 });

    const tasks = [
      ['Finish calculus worksheet (Ex. 6.2)', 's-math', 0, 'high', false],
      ['Write up rates of reaction lab report', 's-phys', 2, 'high', false],
      ['Read chapters 4–6 of set novel', 's-eng', 1, 'medium', false],
      ['Summarise cell division (mitosis vs meiosis)', 's-life', 0, 'medium', false],
      ['Cash flow statement practice questions', 's-acc', 4, 'medium', false],
      ['Cold War essay outline', 's-hist', 6, 'low', false],
      ['Make flashcards for organic chemistry', 's-phys', -1, 'medium', false],
      ['Past paper: 2023 Paper 1', 's-math', -1, 'high', true],
      ['Submit English oral topic', 's-eng', -3, 'medium', true],
      ['Revise financial ratios', 's-acc', -2, 'low', true],
      ['Photosynthesis mind map', 's-life', -5, 'low', true],
    ].map(([title, subjectId, d, priority, done], i) => ({ id: uid(), title, subjectId, due: k(d), priority, done, created: now - (10 - i) * 864e5, doneAt: done ? now - 864e5 : null }));

    const events = [
      ['Study group: Calculus', 'study', 's-math', 2, '15:00'],
      ['Lab report due', 'assignment', 's-phys', 3, '08:00'],
      ['Literature essay due', 'assignment', 's-eng', 5, ''],
      ['Mathematics Paper 1', 'exam', 's-math', 9, '09:00'],
      ['Life Sciences test', 'exam', 's-life', 12, '10:30'],
      ['Accounting project due', 'assignment', 's-acc', 16, ''],
      ['History Paper 2', 'exam', 's-hist', 20, '09:00'],
      ['Physical Sciences Paper 1', 'exam', 's-phys', 24, '09:00'],
      ['Career guidance talk', 'other', '', 7, '13:00'],
      ['Life Sciences practical', 'assignment', 's-life', -4, ''],
      ['Maths revision session', 'study', 's-math', -2, '16:00'],
    ].map(([title, type, subjectId, d, time]) => ({ id: uid(), title, type, subjectId: subjectId || null, date: k(d), time, notes: '' }));

    const notes = [
      { title: 'Differentiation rules', subjectId: 's-math', pinned: true, body: 'Power rule:  d/dx xⁿ = n·xⁿ⁻¹\nProduct rule:  (uv)′ = u′v + uv′\nQuotient rule:  (u/v)′ = (u′v − uv′) / v²\nChain rule:  d/dx f(g(x)) = f′(g(x))·g′(x)\n\nExam tips\n• Always simplify before differentiating.\n• First principles questions: write the limit definition in full.\n• Practise Ex. 6.2 Q3–Q8 before Thursday.' },
      { title: 'Rates of reaction', subjectId: 's-phys', pinned: false, body: 'Factors that increase the rate of a reaction:\n1. Higher temperature — more particles have energy ≥ activation energy.\n2. Higher concentration — more effective collisions per second.\n3. Larger surface area — more particles exposed.\n4. Catalyst — provides an alternative pathway with lower activation energy.\n\nRemember to label Maxwell–Boltzmann graphs clearly.' },
      { title: 'Set novel — key themes', subjectId: 's-eng', pinned: false, body: 'Themes: ambition, identity, power and its corruption.\n\nUseful quotes to memorise (5 max).\nEssay structure: intro with clear thesis → 3 body paragraphs (PEEL) → conclusion that answers the question.' },
      { title: 'Mitosis vs meiosis', subjectId: 's-life', pinned: false, body: 'Mitosis: 1 division, 2 identical diploid cells — growth & repair.\nMeiosis: 2 divisions, 4 genetically different haploid cells — gametes.\n\nCrossing over happens in Prophase I.\nDraw and label each phase for the test.' },
      { title: 'Exam week plan', subjectId: null, pinned: true, body: 'Mon — Maths past paper + memo\nTue — Physics definitions + calculations\nWed — Life Sciences diagrams\nThu — English essay practice\nFri — Accounting: cash flow + ratios\n\nSleep 8 hours. Water. Short walks between sessions.' },
    ].map((n, i) => ({ id: uid(), ...n, updated: now - (i + 1) * 5e6 }));

    const goals = [
      { title: 'Complete 20 Maths past papers', current: 11, target: 20, unit: 'papers', subjectId: 's-math', deadline: k(40) },
      { title: 'Master 300 Life Sciences flashcards', current: 180, target: 300, unit: 'cards', subjectId: 's-life', deadline: k(30) },
      { title: 'Read 6 set-work books', current: 4, target: 6, unit: 'books', subjectId: 's-eng', deadline: '' },
      { title: 'Raise Accounting mark to 75%', current: 64, target: 75, unit: '%', subjectId: 's-acc', deadline: k(60) },
    ].map(g => ({ id: uid(), created: now, ...g }));

    return { version: 1, settings: { ...DEFAULTS }, subjects, sessions, tasks, events, notes, goals, achieved: {}, celebrated: {}, stats: { pomodoros: 6 }, firstRun: true };
  }

  function empty(settings) {
    return { version: 1, settings: { ...DEFAULTS, ...(settings || {}) }, subjects: [], sessions: [], tasks: [], events: [], notes: [], goals: [], achieved: {}, celebrated: {}, stats: { pomodoros: 0 }, firstRun: false };
  }

  const listeners = [];
  const GENERAL = { id: '', name: 'General', color: '#94a3b8' };

  const S = {
    data: null, _c: null,
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
      if (!d || d.version !== 1 || !Array.isArray(d.subjects)) d = seed();
      this.data = this.normalize(d);
      this.save();
    },
    normalize(d) {
      const e = empty();
      for (const k of Object.keys(e)) if (d[k] == null) d[k] = e[k];
      d.settings = { ...DEFAULTS, ...d.settings };
      // v1.1: move sample subjects off the old purple palette (only if the user never changed them)
      const OLD = { 's-math': ['#7c3aed', '#0d9488'], 's-phys': ['#0ea5e9', '#0284c7'], 's-life': ['#10b981', '#16a34a'], 's-eng': ['#db2777', '#e11d48'], 's-hist': ['#6366f1', '#7c3aed'] };
      d.subjects.forEach(s => { const o = OLD[s.id]; if (o && s.color === o[0]) s.color = o[1]; });
      return d;
    },
    save() { this._c = null; try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage full or blocked */ } },
    commit() { this.save(); listeners.forEach(f => { try { f(); } catch (e) { console.error(e); } }); },
    on(f) { listeners.push(f); },
    reset() { const { name, level } = this.data.settings; this.data = seed(); Object.assign(this.data.settings, { name, level }); this.data.firstRun = false; this.commit(); },
    clear() { const { name, level } = this.data.settings; this.data = empty({ name, level }); this.commit(); },
    replace(d) { this.data = this.normalize(d); this.data.firstRun = false; this.commit(); },
    get settings() { return this.data.settings; },
    subject(id) { return this.data.subjects.find(s => s.id === id) || GENERAL; },
    subjectsWithGeneral() { return [...this.data.subjects, GENERAL]; },
    validSubject(id) { return this.data.subjects.some(s => s.id === id) ? id : ''; },
    add(coll, obj) { obj.id = obj.id || uid(); this.data[coll].push(obj); this.commit(); return obj; },
    update(coll, id, patch, quiet) { const o = this.data[coll].find(x => x.id === id); if (o) Object.assign(o, patch); quiet ? this.save() : this.commit(); return o; },
    remove(coll, id) { this.data[coll] = this.data[coll].filter(x => x.id !== id); this.commit(); },
    get(coll, id) { return this.data[coll].find(x => x.id === id); },
    addSession(s) { return this.add('sessions', { subjectId: null, date: D.key(D.today()), minutes: 0, created: Date.now(), ...s }); },

    days() {
      if (!this._c) { const m = {}; for (const s of this.data.sessions) m[s.date] = (m[s.date] || 0) + (+s.minutes || 0); this._c = m; }
      return this._c;
    },
    minutesOn(k) { return this.days()[k] || 0; },
    minutesRange(a, b) { let t = 0; for (let d = new Date(a); d < b; d = D.add(d, 1)) t += this.minutesOn(D.key(d)); return t; },
    bySubject(a, b) {
      const ak = a ? D.key(a) : '0000', bk = b ? D.key(b) : '9999', m = {};
      for (const s of this.data.sessions) if (s.date >= ak && s.date < bk) { const id = this.validSubject(s.subjectId); m[id] = (m[id] || 0) + (+s.minutes || 0); }
      return m;
    },
    sessionsIn(a, b) { const ak = D.key(a), bk = D.key(b); return this.data.sessions.filter(s => s.date >= ak && s.date < bk); },
    totalMinutes() { return Object.values(this.days()).reduce((a, b) => a + b, 0); },
    streak() {
      let d = D.today();
      if (!this.minutesOn(D.key(d))) d = D.add(d, -1);
      let n = 0;
      while (this.minutesOn(D.key(d)) > 0) { n++; d = D.add(d, -1); }
      return n;
    },
    bestStreak() {
      const days = this.days(), keys = Object.keys(days).filter(k => days[k] > 0).sort();
      let best = 0, cur = 0, prev = null;
      for (const k of keys) { const d = D.parse(k); cur = prev && D.between(prev, d) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
      return best;
    },
  };

  window.D = D; window.S = S; window.fmtMin = fmtMin; window.fmtH = fmtH; window.uid = uid; window.COLORS = COLORS;
})();
