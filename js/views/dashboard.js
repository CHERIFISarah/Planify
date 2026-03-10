// ═══════════════════════════════════════════════════════
//  Vue : Accueil (Dashboard) — Premium Edition v2
// ═══════════════════════════════════════════════════════
function viewDashboard() {
  const notes     = LS.notes();
  const subs      = LS.subjects();
  const allEv     = [...LS.events(), ...LS.ics()];
  const td        = today();
  const todayEv   = allEv.filter(e => e.date === td)
                         .sort((a,b) => (a.startTime||'').localeCompare(b.startTime||''));
  const upcoming  = allEv.filter(e => e.date > td)
                         .sort((a,b) => a.date.localeCompare(b.date)).slice(0,4);
  const recent    = [...notes].sort((a,b) => b.updatedAt - a.updatedAt).slice(0,3);
  const moods     = LS.moods();
  const todayMood = moods[td];
  const pending   = pendingTodosCount();

  const now       = new Date();
  const hour      = now.getHours();
  const greeting  = hour < 5  ? 'Bonne nuit'
                  : hour < 12 ? 'Bonjour'
                  : hour < 18 ? 'Bon après-midi'
                  : 'Bonsoir';
  const timeEmoji = hour < 5  ? '🌙' : hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';
  const timeLbl   = hour < 5  ? 'Nuit' : hour < 12 ? 'Matin' : hour < 18 ? 'Après-midi' : 'Soirée';

  const cfg  = LS.cfg();
  const name = cfg.name ? ` ${cfg.name.split(' ')[0]}` : '';
  const dayLabel = cap(now.toLocaleDateString('fr-FR', {weekday:'long'}));
  const dateFull = now.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});

  // ── Cycle ─────────────────────────────────────────────
  const cycleInfo = getCycleInfo();
  let cycleBanner = '';
  if (cycleInfo) {
    const ph     = CYCLE_PHASES[cycleInfo.phase];
    const dBadge = cycleInfo.daysUntil > 0 ? `dans ${cycleInfo.daysUntil}j`
                 : cycleInfo.daysUntil === 0 ? 'Auj.' : `J${cycleInfo.dayOfCycle}`;
    const dFull  = cycleInfo.daysUntil > 0
      ? `Règles dans ${cycleInfo.daysUntil} jour${cycleInfo.daysUntil>1?'s':''}`
      : cycleInfo.daysUntil === 0 ? 'Règles prévues aujourd\'hui'
      : `Règles en cours (J${cycleInfo.dayOfCycle})`;
    cycleBanner = `
    <div class="cycle-banner-v2" onclick="go('wellness',{tab:'cycle'})">
      <div class="cb-phase-ico">${ph.emoji}</div>
      <div class="cb-info">
        <div class="cb-phase-name">${ph.name}</div>
        <div class="cb-phase-sub">${dFull}</div>
      </div>
      <div class="cb-badge">${dBadge}</div>
    </div>`;
  }

  // ── Habitudes ─────────────────────────────────────────
  const activeHabits = LS.habits().filter(h => h.active);
  const logs      = LS.habitLogs()[td] || [];
  const doneCount = activeHabits.filter(h => logs.includes(h.id)).length;
  const habitPct  = activeHabits.length ? Math.round(doneCount / activeHabits.length * 100) : 0;

  let habitSection = '';
  if (activeHabits.length) {
    const r = 22, circ = +(2*Math.PI*r).toFixed(2);
    const dash   = +(habitPct/100*circ).toFixed(2);
    const offset = +(circ*0.25).toFixed(2);
    const items  = activeHabits.slice(0,4).map(h => {
      const done = logs.includes(h.id);
      return `<div class="hm-item${done?' done':''}">
        <span class="hm-check${done?' ok':''}">  ${done?'✓':'○'}</span>
        <span class="hm-ico">${h.emoji||'🌿'}</span>
        <span class="hm-name">${esc(h.name)}</span>
      </div>`;
    }).join('');
    habitSection = `
    <div class="habits-mini" onclick="go('wellness',{tab:'habits'})">
      <svg class="hm-ring-svg" width="64" height="64" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="${r}" fill="none" stroke="var(--rose-m)" stroke-width="4.5"/>
        <circle cx="26" cy="26" r="${r}" fill="none"
          stroke="url(#hrg-${td})" stroke-width="4.5"
          stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${offset}"
          stroke-linecap="round"/>
        <defs><linearGradient id="hrg-${td}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C4778E"/>
          <stop offset="100%" stop-color="#C9A96E"/>
        </linearGradient></defs>
        <text x="26" y="30" text-anchor="middle" font-size="10" font-weight="900"
          fill="var(--rose-d)" font-family="Inter,system-ui,sans-serif">${habitPct}%</text>
      </svg>
      <div class="hm-body">
        <div class="hm-title">🌿 Habitudes du jour</div>
        <div class="hm-sub">${doneCount} sur ${activeHabits.length} complétées</div>
        <div class="hm-items">${items}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ts)" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;margin-top:2px"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }

  // ── Historique humeurs 7 jours ─────────────────────────
  const moodHistory7 = Array.from({length:7}, (_,i) => {
    const ds  = addDays(td, i - 6);
    const md  = moods[ds];
    const mo  = md ? MOODS[md.mood] : null;
    const isT = ds === td;
    return `<div class="mhd-item${isT?' mhd-today':''}" onclick="openMoodModal('${ds}')">
  <div class="mhd-dot" style="${mo?`background:${mo.bc}`:''}">
    ${mo ? `<span class="mhd-em">${mo.e}</span>` : '<span class="mhd-empty">○</span>'}
  </div>
  <div class="mhd-dow">${DOW1[(new Date(ds+'T12:00:00').getDay()+6)%7]}</div>
</div>`;
  }).join('');

  // ── Objectifs de la semaine ────────────────────────────
  const goals     = weekGoals();
  const goalsDone = goals.filter(g => g.done).length;
  const goalsPct  = goals.length ? Math.round(goalsDone/goals.length*100) : 0;
  const goalsCard = `
  <div class="wg-card" onclick="openGoalsModal()">
    <div class="wg-header">
      <div class="wg-title-row">
        <span class="wg-ico">🎯</span>
        <span class="wg-title">Objectifs de la semaine</span>
      </div>
      <span id="goals-count" class="wg-count">${goalsDone}/${goals.length}</span>
    </div>
    <div class="wg-bar-wrap">
      <div class="wg-bar"><div id="goals-progress" class="wg-progress" style="width:${goalsPct}%"></div></div>
      <span class="wg-pct">${goalsPct}%</span>
    </div>
    <div id="goals-items" class="wg-items">
      ${goals.length===0
        ? `<div class="wg-empty">Touche pour définir tes objectifs ✨</div>`
        : goals.slice(0,4).map((g,i) => `
      <div class="wg-item${g.done?' wg-done':''}" onclick="event.stopPropagation();toggleGoalDirect(${i})">
        <div class="wg-check${g.done?' wg-checked':''}">
          ${g.done?'<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
        </div>
        <span class="wg-text">${esc(g.text)}</span>
      </div>`).join('')}
    </div>
  </div>`;

  // ── Journal de gratitude ───────────────────────────────
  const grats      = gratitudeToday();
  const gratCard   = `
  <div class="gratitude-card${grats.length?' grat-filled':''}" onclick="openGratitudeModal()">
    <div class="gc-header">
      <span class="gc-ico">🙏</span>
      <div class="gc-title-wrap">
        <div class="gc-title">Journal de gratitude</div>
        <div class="gc-sub">3 choses pour lesquelles je suis reconnaissante</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ts)" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </div>
    <div id="grat-preview" class="gc-preview">
      ${grats.length>0
        ? grats.map(t=>`<div class="grat-item"><span class="grat-dot">✨</span>${esc(t)}</div>`).join('')
        : `<div class="grat-empty">Touche pour noter tes gratitudes du jour…</div>`}
    </div>
  </div>`;

  // ── Mood section ─────────────────────────────────────
  const moodSection = !todayMood ? `
  <div class="dh-mood-wrap">
    <p class="dh-mood-label">Comment tu te sens aujourd'hui ?</p>
    <div class="dh-mood-row">
      ${MOODS.filter(Boolean).map((m,i) => `
        <button class="dh-mood-btn" onclick="quickLogMood(${i+1})" title="${m.l}">
          <span class="dh-mood-em">${m.e}</span>
          <span class="dh-mood-lbl">${m.l}</span>
        </button>`).join('')}
    </div>
  </div>` : `
  <div class="dh-mood-done" onclick="openMoodModal('${td}')">
    <span style="font-size:1.5rem">${MOODS[todayMood.mood]?.e||'🌸'}</span>
    <div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.05em;font-weight:800">Humeur</div>
      <div style="font-size:.9rem;font-weight:700;color:#fff">${MOODS[todayMood.mood]?.l||''}</div>
    </div>
    <span class="dh-mood-change">Modifier →</span>
  </div>`;

  // ── Capsule du jour ────────────────────────────────────
  const capsulee = todayCapsule();
  const capsuleCard = capsulee ? `
  <div class="capsule-card">
    <span class="capsule-ico">${capsulee.ico}</span>
    <div class="capsule-body">
      <div class="capsule-label">${capsulee.label}</div>
      <div class="capsule-text">${capsulee.text}</div>
      <div class="capsule-arabic">${capsulee.ar}</div>
    </div>
  </div>` : '';

  // ── Focus du jour ─────────────────────────────────────
  const focus = focusToday();
  const focusCard = `
  <div class="focus-card${focus?' focus-set':''}" onclick="openFocusEdit()">
    <div class="focus-ico">🎯</div>
    <div class="focus-body">
      <div class="focus-label">Objectif du jour</div>
      <div id="focus-text" class="focus-text${focus?' set':''}">${focus ? esc(focus) : 'Touche pour définir ton focus…'}</div>
    </div>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ts)" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  </div>`;

  // ── Pomodoro ──────────────────────────────────────────
  const rp = 36, circP = +(2*Math.PI*rp).toFixed(2);
  const totalP = _pomo.phase === 'work' ? 25*60 : 5*60;
  const dashP  = +(_pomo.secs / totalP * circP).toFixed(2);
  const offP   = +(circP*0.25).toFixed(2);
  const mmP    = Math.floor(_pomo.secs/60).toString().padStart(2,'0');
  const ssP    = (_pomo.secs%60).toString().padStart(2,'0');
  const pomoCard = `
  <div class="pomo-card${_pomo.running?' pomo-active':''}${_pomo.phase==='break'?' pomo-break':''}">
    <svg class="pomo-svg" width="86" height="86" viewBox="0 0 86 86">
      <circle cx="43" cy="43" r="${rp}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"/>
      <circle id="pomo-ring-fill" cx="43" cy="43" r="${rp}" fill="none"
        stroke="${_pomo.phase==='break'?'#7AA97C':'url(#pomo-grad)'}"
        stroke-width="5"
        stroke-dasharray="${dashP} ${circP}"
        stroke-dashoffset="${offP}"
        stroke-linecap="round"/>
      <defs>
        <linearGradient id="pomo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F9C8D9"/>
          <stop offset="100%" stop-color="#C4778E"/>
        </linearGradient>
      </defs>
      <text id="pomo-time" x="43" y="48" text-anchor="middle"
        font-size="15" font-weight="900" fill="white"
        font-family="Inter,system-ui,sans-serif">${mmP}:${ssP}</text>
    </svg>
    <div class="pomo-info">
      <div id="pomo-phase" class="pomo-phase">${_pomo.phase==='work'?'⏱️ Focus Time':'☕ Pause douce'}</div>
      <div id="pomo-sess" class="pomo-sess">🍅 ${_pomo.sessions} session${_pomo.sessions!==1?'s':''}</div>
    </div>
    <div class="pomo-actions">
      <button id="pomo-btn" class="pomo-play-btn" onclick="togglePomo()">
        ${_pomo.running
          ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
          : '<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>'}
      </button>
      <button class="pomo-reset-btn" onclick="resetPomo()" title="Réinitialiser">↺</button>
    </div>
  </div>`;

  // ── Hydratation ───────────────────────────────────────
  const water = waterToday();
  const hydroCard = `
  <div class="hydro-card">
    <div class="hydro-header">
      <span class="hydro-title">💧 Hydratation</span>
      <span id="hydro-count" class="hydro-count">${water}/8 verres</span>
    </div>
    <div class="hydro-drops">
      ${[1,2,3,4,5,6,7,8].map(i =>
        `<button class="hydro-drop${water>=i?' filled':''}"
          onclick="logWater(${i})"
          title="${i} verre${i>1?'s':''}">💧</button>`
      ).join('')}
    </div>
    <div id="hydro-done" style="display:${water>=8?'flex':'none'}"
      class="hydro-done">🎉 Objectif atteint aujourd'hui !</div>
  </div>`;

  // ── Countdown urgents ─────────────────────────────────
  const soon = allEv
    .filter(e => { const d = daysBetween(td, e.date); return d > 0 && d <= 14; })
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  let countdownSection = '';
  if (soon.length) {
    const pills = soon.map(e => {
      const days = daysBetween(td, e.date);
      const cls  = days <= 2 ? 'cd-urgent' : days <= 7 ? 'cd-soon' : '';
      return `<div class="cd-pill ${cls}" style="--ecc:${e.color||'var(--rose)'}">
        <span class="cd-name">${esc(e.title||e.summary||'')}</span>
        <span class="cd-days">dans ${days}j</span>
      </div>`;
    }).join('');
    countdownSection = `
    <div class="cd-section">
      <div class="sh" style="margin-bottom:.5rem">
        <div class="st" style="margin:0">⏳ Deadlines & événements</div>
      </div>
      <div class="cd-list">${pills}</div>
    </div>`;
  }

  // ── Render ─────────────────────────────────────────────
  return `
<div class="dash-hero">
  <div class="dh-blob dh-b1"></div>
  <div class="dh-blob dh-b2"></div>
  <div class="dh-blob dh-b3"></div>

  <div class="dh-inner">
    <div class="dh-top">
      <div class="dh-pill">${timeEmoji} ${timeLbl}</div>
      <button class="dh-settings-btn" onclick="go('settings')" aria-label="Réglages">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </div>

    <h1 class="dh-title">${greeting}${name} ✨</h1>
    <p class="dh-date">${dayLabel} · ${dateFull}</p>

    <div class="dh-aff">
      <span class="dh-aff-ico">🌸</span>
      <div class="quote-bilingue">
        <div class="quote-fr">${todayAffirmationFR()}</div>
        <div class="quote-ar">${todayAffirmationAR()}</div>
      </div>
    </div>

    ${moodSection}

    <!-- Historique humeurs 7j -->
    <div class="mood-history-7d">
      ${moodHistory7}
    </div>
  </div>
</div>

<div class="pg">

  <!-- Stats overlap -->
  <div class="stats-row">
    <div class="stat-card stat-rose" onclick="go('notes')">
      <span class="sc-icon">📝</span>
      <span class="sc-num">${notes.length}</span>
      <span class="sc-lbl">Notes</span>
    </div>
    <div class="stat-card stat-gold" onclick="go('calendar')">
      <span class="sc-icon">📅</span>
      <span class="sc-num">${todayEv.length}</span>
      <span class="sc-lbl">Auj.</span>
    </div>
    <div class="stat-card stat-sage" onclick="go('tasks')">
      <span class="sc-icon">✅</span>
      <span class="sc-num">${pending}</span>
      <span class="sc-lbl">Tâches</span>
    </div>
  </div>

  <!-- Capsule du jour -->
  ${capsuleCard}

  <!-- Objectif du jour -->
  ${focusCard}

  <!-- Objectifs de la semaine -->
  ${goalsCard}

  <!-- Journal de gratitude -->
  ${gratCard}

  <!-- Countdown urgents -->
  ${countdownSection}

  <!-- Pomodoro -->
  ${pomoCard}

  <!-- Hydratation -->
  ${hydroCard}

  <!-- Habitudes -->
  ${habitSection}

  <!-- Cycle -->
  ${cycleBanner}

  <!-- Événements aujourd'hui -->
  ${todayEv.length ? `
  <div class="st">Aujourd'hui</div>
  <div class="card">
    ${todayEv.map(e => `<div class="ev-row" style="--ec:${e.color||'var(--p)'}">
      <div class="ev-dot"></div>
      <div class="ev-info">
        <div class="ev-name">${esc(e.title||e.summary||'')}</div>
        <div class="ev-meta">${e.startTime||''}${e.endTime?' – '+e.endTime:''}${e.location?' · 📍 '+esc(e.location):''}</div>
      </div>
    </div>`).join('')}
  </div>` : ''}

  <!-- À venir -->
  ${upcoming.length ? `
  <div class="st">À venir</div>
  <div class="card">
    ${upcoming.map(e => {
      const dl = fdate(e.date, {weekday:'short', day:'numeric', month:'short'});
      return `<div class="ev-row" style="--ec:${e.color||'var(--p)'}">
        <div class="ev-dot"></div>
        <div class="ev-info">
          <div class="ev-name">${esc(e.title||e.summary||'')}</div>
          <div class="ev-meta">${dl}${e.startTime?' · '+e.startTime:''}</div>
        </div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- Notes récentes -->
  ${recent.length ? `
  <div class="sh">
    <div class="st" style="margin:0">Notes récentes</div>
    <button class="btn-link" onclick="go('notes')">Voir tout →</button>
  </div>
  <div class="card">
    ${recent.map(n => {
      const s = subs.find(x => x.id === n.subjectId);
      return `<div class="note-row" onclick="go('editor',{nid:'${n.id}',sid:'${n.subjectId}'})">
        ${s ? `<span class="chip" style="background:${s.color.bg};color:${s.color.dot}">${s.emoji} ${esc(s.name)}</span>` : ''}
        <div class="note-title">${esc(n.title)||'<em style="color:var(--ts)">Sans titre</em>'}</div>
        <div class="note-preview">${stripHtml(n.content||'').slice(0,80)}</div>
      </div>`;
    }).join('')}
  </div>` : `
  <div class="empty">
    <div class="empty-i">🌸</div>
    <p>Bienvenue dans Planify !<br>Commence par créer tes premières notes.</p>
    <button class="btn" onclick="go('notes')">Créer une note</button>
  </div>`}

</div>`;
}

// ── Quick mood log ─────────────────────────────────────
function quickLogMood(idx) {
  const td  = today();
  const all = LS.moods();
  all[td]   = { mood: idx, energy: 3, note: '', updatedAt: Date.now() };
  LS.s('pl_moods', all);
  showToast(`${MOODS[idx].e} Humeur enregistrée !`);
  go('dashboard');
}
