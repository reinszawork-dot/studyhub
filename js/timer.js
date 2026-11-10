/* StudyHub — Pomodoro-style study timer engine (survives navigation and refresh) */
(function () {
  const KEY = 'studyhub:timer';
  const MODE = { focus: 'Focus session', short: 'Short break', long: 'Long break' };

  const Timer = {
    s: null, MODE,
    init() {
      try { this.s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { this.s = null; }
      if (!this.s || !MODE[this.s.mode]) {
        const d = this.len('focus');
        this.s = { mode: 'focus', duration: d, remaining: d, running: false, endAt: null, subjectId: S.data.subjects[0]?.id || '', cycle: 0 };
      }
      setInterval(() => this.tick(), 250);
      document.addEventListener('visibilitychange', () => this.tick());
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { } },
    len(m) { const st = S.settings; return Math.max(1, +(m === 'focus' ? st.focusMin : m === 'short' ? st.shortMin : st.longMin) || 1) * 60; },
    left() { const s = this.s; return s.running ? Math.max(0, (s.endAt - Date.now()) / 1000) : s.remaining; },
    elapsed() { return Math.max(0, this.s.duration - this.left()); },
    pristine() { return !this.s.running && this.s.remaining >= this.s.duration; },
    setMode(m) {
      const s = this.s;
      Object.assign(s, { mode: m, duration: this.len(m), running: false, endAt: null });
      s.remaining = s.duration;
      this.save(); this.emit();
    },
    start() {
      const s = this.s;
      if (s.remaining <= 0) s.remaining = s.duration;
      s.endAt = Date.now() + s.remaining * 1000; s.running = true;
      this.save(); this.emit();
    },
    pause() {
      const s = this.s; if (!s.running) return;
      s.remaining = this.left(); s.running = false; s.endAt = null;
      this.save(); this.emit();
    },
    toggle() { this.s.running ? this.pause() : this.start(); },
    reset() { this.setMode(this.s.mode); },
    syncLength() { if (this.pristine()) this.setMode(this.s.mode); },
    setSubject(id) { this.s.subjectId = id; this.save(); },
    finish() {
      const mins = Math.floor(this.elapsed() / 60);
      if (this.s.mode === 'focus' && mins >= 1) {
        S.addSession({ subjectId: S.validSubject(this.s.subjectId) || null, minutes: mins, source: 'timer' });
        UI.toast(`${fmtMin(mins)} of ${S.subject(this.s.subjectId).name} added to your study log.`, { title: 'Session saved', icon: 'check' });
      }
      this.reset();
      App.afterTimer();
    },
    skip() {
      const s = this.s;
      this.setMode(s.mode === 'focus' ? ((s.cycle + 1) % 4 === 0 ? 'long' : 'short') : 'focus');
    },
    complete() {
      const s = this.s;
      s.running = false; s.endAt = null; s.remaining = 0;
      UI.beep();
      if (s.mode === 'focus') {
        const mins = Math.round(s.duration / 60);
        S.data.stats.pomodoros = (S.data.stats.pomodoros || 0) + 1;
        s.cycle = (s.cycle || 0) + 1;
        S.addSession({ subjectId: S.validSubject(s.subjectId) || null, minutes: mins, source: 'timer' });
        UI.toast(`${fmtMin(mins)} of ${S.subject(s.subjectId).name} logged. Take a breather — you earned it.`, { title: 'Focus session complete', icon: 'sparkles', type: 'celebrate', duration: 5000 });
        this.setMode(s.cycle % 4 === 0 ? 'long' : 'short');
      } else {
        UI.toast('Break finished. Ready for another focused session?', { title: 'Back to it', icon: 'zap' });
        this.setMode('focus');
      }
      App.afterTimer();
    },
    tick() {
      if (!this.s) return;
      if (this.s.running && this.left() <= 0) this.complete();
      this.emit();
    },
    emit() { if (window.App && App.timerUI) App.timerUI(this); },
    text() {
      const sec = Math.ceil(this.left()), m = Math.floor(sec / 60), r = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    },
  };
  window.Timer = Timer;
})();
