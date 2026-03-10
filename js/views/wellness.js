// ═══════════════════════════════════════════════════════
//  Vue : Bien-être (Humeur | Habitudes | Cycle)
// ═══════════════════════════════════════════════════════
let _wellTab = 'mood'; // onglet actif

function viewWellness() {
  return `
<div class="ph"><span class="ph-title">Bien-être</span></div>
<div class="well-tabs">
  <button class="well-tab${_wellTab==='mood'   ?' active':''}" onclick="switchWellTab('mood')">🌈 Humeur</button>
  <button class="well-tab${_wellTab==='habits' ?' active':''}" onclick="switchWellTab('habits')">🌿 Habitudes</button>
  <button class="well-tab${_wellTab==='cycle'  ?' active':''}" onclick="switchWellTab('cycle')">🌹 Cycle</button>
</div>
<div id="well-content" class="pg">
  ${_wellTab === 'mood'   ? wellMood()   : ''}
  ${_wellTab === 'habits' ? wellHabits() : ''}
  ${_wellTab === 'cycle'  ? wellCycle()  : ''}
</div>`;
}

function switchWellTab(tab) {
  _wellTab = tab;
  // Re-render seulement le contenu (pas toute la page)
  const el = document.getElementById('well-content');
  if (!el) { go('wellness'); return; }
  el.innerHTML = tab === 'mood'   ? wellMood()
               : tab === 'habits' ? wellHabits()
               :                    wellCycle();
  document.querySelectorAll('.well-tab').forEach(b =>
    b.classList.toggle('active', b.textContent.includes(
      tab === 'mood' ? 'Humeur' : tab === 'habits' ? 'Habitudes' : 'Cycle'
    ))
  );
}

