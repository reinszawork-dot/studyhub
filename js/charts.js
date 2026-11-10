/* StudyHub — Chart.js builders (theme-aware, animated, interactive) */
(function () {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const alpha = (hex, a) => {
    if (!hex || hex[0] !== '#') return hex;
    let h = hex.slice(1); if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  };
  const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
  const stagger = (step = 55) => ({
    duration: 1000, easing: 'easeOutQuart',
    delay: c => (c.type === 'data' && c.mode === 'default') ? c.dataIndex * step + c.datasetIndex * 25 : 0,
  });

  const Charts = {
    list: [], quiet: false, alpha, css,
    ok() { return typeof window.Chart !== 'undefined'; },
    theme() {
      return { text: css('--text'), text2: css('--text-2'), muted: css('--muted'), grid: css('--chart-grid'), surface: css('--surface'), border: css('--border'), primary: css('--primary'), soft: css('--primary-soft'), dark: document.documentElement.dataset.theme === 'dark' };
    },
    setup() {
      const t = this.theme(), d = Chart.defaults;
      d.font.family = FONT; d.font.size = 12; d.color = t.muted; d.borderColor = t.grid;
      const tt = d.plugins.tooltip;
      Object.assign(tt, { backgroundColor: t.surface, titleColor: t.text, bodyColor: t.text2, footerColor: t.muted, borderColor: t.border, borderWidth: 1, padding: 12, cornerRadius: 12, boxPadding: 5, usePointStyle: true, caretSize: 6, titleMarginBottom: 8, footerMarginTop: 8 });
      tt.titleFont = { family: FONT, weight: '700', size: 13 };
      tt.bodyFont = { family: FONT, size: 12.5, weight: '500' };
      tt.footerFont = { family: FONT, weight: '700', size: 12 };
      d.plugins.legend.display = false;
      return t;
    },
    make(canvas, cfg) {
      if (!canvas) return null;
      if (!this.ok()) {
        canvas.parentElement.innerHTML = `<div class="chart-fallback">${icon('chart')}<span>Charts couldn't load — check your internet connection and refresh.</span></div>`;
        return null;
      }
      cfg.options = cfg.options || {};
      cfg.options.responsive = true;
      cfg.options.maintainAspectRatio = false;
      cfg.options.animation = this.quiet ? false : (cfg.options.animation || stagger());
      const c = new Chart(canvas, cfg);
      this.list.push(c);
      return c;
    },
    kill(c) { if (!c) return; try { c.destroy(); } catch (e) { } this.list = this.list.filter(x => x !== c); },
    destroyAll() { this.list.forEach(c => { try { c.destroy(); } catch (e) { } }); this.list = []; },

    /* ---------- Weekly study hours (stacked by subject) ---------- */
    weekly(canvas, ws) {
      if (!this.ok()) return this.make(canvas, {});
      const t = this.setup(), tk = D.key(D.today());
      const days = [...Array(7)].map((_, i) => D.add(ws, i)), keys = days.map(D.key);
      const subs = S.subjectsWithGeneral(), per = {};
      subs.forEach(s => per[s.id] = Array(7).fill(0));
      for (const s of S.data.sessions) { const i = keys.indexOf(s.date); if (i < 0) continue; per[S.validSubject(s.subjectId)][i] += +s.minutes || 0; }
      const totals = keys.map((_, i) => subs.reduce((a, s) => a + per[s.id][i], 0));
      const goal = S.settings.dailyGoalMin / 60;
      const ds = subs.filter(s => per[s.id].some(x => x > 0)).map(s => ({
        label: s.name, data: per[s.id].map(m => +(m / 60).toFixed(2)), backgroundColor: s.color, hoverBackgroundColor: alpha(s.color, .85),
        borderColor: t.surface, borderWidth: 2, borderRadius: 7, borderSkipped: false, stack: 's', maxBarThickness: 44,
      }));
      ds.push({ type: 'line', label: 'Daily goal', data: Array(7).fill(goal), borderColor: alpha(t.primary, .7), borderDash: [6, 5], borderWidth: 1.6, pointRadius: 0, pointHoverRadius: 0, stack: 'goal', fill: false, order: -1 });
      return this.make(canvas, {
        type: 'bar',
        data: { labels: days.map(d => d.toLocaleDateString('en-ZA', { weekday: 'short' })), datasets: ds },
        options: {
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { weight: '700' }, color: c => keys[c.index] === tk ? t.primary : t.muted } },
            y: { stacked: true, beginAtZero: true, suggestedMax: Math.ceil(goal + .5), border: { display: false }, grid: { color: t.grid }, ticks: { callback: v => v + 'h', maxTicksLimit: 6 } },
          },
          plugins: {
            tooltip: {
              filter: i => i.dataset.type === 'line' || i.raw > 0,
              callbacks: {
                title: i => D.fmt(keys[i[0].dataIndex], { weekday: 'long', day: 'numeric', month: 'long' }),
                label: c => c.dataset.type === 'line' ? ` Daily goal: ${fmtMin(goal * 60)}` : ` ${c.dataset.label}: ${fmtMin(c.raw * 60)}`,
                footer: i => { const m = totals[i[0].dataIndex]; return `Total ${fmtMin(m)} · ${Math.round(m / (goal * 60) * 100)}% of goal`; },
              },
            },
          },
        },
      });
    },

    /* ---------- Compact weekly totals (dashboard) ---------- */
    weekTotals(canvas) {
      if (!this.ok()) return this.make(canvas, {});
      const t = this.setup(), ws = D.sow(D.today()), tk = D.key(D.today());
      const days = [...Array(7)].map((_, i) => D.add(ws, i)), keys = days.map(D.key);
      const mins = keys.map(k => S.minutesOn(k)), goal = S.settings.dailyGoalMin;
      return this.make(canvas, {
        type: 'bar',
        data: {
          labels: days.map(d => d.toLocaleDateString('en-ZA', { weekday: 'short' })),
          datasets: [
            { label: 'Studied', data: mins.map(m => +(m / 60).toFixed(2)), backgroundColor: keys.map((k, i) => k === tk ? t.primary : (mins[i] >= goal ? alpha(t.primary, .75) : alpha(t.primary, .32))), hoverBackgroundColor: t.primary, borderRadius: 9, borderSkipped: false, maxBarThickness: 38 },
            { type: 'line', label: 'Goal', data: Array(7).fill(goal / 60), borderColor: alpha(t.primary, .6), borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0, fill: false },
          ],
        },
        options: {
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: '700' }, color: c => keys[c.index] === tk ? t.primary : t.muted } },
            y: { beginAtZero: true, suggestedMax: Math.ceil(goal / 60 + .5), border: { display: false }, grid: { color: t.grid }, ticks: { callback: v => v + 'h', maxTicksLimit: 5 } },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: i => D.fmt(keys[i[0].dataIndex], { weekday: 'long', day: 'numeric', month: 'short' }),
                label: c => c.datasetIndex === 1 ? ` Goal: ${fmtMin(goal)}` : ` Studied: ${fmtMin(mins[c.dataIndex])}`,
                footer: i => { const m = mins[i[0].dataIndex]; return m >= goal ? 'Goal reached' : `${fmtMin(goal - m)} to goal`; },
              },
            },
          },
        },
      });
    },

    /* ---------- Monthly productivity (line) ---------- */
    monthly(canvas, off = 0) {
      if (!this.ok()) return this.make(canvas, {});
      const t = this.setup(), t0 = D.today();
      const m = new Date(t0.getFullYear(), t0.getMonth() + off, 1), p = new Date(m.getFullYear(), m.getMonth() - 1, 1);
      const dim = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const n = Math.max(dim(m), dim(p));
      const series = base => Array.from({ length: n }, (_, i) => {
        if (i >= dim(base)) return null;
        const d = new Date(base.getFullYear(), base.getMonth(), i + 1);
        if (d > t0) return null;
        return +(S.minutesOn(D.key(d)) / 60).toFixed(2);
      });
      const name = d => d.toLocaleDateString('en-ZA', { month: 'long' });
      const grad = ctx => {
        const { chart } = ctx, { ctx: c, chartArea } = chart;
        if (!chartArea) return alpha(t.primary, .15);
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, alpha(t.primary, t.dark ? .38 : .3)); g.addColorStop(1, alpha(t.primary, 0));
        return g;
      };
      return this.make(canvas, {
        type: 'line',
        data: {
          labels: Array.from({ length: n }, (_, i) => i + 1),
          datasets: [
            { label: name(m), data: series(m), borderColor: t.primary, backgroundColor: grad, fill: 'origin', tension: .4, cubicInterpolationMode: 'monotone', borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: t.primary, pointHoverBorderColor: t.surface, pointHoverBorderWidth: 3 },
            { label: name(p), data: series(p), borderColor: alpha(t.muted, .55), borderDash: [5, 5], borderWidth: 2, tension: .4, cubicInterpolationMode: 'monotone', pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: t.muted, pointHoverBorderColor: t.surface, pointHoverBorderWidth: 2, fill: false },
          ],
        },
        options: {
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 1300, easing: 'easeOutQuart' },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 11, autoSkip: true, maxRotation: 0 } },
            y: { beginAtZero: true, border: { display: false }, grid: { color: t.grid }, ticks: { callback: v => v + 'h', maxTicksLimit: 6 } },
          },
          plugins: {
            tooltip: {
              filter: i => i.raw != null,
              callbacks: {
                title: i => `Day ${i[0].dataIndex + 1}`,
                label: c => ` ${c.dataset.label}: ${fmtMin(c.raw * 60)}`,
              },
            },
          },
        },
      });
    },

    /* ---------- Subject performance (grouped bars) ---------- */
    performance(canvas) {
      if (!this.ok()) return this.make(canvas, {});
      const t = this.setup(), subs = S.data.subjects, hrs = S.bySubject(D.som(D.today()), null);
      return this.make(canvas, {
        type: 'bar',
        data: {
          labels: subs.map(s => s.name.length > 11 ? s.name.split(' ') : s.name),
          datasets: [
            { label: 'Current mark', data: subs.map(s => +s.grade || 0), backgroundColor: subs.map(s => s.color), hoverBackgroundColor: subs.map(s => alpha(s.color, .85)), borderRadius: 8, borderSkipped: false, maxBarThickness: 32, categoryPercentage: .7, barPercentage: .9 },
            { label: 'Target', data: subs.map(s => +s.target || 0), backgroundColor: subs.map(s => alpha(s.color, t.dark ? .22 : .16)), borderColor: subs.map(s => alpha(s.color, .65)), borderWidth: 1.5, borderRadius: 8, borderSkipped: false, maxBarThickness: 32, categoryPercentage: .7, barPercentage: .9 },
          ],
        },
        options: {
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: '600', size: 11.5 }, maxRotation: 0, autoSkip: false } },
            y: { min: 0, max: 100, border: { display: false }, grid: { color: t.grid }, ticks: { callback: v => v + '%', stepSize: 20 } },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: i => subs[i[0].dataIndex].name,
                label: c => ` ${c.dataset.label}: ${c.raw}%`,
                labelColor: c => ({ backgroundColor: subs[c.dataIndex].color, borderColor: subs[c.dataIndex].color }),
                footer: i => { const s = subs[i[0].dataIndex], gap = (+s.target || 0) - (+s.grade || 0); return [gap > 0 ? `${gap}% below target` : 'Target reached', `Studied this month: ${fmtMin(hrs[s.id] || 0)}`]; },
              },
            },
          },
        },
      });
    },

    /* ---------- Study time distribution (doughnut) ---------- */
    distribution(canvas, range) {
      const t0 = D.today();
      const a = range === 'week' ? D.sow(t0) : range === 'month' ? D.som(t0) : null;
      const m = S.bySubject(a, null);
      const items = S.subjectsWithGeneral().filter(s => m[s.id] > 0).map(s => ({ s, min: m[s.id] })).sort((x, y) => y.min - x.min);
      const total = items.reduce((x, i) => x + i.min, 0);
      if (!this.ok()) return { chart: this.make(canvas, {}), items, total };
      const t = this.setup();
      const center = {
        id: 'center',
        afterDraw(c) {
          const { ctx, chartArea: ca } = c; if (!ca) return;
          const x = (ca.left + ca.right) / 2, y = (ca.top + ca.bottom) / 2;
          const act = c.getActiveElements()[0];
          let big, small;
          const vis = items.reduce((s, it, i) => s + (c.getDataVisibility(i) ? it.min : 0), 0);
          if (act) { const it = items[act.index]; big = vis ? Math.round(it.min / vis * 100) + '%' : '0%'; small = it.s.name; }
          else { big = fmtH(vis, 1); small = 'total studied'; }
          ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = t.text; ctx.font = `800 26px ${FONT}`; ctx.fillText(big, x, y - 8);
          ctx.fillStyle = t.muted; ctx.font = `600 12px ${FONT}`;
          const label = small.length > 18 ? small.slice(0, 17) + '…' : small;
          ctx.fillText(label, x, y + 16); ctx.restore();
        },
      };
      const chart = this.make(canvas, {
        type: 'doughnut',
        data: { labels: items.map(i => i.s.name), datasets: [{ data: items.map(i => +(i.min / 60).toFixed(2)), backgroundColor: items.map(i => i.s.color), hoverBackgroundColor: items.map(i => i.s.color), borderColor: t.surface, borderWidth: 3, hoverBorderColor: t.surface, borderRadius: 6, hoverOffset: 12, spacing: 1 }] },
        options: {
          cutout: '70%', layout: { padding: 10 },
          animation: { animateRotate: true, animateScale: true, duration: 1200, easing: 'easeOutQuart' },
          plugins: { tooltip: { callbacks: { label: c => ` ${fmtMin(items[c.dataIndex].min)} · ${Math.round(items[c.dataIndex].min / total * 100)}%` } } },
        },
        plugins: [center],
      });
      return { chart, items, total };
    },

    /* ---------- Weekly progress vs goal ---------- */
    progress(canvas, n = 12) {
      if (!this.ok()) return this.make(canvas, {});
      const t = this.setup(), ws0 = D.sow(D.today()), goal = S.settings.weeklyGoalHrs;
      const weeks = [];
      for (let i = n - 1; i >= 0; i--) { const s = D.add(ws0, -7 * i); weeks.push({ s, min: S.minutesRange(s, D.add(s, 7)), current: i === 0 }); }
      const hrs = weeks.map(w => +(w.min / 60).toFixed(2));
      const avg = hrs.map((_, i) => { const sl = hrs.slice(Math.max(0, i - 3), i + 1); return +(sl.reduce((a, b) => a + b, 0) / sl.length).toFixed(2); });
      return this.make(canvas, {
        type: 'bar',
        data: {
          labels: weeks.map(w => D.fmt(w.s)),
          datasets: [
            { label: 'Hours studied', data: hrs, order: 2, backgroundColor: weeks.map((w, i) => w.current ? alpha(t.primary, .5) : hrs[i] >= goal ? t.primary : alpha(t.primary, .28)), hoverBackgroundColor: t.primary, borderRadius: 9, borderSkipped: false, maxBarThickness: 36 },
            { type: 'line', label: '4-week average', data: avg, order: 1, borderColor: '#f59e0b', backgroundColor: '#f59e0b', borderWidth: 2.5, tension: .4, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: t.surface, pointBorderWidth: 2, fill: false },
            { type: 'line', label: 'Weekly goal', data: Array(n).fill(goal), order: 0, borderColor: alpha(t.muted, .7), borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0, fill: false },
          ],
        },
        options: {
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
            y: { beginAtZero: true, suggestedMax: goal + 2, border: { display: false }, grid: { color: t.grid }, ticks: { callback: v => v + 'h', maxTicksLimit: 6 } },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: i => { const w = weeks[i[0].dataIndex]; return `Week of ${D.fmt(w.s, { day: 'numeric', month: 'long' })}${w.current ? ' (this week)' : ''}`; },
                label: c => c.datasetIndex === 0 ? ` Studied: ${fmtMin(weeks[c.dataIndex].min)}` : c.datasetIndex === 1 ? ` 4-week avg: ${c.raw.toFixed(1)}h` : ` Goal: ${goal}h`,
                footer: i => { const h = hrs[i[0].dataIndex], pct = Math.round(h / goal * 100); return h >= goal ? `Goal met · ${pct}%` : `${pct}% of goal · ${(goal - h).toFixed(1)}h short`; },
              },
            },
          },
        },
      });
    },
  };

  window.Charts = Charts;
})();
