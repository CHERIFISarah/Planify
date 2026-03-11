// ═══════════════════════════════════════════════════════
//  Vue : Agenda — Jour / Semaine / Mois
// ═══════════════════════════════════════════════════════
function viewCalendar() {
  const allEv    = [...LS.events(), ...LS.ics()];
  const cycleLog = new Set(LS.cycleLog().filter(e => e.type === 'period').map(e => e.date));
  const cyInfo   = getCycleInfo();
  const td       = today();

  const tabs = `
<div class="cal-tabs">
  <button class="cal-tab${_calView==='day'  ?' cal-tab-on':''}" onclick="setCalView('day')">Jour</button>
  <button class="cal-tab${_calView==='week' ?' cal-tab-on':''}" onclick="setCalView('week')">Semaine</button>
  <button class="cal-tab${_calView==='month'?' cal-tab-on':''}" onclick="setCalView('month')">Mois</button>
</div>`;

  let body = '';
  if (_calView === 'day')   body = _renderCalDay(allEv, cycleLog, cyInfo, td);
  if (_calView === 'week')  body = _renderCalWeek(allEv, cycleLog, cyInfo, td);
  if (_calView === 'month') body = _renderCalMonth(allEv, cycleLog, cyInfo, td);

  return `
<div class="ph">
  <span class="ph-title">Agenda</span>
  <button class="ph-action" onclick="openEventModal('${td}')" aria-label="Nouvel événement">+</button>
</div>
<div class="pg">
  ${tabs}
  ${body}
</div>`;
}

// ═══════════════════════════════════════════════════════
//  Vue Jour — Timeline horaire
// ═══════════════════════════════════════════════════════
function _renderCalDay(allEv, cycleLog, cyInfo, td) {
  const day     = _selDay || td;
  const isToday = day === td;
  const isPer   = cycleLog.has(day);
  const dayEv   = allEv.filter(e => e.date === day)
                       .sort((a,b) => (a.startTime||'zzz').localeCompare(b.startTime||'zzz'));
  const prev    = addDays(day, -1);
  const next    = addDays(day, +1);
  const label   = fdate(day, {weekday:'long', day:'numeric', month:'long'});

  const allDayEv = dayEv.filter(e => !e.startTime);
  const timedEv  = dayEv.filter(e => e.startTime);

  const nowH = isToday ? new Date().getHours() : -1;
  const nowM = isToday ? new Date().getMinutes() : 0;

  let timeline = '';
  for (let h = 7; h <= 22; h++) {
    const hStr   = `${String(h).padStart(2,'0')}:00`;
    const isNowH = h === nowH;
    const hEv    = timedEv.filter(e => {
      const eH = parseInt((e.startTime || '00').split(':')[0]);
      return eH === h;
    });

    timeline += `
<div class="tl-row${isNowH?' tl-now-row':''}">
  <div class="tl-time">${hStr}</div>
  <div class="tl-track">
    ${isNowH ? `<div class="tl-now-line" style="top:${nowM/60*56}px"></div>` : ''}
    ${hEv.map(e => `
    <div class="tl-event" style="--ec:${e.color||'var(--p)'}">
      <div class="tl-ev-strip"></div>
      <div class="tl-ev-body">
        <div class="tl-ev-name">${esc(e.title||e.summary||'')}</div>
        <div class="tl-ev-meta">
          🕐 ${e.startTime}${e.endTime?' – '+e.endTime:''}
          ${e.location?' · 📍 '+esc(e.location):''}
          ${e.ics?'<span class="ev-ujm-badge">UJM</span>':''}
        </div>
      </div>
      ${!e.ics?`<button class="tl-ev-del" onclick="delEvent('${e.id}')">🗑️</button>`:''}
    </div>`).join('')}
  </div>
</div>`;
  }

  return `
<!-- Navigation jour -->
<div class="cal-day-nav">
  <button class="cal-arr" onclick="navDay('${prev}')">‹</button>
  <div class="cdn-center">
    <div class="cdn-date">${cap(label)}${isPer?' 🌹':''}</div>
    ${isToday?'<span class="cdn-badge">Aujourd\'hui</span>':''}
  </div>
  <button class="cal-arr" onclick="navDay('${next}')">›</button>
</div>

${allDayEv.length>0?`
<div class="tl-allday-zone">
  <div class="tl-allday-label">📌 Toute la journée</div>
  ${allDayEv.map(e=>`
  <div class="ev-card" style="--ec:${e.color||'var(--p)'}">
    <div class="ev-card-strip"></div>
    <div class="ev-card-body">
      <div class="ev-card-title">${esc(e.title||e.summary||'')}</div>
      ${e.location?`<div class="ev-card-meta"><span>📍 ${esc(e.location)}</span></div>`:''}
    </div>
    ${!e.ics?`<button class="ev-del-btn" onclick="delEvent('${e.id}')">🗑️</button>`:''}
  </div>`).join('')}
</div>`:''}

${dayEv.length===0?`
<div class="day-empty" style="margin:1rem 0">
  <div class="day-empty-ico">🗓️</div>
  <div class="day-empty-txt">Aucun événement${isToday?" aujourd'hui":''}</div>
  <button class="btn btn-sm" onclick="openEventModal('${day}')">+ Ajouter un événement</button>
</div>`:''}

<div class="tl-container">${timeline}</div>

<div class="tl-footer">
  <button class="tl-cycle-btn${isPer?' tl-per-on':''}" onclick="toggleCycleDay('${day}')">
    🌹 ${isPer?'Retirer des règles':'Marquer comme règles'}
  </button>
  <button class="btn btn-sm" onclick="openEventModal('${day}')">+ Événement</button>
</div>`;
}