// ── ONGLET 1 : Humeur (Year in Pixels) ───────────────
function wellMood() {
  const moods = LS.moods();
  const td    = today();
  let html    = '';

  for (let m = 0; m < 12; m++) {
    const first  = new Date(_moodY, m, 1);
    let dow      = first.getDay();
    dow          = dow === 0 ? 6 : dow - 1;
    const days   = new Date(_moodY, m + 1, 0).getDate();
    let cells    = '';
    for (let i = 0; i < dow; i++) cells += '<div class="md empty"></div>';
    for (let d = 1; d <= days; d++) {
      const ds   = `${_moodY}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const mood = moods[ds];
      const isFut= ds > td;
      let cls = 'md', sty = '', em = '';
      if (isFut)        { cls += ' future'; }
      else if (mood && MOODS[mood.mood]) {
        const mo = MOODS[mood.mood];
        sty = `background:${mo.bg};border-color:${mo.bc}`; em = mo.e;
      } else { cls += ' none'; }
      cells += `<div class="${cls}" style="${sty}"${!isFut?` onclick="openMoodModal('${ds}')"`:''}>${em}</div>`;
    }
    html += `<div>
<div class="mood-mn">${MONTHS[m]}</div>
<div class="mood-days">
  ${DOW1.map(d => `<div class="mood-dow">${d}</div>`).join('')}
  ${cells}
</div></div>`;
  }

  const yr = Object.keys(moods).filter(k => k.startsWith(String(_moodY))).length;
  return `
<div class="mood-year-nav">
  <button class="cal-arr" onclick="_moodY--;switchWellTab('mood')">‹</button>
  <span class="mood-year-lbl">${_moodY} · ${yr} jours notés</span>
  <button class="cal-arr" onclick="_moodY++;switchWellTab('mood')">›</button>
</div>
<div class="mood-legend">
  ${MOODS.filter(Boolean).map(mo =>
    `<div class="leg-item">
      <div class="leg-dot" style="background:${mo.bg};border:1.5px solid ${mo.bc}"></div>
      ${mo.e} ${mo.l}
    </div>`).join('')}
  <div class="leg-item">
    <div class="leg-dot" style="background:var(--pl);border:1.5px solid var(--pm)"></div>
    Non noté
  </div>
</div>
<div class="mood-months">${html}</div>`;
}

// ── ONGLET 2 : Habitudes ──────────────────────────────
function wellHabits() {
  const habits = LS.habits();
  const active = habits.filter(h => h.active);
  const logs   = LS.habitLogs()[today()] || [];
  const done   = active.filter(h => logs.includes(h.id)).length;
  const pct    = active.length ? Math.round(done / active.length * 100) : 0;

  return `
<div style="padding:.5rem 0">
  <div class="habit-prog" style="margin-bottom:1rem">
    <span style="font-size:1rem">🌿</span>
    <div class="habit-prog-bar"><div class="habit-prog-fill" style="width:${pct}%"></div></div>
    <span class="habit-prog-txt">${done}/${active.length} · ${pct}%</span>
  </div>

  ${active.length === 0
    ? `<div class="empty"><div class="empty-i">🌿</div><p>Aucune habitude active</p></div>`
    : `<div class="card">
        ${active.map(h => {
          const done = logs.includes(h.id);
          const streak = habitStreak(h.id);
          return `
          <div class="habit-row">
            <div class="habit-check${done?' done':''}" onclick="toggleHabit('${h.id}')"
              style="${done?'background:'+h.color+';border-color:'+h.color:''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="habit-info">
              <div class="habit-name">${h.emoji} ${esc(h.name)}</div>
              ${streak > 0
                ? `<div class="habit-streak">🔥 ${streak} jour${streak>1?'s':''} de suite</div>`
                : '<div class="habit-streak">Premier jour !</div>'}
            </div>
          </div>`;
        }).join('')}
      </div>`
  }

  <button class="btn btn-ghost btn-sm btn-full mt" onclick="openHabitsManager()">
    ⚙️ Gérer mes habitudes
  </button>
</div>`;
}

function toggleHabit(id) {
  const logs = LS.habitLogs();
  const td   = today();
  const dayL = logs[td] || [];
  const idx  = dayL.indexOf(id);
  if (idx >= 0) dayL.splice(idx, 1); else dayL.push(id);
  logs[td] = dayL;
  LS.s('pl_hlogs', logs);
  // Mise à jour du contenu sans full re-render
  switchWellTab('habits');
}

// ── ONGLET 3 : Cycle menstruel ────────────────────────
function wellCycle() {
  const ci    = getCycleInfo();
  const cfg   = LS.cycleCfg();
  const log   = LS.cycleLog();
  const periodSet = new Set(log.filter(e => e.type === 'period').map(e => e.date));
  const td    = today();

  // Calendrier du mois courant pour le cycle
  const first  = new Date(_cy, _cm, 1);
  let dow      = first.getDay(); dow = dow === 0 ? 6 : dow - 1;
  const days   = new Date(_cy, _cm + 1, 0).getDate();

  // Jours prédits suivants
  const predDays = new Set();
  if (ci) {
    for (let i = 0; i < cfg.perLen; i++) predDays.add(addDays(ci.nextPeriod, i));
    // Ovulation
    const ovDay = addDays(ci.lastStart, Math.round(ci.avgLen / 2));
    predDays._ovulation = ovDay;
  }

  let cells = '';
  for (let i = 0; i < dow; i++) cells += '<div class="cpday empty"></div>';
  for (let d = 1; d <= days; d++) {
    const ds     = `${_cy}-${String(_cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isPer  = periodSet.has(ds);
    const isPred = predDays.has(ds) && !isPer;
    const isOv   = ci && ci.avgLen && addDays(ci.lastStart, Math.round(ci.avgLen/2)) === ds;
    const isT    = ds === td;
    let cls = 'cpday';
    if (isPer)       cls += ' period';
    else if (isOv)   cls += ' ovulation';
    else if (isPred) cls += ' predicted';
    else             cls += ' normal';
    if (isT) cls += ' today-marker';
    cells += `<div class="${cls}" onclick="toggleCycleDay('${ds}')" title="${ds}">${d}</div>`;
  }

  const disclaimer = `<div style="font-size:.72rem;color:var(--ts);margin:.75rem 0;line-height:1.5;padding:.65rem;background:var(--pl);border-radius:var(--rs)">
    ℹ️ Les prédictions sont indicatives et ne constituent pas un avis médical.</div>`;

  return `
<!-- Stats cycle -->
${ci ? `
<div class="cycle-stats-row">
  <div class="cycle-stat">
    <div class="cycle-stat-n">${ci.dayOfCycle}</div>
    <div class="cycle-stat-l">Jour du cycle</div>
  </div>
  <div class="cycle-stat">
    <div class="cycle-stat-n">${ci.daysUntil > 0 ? ci.daysUntil : '–'}</div>
    <div class="cycle-stat-l">${ci.daysUntil > 0 ? 'Jours avant règles' : 'Règles en cours'}</div>
  </div>
  <div class="cycle-stat">
    <div class="cycle-stat-n">${ci.avgLen}</div>
    <div class="cycle-stat-l">Longueur cycle</div>
  </div>
  <div class="cycle-stat">
    <div class="cycle-stat-n">${cfg.perLen}</div>
    <div class="cycle-stat-l">Durée règles</div>
  </div>
</div>
<!-- Phase actuelle -->
<div class="card" style="background:${CYCLE_PHASES[ci.phase].color}25;border-color:${CYCLE_PHASES[ci.phase].border}40;margin-bottom:.75rem">
  <div style="display:flex;align-items:center;gap:.75rem">
    <span style="font-size:1.6rem">${CYCLE_PHASES[ci.phase].emoji}</span>
    <div>
      <div style="font-weight:700;font-size:.95rem">${CYCLE_PHASES[ci.phase].name}</div>
      <div style="font-size:.82rem;color:var(--tm)">${CYCLE_PHASES[ci.phase].desc}</div>
    </div>
  </div>
</div>` : `<div class="empty" style="padding:2rem 0">
  <div class="empty-i">🌹</div>
  <p>Commence à enregistrer tes règles<br>pour voir les prédictions</p>
</div>`}

<!-- Légende -->
<div class="cycle-legend">
  <div class="cycle-leg-item"><div class="cycle-leg-dot" style="background:#FFB3C1;border:1px solid #E53E5A"></div>Règles</div>
  <div class="cycle-leg-item"><div class="cycle-leg-dot" style="background:var(--pl);border:1px solid var(--p)"></div>Règles prévues</div>
  <div class="cycle-leg-item"><div class="cycle-leg-dot" style="background:var(--gl);border:1px solid var(--gold)"></div>Ovulation</div>
</div>

<!-- Navigation mois -->
<div class="cal-nav">
  <button class="cal-arr" onclick="calPrev();switchWellTab('cycle')">‹</button>
  <span class="cal-month">${MONTHS[_cm]} ${_cy}</span>
  <button class="cal-arr" onclick="calNext();switchWellTab('cycle')">›</button>
</div>

<!-- Grille cycle -->
<div class="cycle-period-cal">
  ${DOW1.map(d => `<div class="mood-dow">${d}</div>`).join('')}
  ${cells}
</div>
<div style="font-size:.78rem;color:var(--ts);margin:.4rem 0">Touche un jour pour l'ajouter / retirer des règles</div>

<!-- Log aujourd'hui -->
<button class="btn btn-full mt" onclick="openCycleLogModal()" style="background:linear-gradient(135deg,#FFB3C1,#E53E5A)">
  🌹 Enregistrer aujourd'hui
</button>

<!-- Config cycle -->
<button class="btn btn-ghost btn-sm btn-full mt" onclick="openCycleConfigModal()">
  ⚙️ Paramètres du cycle
</button>

${disclaimer}`;
}