// ═══════════════════════════════════════════════════════
//  Vue Semaine — 7 colonnes
// ═══════════════════════════════════════════════════════
function _renderCalWeek(allEv, cycleLog, cyInfo, td) {
  const base  = new Date((_selDay||td) + 'T12:00:00');
  const dow   = base.getDay();
  base.setDate(base.getDate() + (dow===0?-6:1-dow));
  const weekMon  = base.toISOString().slice(0,10);
  const weekDays = Array.from({length:7}, (_,i) => addDays(weekMon, i));
  const prevMon  = addDays(weekMon, -7);
  const nextMon  = addDays(weekMon, +7);

  const fromLbl  = fdate(weekMon,     {day:'numeric', month:'short'});
  const toLbl    = fdate(weekDays[6], {day:'numeric', month:'long'});

  const weekEvTotal = weekDays.reduce((s,ds) => s + allEv.filter(e=>e.date===ds).length, 0);

  const cols = weekDays.map((ds, i) => {
    const dn    = new Date(ds+'T12:00:00').getDate();
    const isT   = ds === td;
    const isS   = ds === _selDay;
    const isPer = cycleLog.has(ds);
    const dev   = allEv.filter(e=>e.date===ds)
                       .sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||''));
    return `
<div class="wv-col${isT?' wv-today':''}${isS?' wv-sel':''}"
     onclick="_selDay='${ds}';setCalView('day')">
  <div class="wv-hd">
    <span class="wv-dow">${DOW1[i]}</span>
    <span class="wv-dn">${dn}</span>
    ${isPer?'<span class="wv-per-dot"></span>':''}
  </div>
  <div class="wv-body">
    ${dev.slice(0,3).map(e=>`
    <div class="wv-ev" style="--ec:${e.color||'var(--p)'}">
      <span class="wv-ev-dot"></span>
      <div class="wv-ev-info">
        <div class="wv-ev-n">${esc((e.title||e.summary||'').slice(0,11))}</div>
        ${e.startTime?`<div class="wv-ev-t">${e.startTime}</div>`:''}
      </div>
    </div>`).join('')}
    ${dev.length>3?`<div class="wv-more">+${dev.length-3}</div>`:''}
    ${dev.length===0?'<div class="wv-no-ev"></div>':''}
  </div>
</div>`;
  }).join('');

  return `
<!-- Navigation semaine -->
<div class="cal-week-nav">
  <button class="cal-arr" onclick="navWeek('${prevMon}')">‹</button>
  <div class="cwn-center">
    <div class="cwn-label">${fromLbl} – ${toLbl}</div>
    ${weekEvTotal>0?`<div class="cwn-count">${weekEvTotal} événement${weekEvTotal>1?'s':''}</div>`:''}
  </div>
  <button class="cal-arr" onclick="navWeek('${nextMon}')">›</button>
</div>

<div class="week-view-grid">${cols}</div>

<div class="wv-hint">👆 Touche un jour pour voir le détail</div>

<div class="wv-fab-row">
  <button class="btn btn-sm btn-ghost btn-full" onclick="openEventModal('${td}')">+ Ajouter un événement</button>
</div>`;
}

// ═══════════════════════════════════════════════════════
//  Vue Mois — Grille calendrier
// ═══════════════════════════════════════════════════════
function _renderCalMonth(allEv, cycleLog, cyInfo, td) {
  // Predicted period days
  const predictedPeriodDays = new Set();
  if (cyInfo) {
    for (let i = 0; i < (LS.cycleCfg().perLen||5); i++) {
      predictedPeriodDays.add(addDays(cyInfo.nextPeriod, i));
    }
  }

  // Bande semaine
  const weekStart = (() => {
    const d   = new Date(td+'T12:00:00');
    const dow = d.getDay();
    d.setDate(d.getDate()+(dow===0?-6:1-dow));
    return d.toISOString().slice(0,10);
  })();

  const weekStrip = Array.from({length:7}, (_,i) => {
    const ds    = addDays(weekStart, i);
    const dn    = new Date(ds+'T12:00:00').getDate();
    const isT   = ds === td;
    const isS   = ds === _selDay;
    const dev   = allEv.filter(e=>e.date===ds);
    const isPer = cycleLog.has(ds);
    return `
<div class="ws-day${isT?' ws-today':''}${isS?' ws-sel':''}" onclick="selDay('${ds}')">
  <span class="ws-dow">${DOW1[i]}</span>
  <span class="ws-num">${dn}</span>
  ${isPer
    ? '<span class="ws-ind ws-ind-per"></span>'
    : dev.length>0
      ? `<span class="ws-ind" style="background:${dev[0].color||'var(--p)'}"></span>`
      : '<span class="ws-ind ws-ind-empty"></span>'}
</div>`;
  }).join('');

  // Grille mensuelle
  const first    = new Date(_cy, _cm, 1);
  let startDow   = first.getDay();
  startDow       = startDow===0?6:startDow-1;
  const daysInM  = new Date(_cy, _cm+1, 0).getDate();

  let cells = '';
  for (let i=0; i<startDow; i++) cells += '<div class="cal-cell other"></div>';
  for (let d=1; d<=daysInM; d++) {
    const ds    = `${_cy}-${String(_cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dev   = allEv.filter(e=>e.date===ds);
    const isT   = ds===td, isS=ds===_selDay;
    const isPer = cycleLog.has(ds);
    const isPred = predictedPeriodDays.has(ds)&&ds>td;
    const chip  = dev.length>0 ? (() => {
      const e = dev[0];
      return `<div class="cal-chip" style="--cc:${e.color||'var(--p)'}"><span class="cal-chip-dot"></span>${esc((e.title||e.summary||'').slice(0,8))}</div>`;
    })() : '';
    const more  = dev.length>1?`<div class="cal-more">+${dev.length-1}</div>`:'';
    cells += `
<div class="cal-cell${isT?' today':''}${isS?' sel':''}${isPer?' period-day':''}" onclick="selDay('${ds}')">
  <div class="cal-dn">${d}</div>
  ${isPer?'<div class="cal-pdot cal-pdot-real"></div>':''}
  ${isPred&&!isPer?'<div class="cal-pdot cal-pdot-pred"></div>':''}
  <div class="cal-cell-ev">${chip}${more}</div>
</div>`;
  }

  // Panel jour
  const panelDay   = _selDay||td;
  const panelEv    = allEv.filter(e=>e.date===panelDay)
                          .sort((a,b)=>(a.startTime||'zzz').localeCompare(b.startTime||'zzz'));
  const isPanelPer = cycleLog.has(panelDay);
  const panelDl    = fdate(panelDay, {weekday:'long', day:'numeric', month:'long'});
  const isToday    = panelDay===td;
  const todayEvCnt = allEv.filter(e=>e.date===td).length;

  const evCards = panelEv.length===0
    ? `<div class="day-empty">
        <div class="day-empty-ico">🗓️</div>
        <div class="day-empty-txt">Aucun événement${isToday?" aujourd'hui":''}</div>
        <button class="btn btn-sm" onclick="openEventModal('${panelDay}')">+ Ajouter</button>
       </div>`
    : panelEv.map(e => {
        const t = e.startTime?`${e.startTime}${e.endTime?' – '+e.endTime:''}` : 'Toute la journée';
        return `
<div class="ev-card" style="--ec:${e.color||'var(--p)'}">
  <div class="ev-card-strip"></div>
  <div class="ev-card-body">
    <div class="ev-card-title">${esc(e.title||e.summary||'')}</div>
    <div class="ev-card-meta">
      <span>🕐 ${t}</span>
      ${e.location?`<span>📍 ${esc(e.location)}</span>`:''}
      ${e.ics?'<span class="ev-ujm-badge">UJM</span>':''}
    </div>
  </div>
  ${!e.ics?`<button class="ev-del-btn" onclick="delEvent('${e.id}')">🗑️</button>`:''}
</div>`;
      }).join('');

  const icsCount = LS.ics().length;

  return `
${isToday&&todayEvCnt>0?`
<div class="today-banner">
  <div class="tb-left">
    <div class="tb-label">Aujourd'hui</div>
    <div class="tb-count">${todayEvCnt} événement${todayEvCnt>1?'s':''}</div>
  </div>
  <div class="tb-dots">
    ${allEv.filter(e=>e.date===td).slice(0,4).map(e=>`<span class="tb-dot" style="background:${e.color||'var(--p)'}"></span>`).join('')}
  </div>
</div>`:''}

<div class="week-strip">${weekStrip}</div>

<div class="cal-nav">
  <button class="cal-arr" onclick="calPrev()">‹</button>
  <div class="cal-month-wrap">
    <span class="cal-month">${MONTHS[_cm]}</span>
    <span class="cal-year"> ${_cy}</span>
  </div>
  <button class="cal-arr" onclick="calNext()">›</button>
</div>

${cyInfo?`
<div class="cal-legend">
  <span class="cl-item"><span class="cl-dot" style="background:#E53E5A"></span>Règles</span>
  <span class="cl-item"><span class="cl-dot" style="background:#FAB8C4;border:1px solid #E53E5A"></span>Prévues</span>
  <span class="cl-item"><span class="cl-dot" style="background:var(--p)"></span>Événements</span>
</div>`:''}

<div class="cal-grid">
  ${DOW.map(d=>`<div class="cal-dow">${d}</div>`).join('')}
  ${cells}
</div>

<div class="day-panel-v2">
  <div class="dp-header">
    <div class="dp-left">
      <div class="dp-date">${cap(panelDl)}</div>
      <div class="dp-sub-row">
        ${isToday?'<span class="dp-badge-today">Aujourd\'hui</span>':''}
        ${isPanelPer?'<span class="dp-badge-period">🌹 Règles</span>':''}
      </div>
    </div>
    <div class="dp-actions">
      <button class="dp-cycle-btn${isPanelPer?' dp-cycle-on':''}"
        onclick="toggleCycleDay('${panelDay}')" title="Marquer règles">🌹</button>
      <button class="btn btn-sm" onclick="openEventModal('${panelDay}')">+ Ajouter</button>
    </div>
  </div>
  <div class="ev-cards-list">${evCards}</div>
</div>

<div class="st">Emploi du temps UJM</div>
<div class="ics-zone" onclick="document.getElementById('ics-cal-f').click()">
  <div class="ics-zone-title">📥 Importer un fichier .ics</div>
  <div class="ics-zone-sub">Télécharge ton EDT sur ADE-UJM puis importe-le ici</div>
</div>
<input type="file" id="ics-cal-f" accept=".ics,text/calendar" style="display:none" onchange="importFile(this)">
${icsCount?`
<div class="ics-imported-row">
  <span class="txt-soft">✅ ${icsCount} cours importés</span>
  <button class="btn btn-danger btn-sm" onclick="clearICS()">Supprimer</button>
</div>`:''}`;
}

// ── Actions calendrier ────────────────────────────────
function calPrev() { _cm--; if (_cm<0){_cm=11;_cy--;} _selDay=null; go('calendar'); }
function calNext() { _cm++; if (_cm>11){_cm=0;_cy++;} _selDay=null; go('calendar'); }
function selDay(d) { _selDay = _selDay===d?null:d; go('calendar'); }
function delEvent(id) { LS.s('pl_events', LS.events().filter(e=>e.id!==id)); go('calendar'); }
function clearICS() {
  if (!confirm('Supprimer tous les cours importés ?')) return;
  LS.s('pl_ics', []); go('calendar');
}

// ── Toggle règles depuis agenda ───────────────────────
function toggleCycleDay(d) {
  const log = LS.cycleLog();
  const idx = log.findIndex(e=>e.date===d&&e.type==='period');
  if (idx>=0) log.splice(idx,1);
  else log.push({date:d, type:'period', flow:'medium', symptoms:[], note:''});
  LS.s('pl_cycle', log);
  go('calendar');
}
