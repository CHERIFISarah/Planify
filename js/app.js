// ═══════════════════════════════════════════════════════
//  PLANIFY — app.js : Router · Modals · ICS · Boot
// ═══════════════════════════════════════════════════════

// ── État global ───────────────────────────────────────
let _page    = 'dashboard';
let _sid     = null;   // subject id courant
let _nid     = null;   // note id courante
let _lid     = null;   // list id courante
let _selDay  = null;   // jour sélectionné dans le calendrier
let _cm      = new Date().getMonth();
let _cy      = new Date().getFullYear();
let _moodY   = new Date().getFullYear();
let _calView = 'month'; // 'day' | 'week' | 'month'

// ── Router ────────────────────────────────────────────
function go(page, params = {}) {
  _page = page;
  if (params.sid !== undefined) _sid = params.sid;
  if (params.nid !== undefined) _nid = params.nid;
  if (params.lid !== undefined) _lid = params.lid;
  if (params.tab !== undefined) _wellTab = params.tab;

  // Ferme modal si ouvert
  closeModal();

  const view = document.getElementById('view');
  const nav  = document.getElementById('nav');
  const fab  = document.getElementById('fab');
  if (!view) return;

  // Nav visible uniquement pour les pages principales (cachée pendant onboarding)
  const mainPages = ['dashboard','notes','calendar','wellness','tasks'];
  const hideNav   = ['auth','onboarding','editor','settings','subject','list'];
  if (nav) nav.style.display = hideNav.includes(page) ? 'none' : '';
  if (fab) fab.style.display = hideNav.includes(page) ? 'none' : '';

  // Éditeur overlay → géré séparément
  if (page === 'editor') {
    view.innerHTML = '';
    // S'assurer que la nav et le FAB sont cachés dans l'éditeur
    buildEditor();
    return;
  }

  // Rendu de la vue
  let html = '';
  switch (page) {
    case 'dashboard': html = viewDashboard();  break;
    case 'notes':     html = viewNotes();      break;
    case 'subject':   html = viewSubject();    break;
    case 'calendar':  html = viewCalendar();   break;
    case 'wellness':  html = viewWellness();   break;
    case 'tasks':     html = viewTasks();      break;
    case 'list':      html = viewList();       break;
    case 'settings':  html = viewSettings();   break;
    case 'onboarding': html = viewOnboarding(); break;
    case 'auth':       html = viewAuth();       break;
    default:          html = viewDashboard();
  }
  view.innerHTML = html;
  navActive(page);

  // Scroll en haut
  view.scrollTop = 0;

  // Appliquer les réglages
  const cfg = LS.cfg();
  if (cfg.dark)     document.body.classList.add('dark');
  if (cfg.fontSize) applyFontSize(cfg.fontSize);
}

function navActive(page) {
  const map = {dashboard:'dashboard',notes:'notes',subject:'notes',
                calendar:'calendar',wellness:'wellness',
                tasks:'tasks',list:'tasks'};
  const active = map[page] || page;
  document.querySelectorAll('#nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.p === active);
  });
}

// ── Toast notification ────────────────────────────────
function showToast(msg, duration = 2400) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Modal (bottom-sheet) ──────────────────────────────
function openModal(html, title = '') {
  const wrap = document.getElementById('modal-wrap');
  const cont = document.getElementById('modal-inner');
  if (!wrap || !cont) return;
  cont.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">${title}</span>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    ${html}`;
  wrap.classList.add('open');
  // Focus premier input
  setTimeout(() => cont.querySelector('input,textarea,select')?.focus(), 120);
}

function closeModal() {
  const wrap = document.getElementById('modal-wrap');
  if (wrap) wrap.classList.remove('open');
}

// Ferme en cliquant le fond
document.addEventListener('click', e => {
  if (e.target.id === 'modal-wrap') closeModal();
});

// ── FAB ───────────────────────────────────────────────
function openFAB() {
  const page = _page;
  if (page === 'notes' || page === 'subject') {
    if (_sid) newNote(_sid);
    else      openSubjectModal();
  } else if (page === 'calendar') {
    openEventModal();
  } else if (page === 'tasks' || page === 'list') {
    if (_lid) openTaskModal(_lid);
    else      openListModal();
  } else if (page === 'wellness') {
    if (_wellTab === 'mood')   openMoodModal(today());
    else if (_wellTab === 'habits') openHabitsManager();
    else                            openCycleLogModal();
  } else {
    // Dashboard : ouvrir humeur
    openMoodModal(today());
  }
}

// ═══════════════════════════════════════════════════════
//  MODAL : Sujet (Notes)
// ═══════════════════════════════════════════════════════
function openSubjectModal(id) {
  const s = id ? LS.subjects().find(x => x.id === id) : null;
  const title = s ? 'Modifier le sujet' : 'Nouveau sujet';

  const selEmoji = s?.emoji || EMOJIS[0];
  const selColor = s?.color || PALETTE[0];

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Nom du sujet</label>
    <input class="form-input" id="sub-name" type="text" value="${esc(s?.name||'')}" placeholder="Ex: Mathématiques…" maxlength="40">
  </div>
  <div class="form-group">
    <label class="form-label">Emoji</label>
    <div class="emoji-grid">
      ${EMOJIS.map(e => `<button class="emoji-btn${e===selEmoji?' selected':''}" onclick="selEmoji(this,'${e}')">${e}</button>`).join('')}
    </div>
    <input type="hidden" id="sub-emoji" value="${selEmoji}">
  </div>
  <div class="form-group">
    <label class="form-label">Couleur</label>
    <div class="palette-grid">
      ${PALETTE.map((c,i) => `<button class="palette-btn${c.dot===selColor.dot?' selected':''}"
        style="background:${c.bg};border:2.5px solid ${c.dot}" onclick="selPalette(this,${i})"></button>`).join('')}
    </div>
    <input type="hidden" id="sub-color" value="${PALETTE.indexOf(selColor) >= 0 ? PALETTE.indexOf(selColor) : 0}">
  </div>
  <div class="modal-actions">
    ${s ? `<button class="btn btn-danger btn-sm" onclick="delSubject('${s.id}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveSubject('${id||''}')">Enregistrer</button>
  </div>
</div>`, title);
}

function selEmoji(btn, e) {
  btn.closest('.emoji-grid').querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('sub-emoji').value = e;
}

function selPalette(btn, i) {
  btn.closest('.palette-grid').querySelectorAll('.palette-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('sub-color').value = i;
}

function saveSubject(id) {
  const name = document.getElementById('sub-name')?.value?.trim();
  if (!name) { showToast('Entre un nom de sujet'); return; }
  const emoji = document.getElementById('sub-emoji')?.value || EMOJIS[0];
  const ci    = parseInt(document.getElementById('sub-color')?.value || '0');
  const color = PALETTE[ci] || PALETTE[0];
  const subs  = LS.subjects();
  if (id) {
    const idx = subs.findIndex(s => s.id === id);
    if (idx >= 0) { subs[idx].name = name; subs[idx].emoji = emoji; subs[idx].color = color; }
  } else {
    subs.push({id:uid(), name, emoji, color});
  }
  LS.s('pl_subjects', subs);
  closeModal();
  go(id ? 'subject' : 'notes', id ? {sid:id} : {});
}

// ═══════════════════════════════════════════════════════
//  MODAL : Événement (Agenda)
// ═══════════════════════════════════════════════════════
function openEventModal(id) {
  const ev = id ? LS.events().find(x => x.id === id) : null;
  const defDate = _selDay || today();

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Titre</label>
    <input class="form-input" id="ev-title" type="text" value="${esc(ev?.title||'')}" placeholder="Ex: Examen maths…">
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Date</label>
      <input class="form-input" id="ev-date" type="date" value="${ev?.date||defDate}">
    </div>
  </div>
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Début</label>
      <input class="form-input" id="ev-start" type="time" value="${ev?.startTime||''}">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">Fin</label>
      <input class="form-input" id="ev-end" type="time" value="${ev?.endTime||''}">
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Lieu (optionnel)</label>
    <input class="form-input" id="ev-loc" type="text" value="${esc(ev?.location||'')}" placeholder="Salle, adresse…">
  </div>
  <div class="form-group">
    <label class="form-label">Couleur</label>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      ${EVCOLORS.map(c => `<button class="color-dot-btn${(ev?.color||EVCOLORS[0])===c?' selected':''}"
        style="background:${c}" onclick="selEvColor(this,'${c}')"></button>`).join('')}
    </div>
    <input type="hidden" id="ev-color" value="${ev?.color||EVCOLORS[0]}">
  </div>
  <div class="form-group">
    <label class="form-label">Note (optionnel)</label>
    <textarea class="form-input" id="ev-note" rows="2" placeholder="Infos complémentaires…">${esc(ev?.note||'')}</textarea>
  </div>
  <div class="modal-actions">
    ${ev ? `<button class="btn btn-danger btn-sm" onclick="delEvent('${ev.id}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveEvent('${id||''}')">Enregistrer</button>
  </div>
</div>`, ev ? 'Modifier l\'événement' : 'Nouvel événement');
}

function selEvColor(btn, c) {
  btn.closest('div').querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('ev-color').value = c;
}

function saveEvent(id) {
  const title = document.getElementById('ev-title')?.value?.trim();
  const date  = document.getElementById('ev-date')?.value;
  if (!title || !date) { showToast('Titre et date requis'); return; }
  const ev = {
    id:       id || uid(),
    title,
    date,
    startTime: document.getElementById('ev-start')?.value || '',
    endTime:   document.getElementById('ev-end')?.value   || '',
    location:  document.getElementById('ev-loc')?.value?.trim() || '',
    color:     document.getElementById('ev-color')?.value || EVCOLORS[0],
    note:      document.getElementById('ev-note')?.value?.trim() || '',
  };
  const evs = LS.events();
  if (id) {
    const idx = evs.findIndex(e => e.id === id);
    if (idx >= 0) evs[idx] = ev; else evs.push(ev);
  } else {
    evs.push(ev);
  }
  LS.s('pl_events', evs);
  _selDay = date;
  closeModal();
  go('calendar');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Humeur
// ═══════════════════════════════════════════════════════
const MOOD_LABELS = ['','Excellent','Bien','Neutre','Fatiguée','Difficile','Stressée'];

function openMoodModal(ds) {
  const moods = LS.moods();
  const cur   = moods[ds];

  openModal(`
<div class="modal-body">
  <div style="text-align:center;margin-bottom:1rem">
    <div style="font-size:.88rem;color:var(--tm)">${dmy(ds)}</div>
  </div>
  <div class="mood-picker">
    ${MOODS.filter(Boolean).map((mo, i) => {
      const idx = i + 1;
      return `<button class="mood-pick-btn${cur?.mood===idx?' selected':''}"
        style="background:${mo.bg};border:2px solid ${cur?.mood===idx?mo.bc:'transparent'}"
        onclick="selMoodBtn(this,${idx})">
        <span class="mood-em">${mo.e}</span>
        <span class="mood-lbl">${mo.l}</span>
      </button>`;
    }).join('')}
  </div>
  <input type="hidden" id="mood-val" value="${cur?.mood||''}">
  <div class="form-group" style="margin-top:.75rem">
    <label class="form-label">Note (optionnel)</label>
    <textarea class="form-input" id="mood-note" rows="2" placeholder="Comment s'est passée ta journée ?">${esc(cur?.note||'')}</textarea>
  </div>
  <div class="modal-actions">
    ${cur ? `<button class="btn btn-danger btn-sm" onclick="deleteMood('${ds}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveMood('${ds}')">Enregistrer</button>
  </div>
</div>`, 'Humeur du jour');
}

function selMoodBtn(btn, idx) {
  btn.closest('.mood-picker').querySelectorAll('.mood-pick-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.border = '2px solid transparent';
  });
  const mo = MOODS[idx];
  btn.classList.add('selected');
  btn.style.border = `2px solid ${mo.bc}`;
  document.getElementById('mood-val').value = idx;
}

function saveMood(ds) {
  const v = parseInt(document.getElementById('mood-val')?.value);
  if (!v) { showToast('Sélectionne une humeur'); return; }
  const note = document.getElementById('mood-note')?.value?.trim() || '';
  const moods = LS.moods();
  moods[ds] = {mood: v, note, ts: Date.now()};
  LS.s('pl_moods', moods);
  closeModal();
  if (_page === 'wellness') switchWellTab('mood');
  else go('dashboard');
}

function deleteMood(ds) {
  const moods = LS.moods();
  delete moods[ds];
  LS.s('pl_moods', moods);
  closeModal();
  if (_page === 'wellness') switchWellTab('mood');
  else go('dashboard');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Gestionnaire d'habitudes
// ═══════════════════════════════════════════════════════
function openHabitsManager() {
  const habits = LS.habits();

  openModal(`
<div class="modal-body">
  <div class="card" style="margin-bottom:.75rem">
    ${habits.map(h => `
    <div class="habit-row" style="padding:.6rem 0">
      <div class="habit-check${h.active?' done':''}"
        style="${h.active?'background:'+h.color+';border-color:'+h.color:''}"
        onclick="toggleHabitActive('${h.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="habit-info">
        <div class="habit-name">${h.emoji} ${esc(h.name)}</div>
      </div>
      <div class="color-swatch" style="background:${h.color};width:18px;height:18px;border-radius:50%;flex-shrink:0"></div>
    </div>`).join('')}
  </div>
  <button class="btn btn-ghost btn-full btn-sm" onclick="openNewHabitForm()">+ Nouvelle habitude</button>
  <div id="new-habit-form" style="display:none;margin-top:.75rem">
    <div class="form-group">
      <label class="form-label">Nom</label>
      <input class="form-input" id="nh-name" type="text" placeholder="Ex: Yoga…" maxlength="40">
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">Emoji</label>
        <input class="form-input" id="nh-emoji" type="text" value="⭐" maxlength="2" style="width:60px;text-align:center">
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">Couleur</label>
        <input class="form-input" id="nh-color" type="color" value="#C4778E" style="padding:.2rem;height:38px">
      </div>
    </div>
    <button class="btn btn-sm btn-full" onclick="addHabit()">Ajouter</button>
  </div>
  <div class="modal-actions" style="margin-top:.5rem">
    <button class="btn" onclick="closeModal();switchWellTab('habits')">Fermer</button>
  </div>
</div>`, 'Mes habitudes');
}

function openNewHabitForm() {
  const f = document.getElementById('new-habit-form');
  if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
}

function toggleHabitActive(id) {
  const habits = LS.habits();
  const h = habits.find(x => x.id === id);
  if (h) h.active = !h.active;
  LS.s('pl_habits', habits);
  openHabitsManager(); // re-render modal
}

function addHabit() {
  const name  = document.getElementById('nh-name')?.value?.trim();
  if (!name) { showToast('Entre un nom'); return; }
  const emoji = document.getElementById('nh-emoji')?.value || '⭐';
  const color = document.getElementById('nh-color')?.value || '#C4778E';
  const habits = LS.habits();
  habits.push({id:uid(), name, emoji, active:true, color});
  LS.s('pl_habits', habits);
  openHabitsManager();
}

// ═══════════════════════════════════════════════════════
//  MODAL : Log du cycle
// ═══════════════════════════════════════════════════════
function openCycleLogModal(ds) {
  const date = ds || today();
  const log  = LS.cycleLog();
  const dayEntry = log.find(e => e.date === date && e.type === 'log');
  const hasPeriod = log.some(e => e.date === date && e.type === 'period');

  openModal(`
<div class="modal-body">
  <div style="text-align:center;color:var(--tm);font-size:.88rem;margin-bottom:.75rem">${dmy(date)}</div>
  <div class="form-group">
    <label class="toggle-row">
      <span class="setting-label">🌹 Règles aujourd'hui</span>
      <label class="toggle">
        <input type="checkbox" id="cycle-period" ${hasPeriod?'checked':''}
          onchange="toggleCycleDay('${date}')">
        <span class="toggle-slider"></span>
      </label>
    </label>
  </div>
  <div class="form-group">
    <label class="form-label">Symptômes</label>
    <div class="symptom-grid">
      ${SYMPTOMS.map(s => {
        const checked = dayEntry?.symptoms?.includes(s);
        return `<button class="symptom-btn${checked?' selected':''}"
          onclick="this.classList.toggle('selected')">${s}</button>`;
      }).join('')}
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Niveau d'énergie</label>
    <div style="display:flex;gap:.5rem;justify-content:center">
      ${[1,2,3,4,5].map(n => `<button class="energy-btn${dayEntry?.energy===n?' selected':''}"
        onclick="selEnergy(this,${n})" data-e="${n}">${n}</button>`).join('')}
    </div>
    <input type="hidden" id="cycle-energy" value="${dayEntry?.energy||''}">
  </div>
  <div class="form-group">
    <label class="form-label">Note (optionnel)</label>
    <textarea class="form-input" id="cycle-note" rows="2">${esc(dayEntry?.note||'')}</textarea>
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveCycleLog('${date}')">Enregistrer</button>
  </div>
</div>`, 'Journal du cycle');
}

function selEnergy(btn, n) {
  btn.closest('div').querySelectorAll('.energy-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('cycle-energy').value = n;
}

function saveCycleLog(date) {
  const symptoms = [...document.querySelectorAll('.symptom-btn.selected')].map(b => b.textContent);
  const energy   = parseInt(document.getElementById('cycle-energy')?.value) || null;
  const note     = document.getElementById('cycle-note')?.value?.trim() || '';

  const log = LS.cycleLog().filter(e => !(e.date === date && e.type === 'log'));
  if (symptoms.length || energy || note) {
    log.push({date, type:'log', symptoms, energy, note, ts:Date.now()});
  }
  LS.s('pl_cycle', log);
  closeModal();
  showToast('Journal mis à jour ✓');
  if (_page === 'wellness') switchWellTab('cycle');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Config cycle
// ═══════════════════════════════════════════════════════
function openCycleConfigModal() {
  const cfg = LS.cycleCfg();
  openModal(`
<div class="modal-body">
  <div class="form-row">
    <div class="form-group" style="flex:1">
      <label class="form-label">Longueur moyenne du cycle (j)</label>
      <input class="form-input" id="cc-avg" type="number" min="18" max="50" value="${cfg.avgLen}">
    </div>
    <div class="form-group" style="flex:1">
      <label class="form-label">Durée des règles (j)</label>
      <input class="form-input" id="cc-per" type="number" min="1" max="14" value="${cfg.perLen}">
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveCycleCfgModal()">Enregistrer</button>
  </div>
</div>`, 'Paramètres du cycle');
}

function saveCycleCfgModal() {
  const avgLen = parseInt(document.getElementById('cc-avg')?.value);
  const perLen = parseInt(document.getElementById('cc-per')?.value);
  if (!avgLen || !perLen || avgLen < 18 || perLen < 1) { showToast('Valeurs invalides'); return; }
  LS.s('pl_cyclecfg', {avgLen, perLen});
  closeModal();
  showToast('Paramètres sauvegardés ✓');
  switchWellTab('cycle');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Liste de tâches
// ═══════════════════════════════════════════════════════
function openListModal(id) {
  const l = id ? LS.lists().find(x => x.id === id) : null;
  const selEmoji = l?.emoji || EMOJIS[0];
  const selColor = l?.color || PALETTE[0];

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Nom de la liste</label>
    <input class="form-input" id="lst-name" type="text" value="${esc(l?.name||'')}" placeholder="Ex: Courses, Révisions…" maxlength="40">
  </div>
  <div class="form-group">
    <label class="form-label">Emoji</label>
    <div class="emoji-grid">
      ${EMOJIS.map(e => `<button class="emoji-btn${e===selEmoji?' selected':''}" onclick="selEmoji(this,'${e}')">${e}</button>`).join('')}
    </div>
    <input type="hidden" id="lst-emoji" value="${selEmoji}">
  </div>
  <div class="form-group">
    <label class="form-label">Couleur</label>
    <div class="palette-grid">
      ${PALETTE.map((c,i) => `<button class="palette-btn${c.dot===selColor.dot?' selected':''}"
        style="background:${c.bg};border:2.5px solid ${c.dot}" onclick="selPaletteList(this,${i})"></button>`).join('')}
    </div>
    <input type="hidden" id="lst-color" value="${PALETTE.findIndex(c=>c.dot===selColor.dot) >= 0 ? PALETTE.findIndex(c=>c.dot===selColor.dot) : 0}">
  </div>
  <div class="modal-actions">
    ${l ? `<button class="btn btn-danger btn-sm" onclick="delList('${l.id}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveList('${id||''}')">Enregistrer</button>
  </div>
</div>`, l ? 'Modifier la liste' : 'Nouvelle liste');
}

function selPaletteList(btn, i) {
  btn.closest('.palette-grid').querySelectorAll('.palette-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('lst-color').value = i;
}

function saveList(id) {
  const name = document.getElementById('lst-name')?.value?.trim();
  if (!name) { showToast('Entre un nom de liste'); return; }
  const emoji = document.getElementById('lst-emoji')?.value || EMOJIS[0];
  const ci    = parseInt(document.getElementById('lst-color')?.value || '0');
  const color = PALETTE[ci] || PALETTE[0];
  const lists = LS.lists();
  if (id) {
    const idx = lists.findIndex(l => l.id === id);
    if (idx >= 0) { lists[idx].name = name; lists[idx].emoji = emoji; lists[idx].color = color; }
  } else {
    lists.push({id:uid(), name, emoji, color});
  }
  LS.s('pl_lists', lists);
  closeModal();
  go('tasks');
}

// ═══════════════════════════════════════════════════════
//  MODAL : Tâche
// ═══════════════════════════════════════════════════════
function openTaskModal(listId, taskId) {
  const t    = taskId ? LS.todos().find(x => x.id === taskId) : null;
  const list = listId ? LS.lists().find(x => x.id === listId) : null;
  const dotColor = list?.color?.dot || 'var(--p)';

  openModal(`
<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Tâche</label>
    <input class="form-input" id="task-text" type="text" value="${esc(t?.text||'')}" placeholder="Que dois-tu faire ?">
  </div>
  <div class="form-group">
    <label class="form-label">Date limite (optionnel)</label>
    <input class="form-input" id="task-due" type="date" value="${t?.due||''}">
  </div>
  <div class="form-group">
    <label class="form-label">Priorité</label>
    <div style="display:flex;gap:.5rem">
      <button class="prio-btn${(!t?.priority||t.priority==='normal')?' selected':''}"
        onclick="selPrio(this,'normal')">Normal</button>
      <button class="prio-btn${t?.priority==='high'?' selected':''}"
        style="${t?.priority==='high'?'border-color:#E53E5A;color:#E53E5A':''}"
        onclick="selPrio(this,'high')">🔴 Haute</button>
    </div>
    <input type="hidden" id="task-prio" value="${t?.priority||'normal'}">
  </div>
  <div class="form-group">
    <label class="form-label">Note (optionnel)</label>
    <textarea class="form-input" id="task-note" rows="2" placeholder="Détails…">${esc(t?.note||'')}</textarea>
  </div>
  <div class="modal-actions">
    ${t ? `<button class="btn btn-danger btn-sm" onclick="delTodo('${t.id}')">Supprimer</button>` : ''}
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" style="background:${dotColor}" onclick="saveTask('${listId||''}','${taskId||''}')">Enregistrer</button>
  </div>
</div>`, t ? 'Modifier la tâche' : 'Nouvelle tâche');
}

function selPrio(btn, val) {
  btn.closest('div').querySelectorAll('.prio-btn').forEach(b => {
    b.classList.remove('selected');
    b.style.borderColor = '';
    b.style.color = '';
  });
  btn.classList.add('selected');
  if (val === 'high') { btn.style.borderColor = '#E53E5A'; btn.style.color = '#E53E5A'; }
  document.getElementById('task-prio').value = val;
}

function saveTask(listId, taskId) {
  const text = document.getElementById('task-text')?.value?.trim();
  if (!text) { showToast('Entre une tâche'); return; }
  const due      = document.getElementById('task-due')?.value    || null;
  const note     = document.getElementById('task-note')?.value?.trim() || '';
  const priority = document.getElementById('task-prio')?.value   || 'normal';
  const todos    = LS.todos();
  if (taskId) {
    const idx = todos.findIndex(t => t.id === taskId);
    if (idx >= 0) Object.assign(todos[idx], {text, due, note, priority});
  } else {
    todos.push({id:uid(), listId: listId||null, text, done:false, createdAt:Date.now(), due, note, priority});
  }
  LS.s('pl_todos', todos);
  closeModal();
  if (_lid) go('list', {lid: _lid});
  else go('tasks');
}

// ═══════════════════════════════════════════════════════
//  ICS Parser
// ═══════════════════════════════════════════════════════
function parseICS(text) {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n')
    .replace(/\n[ \t]/g,'').split('\n');
  const events = [];
  let cur = null;

  for (const raw of lines) {
    const [key, ...rest] = raw.split(':');
    const val = rest.join(':').trim();
    const k   = (key||'').split(';')[0].toUpperCase();

    if (k === 'BEGIN' && val === 'VEVENT') { cur = {}; }
    else if (k === 'END' && val === 'VEVENT' && cur) {
      if (cur.date && cur.title) events.push(cur);
      cur = null;
    } else if (cur) {
      if (k === 'SUMMARY')   cur.title     = val;
      if (k === 'LOCATION')  cur.location  = val;
      if (k === 'UID')       cur.uid       = val;
      if (k === 'DESCRIPTION') cur.description = val;
      if (k === 'DTSTART' || k.startsWith('DTSTART')) {
        cur.date      = parseICSDate(val);
        cur.startTime = parseICSTime(val);
      }
      if (k === 'DTEND' || k.startsWith('DTEND')) {
        cur.endTime = parseICSTime(val);
      }
    }
  }
  return events.map(e => ({
    id:        e.uid || uid(),
    title:     e.title || '',
    date:      e.date,
    startTime: e.startTime || '',
    endTime:   e.endTime   || '',
    location:  e.location  || '',
    color:     EVCOLORS[3], // bleu pour ICS
    note:      e.description || '',
    source:    'ics',
  }));
}

function parseICSDate(val) {
  // YYYYMMDD ou YYYYMMDDTHHmmss ou YYYYMMDDTHHmmssZ
  const d = val.replace(/[TZ]/g,' ').trim().replace(/\s.*/,'');
  if (d.length >= 8) {
    return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  }
  return null;
}

function parseICSTime(val) {
  const t = val.replace(/.*T/,'').replace(/Z$/,'');
  if (t.length >= 4) {
    // Convertir UTC→local basique (heure locale)
    try {
      const raw = val.replace(/[:-]/g,'');
      const y=raw.slice(0,4), mo=raw.slice(4,6), d=raw.slice(6,8);
      const h=raw.slice(9,11), m=raw.slice(11,13);
      if (y && mo && d && h && m) {
        const dt = new Date(`${y}-${mo}-${d}T${h}:${m}:00Z`);
        return dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      }
    } catch {}
    return `${t.slice(0,2)}:${t.slice(2,4)}`;
  }
  return '';
}

async function fetchICS(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();
  const parsed = parseICS(text);
  if (!parsed.length) throw new Error('Aucun événement trouvé');
  LS.s('pl_ics', parsed);
  showToast(`${parsed.length} événements importés ✓`);
  return parsed.length;
}

function importICSFile(input) {
  const f = input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const parsed = parseICS(e.target.result);
      if (!parsed.length) { showToast('❌ Aucun événement trouvé'); return; }
      LS.s('pl_ics', parsed);
      showToast(`${parsed.length} événements importés ✓`);
      go('calendar');
    } catch {
      showToast('❌ Erreur lors de l\'import');
    }
  };
  r.readAsText(f);
  input.value = '';
}

// clearICS est aussi appelée depuis calendar.js
function clearICS() {
  if (!confirm('Supprimer tous les événements importés ?')) return;
  LS.s('pl_ics', []);
  showToast('Calendrier ICS supprimé');
  go('calendar');
}

// ═══════════════════════════════════════════════════════
//  Sparkle Canvas Background
// ═══════════════════════════════════════════════════════
function initSparkles() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  W();
  window.addEventListener('resize', W);

  const COLORS = ['#C4778E','#C9A96E','#7AA97C','#D4A0B5','#E8C8A0'];
  const particles = Array.from({length: 38}, () => mkParticle());

  function mkParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + .5,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35 - .12,
      alpha: Math.random() * .5 + .15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: Math.random() * 200 + 80,
      age: 0,
    };
  }

  function drawStar(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const ix = x + r * Math.cos(angle);
      const iy = y + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  let raf;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.age++;
      const fade = 1 - p.age / p.life;
      drawStar(ctx, p.x, p.y, p.r, p.color, p.alpha * fade);
      if (p.age > p.life || p.y < -10) {
        particles[i] = mkParticle();
        particles[i].y = canvas.height + 10;
      }
    });
    raf = requestAnimationFrame(animate);
  }
  animate();
}

// ═══════════════════════════════════════════════════════
//  Pomodoro Timer
// ═══════════════════════════════════════════════════════
const _pomo = { running:false, phase:'work', secs:25*60, sessions:0, iv:null };

function togglePomo() {
  if (_pomo.running) {
    clearInterval(_pomo.iv);
    _pomo.running = false;
    _pomo.iv = null;
  } else {
    _pomo.running = true;
    _pomo.iv = setInterval(_tickPomo, 1000);
  }
  _updatePomoUI();
}

function _tickPomo() {
  _pomo.secs--;
  if (_pomo.secs <= 0) {
    if (_pomo.phase === 'work') {
      _pomo.sessions++;
      _pomo.phase = 'break';
      _pomo.secs = 5 * 60;
      showToast('⏰ Pause méritée ! 5 minutes 🌸', 3500);
    } else {
      _pomo.phase = 'work';
      _pomo.secs = 25 * 60;
      showToast('🍅 C\'est reparti ! 25 min de focus ✨', 3500);
    }
    _updatePomoUI();
    return;
  }
  _updatePomoUI();
}

function _updatePomoUI() {
  const timeEl = document.getElementById('pomo-time');
  if (!timeEl) return;

  const total  = _pomo.phase === 'work' ? 25*60 : 5*60;
  const mm     = Math.floor(_pomo.secs / 60).toString().padStart(2,'0');
  const ss     = (_pomo.secs % 60).toString().padStart(2,'0');
  timeEl.textContent = `${mm}:${ss}`;

  const btnEl = document.getElementById('pomo-btn');
  if (btnEl) {
    btnEl.innerHTML = _pomo.running
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>';
  }

  const sessEl = document.getElementById('pomo-sess');
  if (sessEl) sessEl.textContent = `🍅 ${_pomo.sessions} session${_pomo.sessions!==1?'s':''}`;

  const phEl = document.getElementById('pomo-phase');
  if (phEl) phEl.textContent = _pomo.phase === 'work' ? '⏱️ Focus Time' : '☕ Pause douce';

  const ringEl = document.getElementById('pomo-ring-fill');
  if (ringEl) {
    const r = 36, circ = +(2*Math.PI*r).toFixed(2);
    const dash = +(_pomo.secs / total * circ).toFixed(2);
    ringEl.setAttribute('stroke-dasharray', `${dash} ${circ}`);
    ringEl.setAttribute('stroke-dashoffset', +(circ*0.25).toFixed(2));
    ringEl.setAttribute('stroke', _pomo.phase === 'break' ? '#7AA97C' : 'url(#pomo-grad)');
  }

  const card = document.querySelector('.pomo-card');
  if (card) {
    card.classList.toggle('pomo-active', _pomo.running);
    card.classList.toggle('pomo-break', _pomo.phase === 'break');
  }
}

function resetPomo() {
  clearInterval(_pomo.iv);
  _pomo.running = false;
  _pomo.iv = null;
  _pomo.secs = 25 * 60;
  _pomo.phase = 'work';
  _updatePomoUI();
  showToast('Timer réinitialisé');
}

// ═══════════════════════════════════════════════════════
//  Hydratation
// ═══════════════════════════════════════════════════════
function logWater(n) {
  saveWater(n);
  // Mise à jour UI sans re-render
  document.querySelectorAll('.hydro-drop').forEach((el, i) => {
    el.classList.toggle('filled', i < n);
  });
  const cnt = document.getElementById('hydro-count');
  if (cnt) cnt.textContent = `${n}/8 verres`;
  const done = document.getElementById('hydro-done');
  if (done) done.style.display = (n >= 8) ? 'flex' : 'none';
  if (n === 8) showToast('💧 Objectif hydratation atteint ! 🎉', 3000);
}

// ═══════════════════════════════════════════════════════
//  Focus du jour
// ═══════════════════════════════════════════════════════
function openFocusEdit() {
  const current = focusToday();
  openModal(`<div class="modal-body">
  <div class="form-group">
    <label class="form-label">Ton intention principale</label>
    <input class="form-input" id="focus-in" type="text"
      value="${esc(current)}"
      placeholder="Ex: Finir le chapitre 3 de biologie…"
      maxlength="80"
      onkeydown="if(event.key==='Enter')saveFocusAndUpdate()">
  </div>
  <p style="font-size:.76rem;color:var(--ts);margin-top:-.1rem;margin-bottom:.6rem;line-height:1.5">
    💡 Un seul objectif par jour pour rester concentrée et sereine.
  </p>
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveFocusAndUpdate()">Enregistrer ✓</button>
  </div>
</div>`, '🎯 Objectif du jour');
}

function saveFocusAndUpdate() {
  const val = document.getElementById('focus-in')?.value?.trim() || '';
  saveFocus(val);
  closeModal();
  // Mise à jour UI sans re-render complet
  const el = document.querySelector('#focus-text');
  if (el) {
    el.textContent = val || 'Touche pour définir ton focus…';
    el.classList.toggle('set', !!val);
  }
  const card = document.querySelector('.focus-card');
  if (card) card.classList.toggle('focus-set', !!val);
  if (val) showToast('🎯 Focus du jour enregistré !');
}

// ═══════════════════════════════════════════════════════
//  Notifications (eau + agenda)
// ═══════════════════════════════════════════════════════
async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

function sendNotif(title, body, icon = 'icon.svg') {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon, badge: 'icon.svg', vibrate: [200, 100, 200] });
  } catch(e) {
    // Fallback : toast in-app
    showToast(`${title} — ${body}`, 4000);
  }
}

// Rappels eau toutes les 90 min (9h → 21h)
function scheduleWaterReminders() {
  const water = [
    { h:9,  m:0  }, { h:10, m:30 }, { h:12, m:0  }, { h:13, m:30 },
    { h:15, m:0  }, { h:16, m:30 }, { h:18, m:0  }, { h:20, m:0  },
  ];
  const MSGS = [
    '💧 N\'oublie pas de boire de l\'eau !',
    '💧 Hydrate-toi, tu seras plus concentrée 🧠',
    '💧 Un verre d\'eau, c\'est parti !',
    '💧 Ton corps te remercie pour chaque gorgée 🌿',
    '💦 Rappel hydratation — objectif 8 verres !',
    '💧 Tu as bu suffisamment aujourd\'hui ? 🌸',
  ];
  const now    = new Date();
  const hNow   = now.getHours();
  const mNow   = now.getMinutes();
  const curMin = hNow * 60 + mNow;

  water.forEach(({ h, m }) => {
    const targetMin = h * 60 + m;
    const diff      = targetMin - curMin;
    if (diff > 0 && diff < 24 * 60) {
      setTimeout(() => {
        const drunk = waterToday();
        if (drunk < 8) {
          const msg = MSGS[Math.floor(Math.random() * MSGS.length)];
          sendNotif('💧 Hydratation — Planify', msg);
          showToast(msg, 3500);
        }
      }, diff * 60 * 1000);
    }
  });
}

// Rappels événements (15 min avant)
function scheduleEventReminders() {
  const td  = today();
  const evs = [...LS.events(), ...LS.ics()].filter(e => e.date === td && e.startTime);
  const now = new Date();
  evs.forEach(e => {
    const [h, m] = e.startTime.split(':').map(Number);
    const evMs   = new Date(td + 'T' + e.startTime + ':00').getTime() - 15 * 60 * 1000;
    const diff   = evMs - now.getTime();
    if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        sendNotif(`📅 Dans 15 min — ${e.title||e.summary||'Événement'}`,
          `${e.startTime}${e.location ? ' · 📍 ' + e.location : ''}`);
      }, diff);
    }
  });
}

// Init notifications au boot (après permission)
async function initNotifications() {
  const cfg = LS.cfg();
  if (cfg.notifs === false) return;
  const ok = await requestNotifPermission();
  if (!ok) return;
  scheduleWaterReminders();
  scheduleEventReminders();
}

// ═══════════════════════════════════════════════════════
//  Calendrier — navigation vues
// ═══════════════════════════════════════════════════════
function setCalView(v) {
  _calView = v;
  go('calendar');
}
function navDay(d) {
  _selDay = d;
  go('calendar');
}
function navWeek(startDay) {
  _selDay = startDay;
  go('calendar');
}

// ═══════════════════════════════════════════════════════
//  Objectifs de la semaine
// ═══════════════════════════════════════════════════════
function openGoalsModal() {
  const goals = weekGoals();
  openModal(`
<div class="modal-body">
  <div id="goals-list-modal">
    ${goals.length === 0
      ? `<p style="color:var(--ts);text-align:center;font-size:.85rem;padding:.5rem 0">Aucun objectif pour cette semaine 🎯</p>`
      : goals.map((g, i) => `
    <div class="goal-row-modal">
      <button class="goal-check-modal${g.done?' done':''}" onclick="toggleGoalModal(${i})">
        ${g.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>
      <span class="goal-text-modal${g.done?' goal-struck':''}">${esc(g.text)}</span>
      <button class="goal-del-modal" onclick="delGoal(${i})">🗑️</button>
    </div>`).join('')}
  </div>
  ${goals.length < 5 ? `
  <div class="form-group" style="margin-top:.85rem">
    <input class="form-input" id="goal-in" type="text"
      placeholder="Ajouter un objectif…" maxlength="60"
      onkeydown="if(event.key==='Enter')addGoalItem()">
  </div>
  <button class="btn btn-sm btn-full" onclick="addGoalItem()">+ Ajouter</button>` : `
  <p style="font-size:.78rem;color:var(--ts);text-align:center;margin-top:.5rem">Max 5 objectifs par semaine ✨</p>`}
  <div class="modal-actions">
    <button class="btn" onclick="closeModal();go('dashboard')">Fermer</button>
  </div>
</div>`, '🎯 Objectifs de la semaine');
}

function toggleGoalModal(idx) {
  const goals = weekGoals();
  if (goals[idx]) goals[idx].done = !goals[idx].done;
  saveWeekGoals(goals);
  openGoalsModal(); // re-render modal
  _updateGoalsWidget();
}

function toggleGoalDirect(idx) {
  const goals = weekGoals();
  if (!goals[idx]) return;
  goals[idx].done = !goals[idx].done;
  saveWeekGoals(goals);
  _updateGoalsWidget();
  showToast(goals[idx].done ? '✅ Objectif accompli ! 🎉' : '↩ Objectif décoché');
}

function _updateGoalsWidget() {
  const goals = weekGoals();
  const done  = goals.filter(g => g.done).length;
  const el    = document.querySelector('.wg-card');
  if (!el) return;
  const ct = el.querySelector('#goals-count');
  if (ct) ct.textContent = `${done}/${goals.length}`;
  const pb = el.querySelector('#goals-progress');
  if (pb) pb.style.width = goals.length > 0 ? `${done/goals.length*100}%` : '0%';
  const list = el.querySelector('#goals-items');
  if (list) {
    list.innerHTML = goals.slice(0, 5).map((g, i) => `
<div class="wg-item${g.done?' wg-done':''}" onclick="toggleGoalDirect(${i})">
  <div class="wg-check${g.done?' wg-checked':''}">
    ${g.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
  </div>
  <span class="wg-text">${esc(g.text)}</span>
</div>`).join('');
  }
}

function addGoalItem() {
  const val = document.getElementById('goal-in')?.value?.trim();
  if (!val) { showToast('Entre un objectif 🎯'); return; }
  const goals = weekGoals();
  if (goals.length >= 5) { showToast('Max 5 objectifs par semaine'); return; }
  goals.push({ text: val, done: false, createdAt: Date.now() });
  saveWeekGoals(goals);
  openGoalsModal();
}

function delGoal(idx) {
  const goals = weekGoals();
  goals.splice(idx, 1);
  saveWeekGoals(goals);
  openGoalsModal();
  _updateGoalsWidget();
}

// ═══════════════════════════════════════════════════════
//  Journal de gratitude
// ═══════════════════════════════════════════════════════
function openGratitudeModal() {
  const items = gratitudeToday();
  openModal(`
<div class="modal-body">
  <p style="font-size:.8rem;color:var(--tm);margin-bottom:.85rem;line-height:1.7">
    🌸 Prends 2 minutes pour noter 3 choses pour lesquelles tu es reconnaissante aujourd'hui. Même les petites choses comptent.
  </p>
  ${[0,1,2].map(i => `
  <div class="form-group">
    <label class="form-label">${['✨ 1ère gratitude','🌸 2ème gratitude','💛 3ème gratitude'][i]}</label>
    <input class="form-input" id="grat-${i}" type="text"
      value="${esc(items[i]||'')}"
      placeholder="${['Je suis reconnaissante pour…', 'Une belle chose aujourd\'hui…', 'Ce qui m\'a rendu heureuse…'][i]}"
      maxlength="100">
  </div>`).join('')}
  <div class="modal-actions">
    <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
    <button class="btn" onclick="saveGratitudeAll()">Enregistrer ✓</button>
  </div>
</div>`, '🙏 Journal de gratitude');
}

function saveGratitudeAll() {
  const items = [0,1,2]
    .map(i => document.getElementById(`grat-${i}`)?.value?.trim() || '')
    .filter(Boolean);
  saveGratitude(items);
  closeModal();
  // Mise à jour widget dashboard
  const el = document.getElementById('grat-preview');
  if (el) {
    el.innerHTML = items.length > 0
      ? items.map(t => `<div class="grat-item"><span class="grat-dot">✨</span>${esc(t)}</div>`).join('')
      : `<div class="grat-empty">Touche pour noter tes gratitudes du jour…</div>`;
  }
  const card = document.querySelector('.gratitude-card');
  if (card) card.classList.toggle('grat-filled', items.length > 0);
  if (items.length > 0) showToast('🙏 Gratitudes enregistrées 💛', 2800);
}

// ═══════════════════════════════════════════════════════
//  Service Worker
// ═══════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('[SW] registered', r.scope))
      .catch(e => console.warn('[SW] registration failed', e));
  });
}

// ═══════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════
let _popstateReady = false;

document.addEventListener('DOMContentLoaded', () => {
  // Appliquer les réglages mis en cache localement (avant la réponse Firebase)
  const cfg = LS.cfg();
  if (cfg.dark)     document.body.classList.add('dark');
  if (cfg.fontSize) applyFontSize(cfg.fontSize);

  initSparkles();
  initNotifications();

  // ── Gérer le retour de signInWithRedirect (Google sur mobile) ──
  auth.getRedirectResult().catch(e => {
    if (e.code && e.code !== 'auth/no-current-user') {
      showToast('Erreur Google : ' + (e.message || e.code));
    }
  });

  // ── Auth Firebase ────────────────────────────────────
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Ne pas re-rendre si on est déjà sur la page auth (évite d'effacer les messages)
      if (_page !== 'auth') go('auth');
      return;
    }

    // Bloque les comptes email non vérifiés (Google est toujours vérifié)
    const isEmailPass = user.providerData.some(p => p.providerId === 'password');
    if (isEmailPass && !user.emailVerified) {
      await auth.signOut(); // déclenche à nouveau onAuthStateChanged avec null → go('auth')
      return;
    }

    // Charge les données Firestore dans localStorage
    await FB.loadAll(user.uid);

    // Re-appliquer les réglages (potentiellement mis à jour depuis Firestore)
    const ucfg = LS.cfg();
    if (ucfg.dark)     document.body.classList.add('dark');
    if (ucfg.fontSize) applyFontSize(ucfg.fontSize);

    // Premier accès → choisir prénom + emoji
    if (!ucfg.name) {
      go('onboarding');
      return;
    }

    // Navigation hash
    if (!_popstateReady) {
      _popstateReady = true;
      window.addEventListener('popstate', () => {
        const h = location.hash.slice(1) || 'dashboard';
        go(h);
      });
    }
    const hash  = location.hash.slice(1);
    const valid = ['dashboard','notes','calendar','wellness','tasks'];
    go(valid.includes(hash) ? hash : 'dashboard');
  });
});

// ═══════════════════════════════════════════════════════
//  ONBOARDING — Écran de bienvenue (1er lancement)
// ═══════════════════════════════════════════════════════

function viewOnboarding() {
  const avatars = ['🌸','💫','🌙','🎀','🌺','💕','✨','🦋','🌼','🍀','🎵','💎'];
  return `
<div class="ob-wrap">

  <!-- Logo -->
  <div class="ob-logo">
    <img src="icon.svg" class="ob-icon" alt="Planify">
  </div>

  <!-- Titre -->
  <div class="ob-hero">
    <h1 class="ob-title">Bienvenue sur<br>Planify</h1>
    <p class="ob-sub">Ton espace personnel pour noter, planifier<br>et prendre soin de toi 🌸</p>
    <p class="ob-sub-ar">مرحباً بكِ — مساحتكِ الشخصية</p>
  </div>

  <!-- Prénom -->
  <div class="ob-section">
    <label class="ob-label">Comment tu t'appelles ?</label>
    <input id="ob-name"
           class="ob-input"
           type="text"
           placeholder="Ton prénom…"
           maxlength="24"
           autocomplete="given-name"
           oninput="obPreview(this.value)">
  </div>

  <!-- Avatar emoji -->
  <div class="ob-section">
    <label class="ob-label">Choisis ton emoji ✨</label>
    <div class="ob-avatars">
      ${avatars.map((e,i) => `
        <button class="ob-av ${i===0?'ob-av-sel':''}"
                onclick="obSelectAv(this,'${e}')"
                data-emoji="${e}">${e}</button>
      `).join('')}
    </div>
  </div>

  <!-- Bouton -->
  <button class="ob-btn" id="ob-start" onclick="finishOnboarding()" disabled>
    <span id="ob-btn-txt">Entre ton prénom d'abord</span>
    <span class="ob-btn-arrow">→</span>
  </button>

  <!-- Petit texte -->
  <p class="ob-privacy">Tes données restent sur ton appareil · 100% privé 💕</p>

</div>`;
}

// Sélectionner un avatar
function obSelectAv(btn, emoji) {
  document.querySelectorAll('.ob-av').forEach(b => b.classList.remove('ob-av-sel'));
  btn.classList.add('ob-av-sel');
  window._obEmoji = emoji;
}

// Aperçu live du bouton
function obPreview(val) {
  const btn = document.getElementById('ob-start');
  const txt = document.getElementById('ob-btn-txt');
  if (val.trim().length > 0) {
    btn.disabled = false;
    txt.textContent = `Commencer, ${cap(val.trim())} !`;
  } else {
    btn.disabled = true;
    txt.textContent = "Entre ton prénom d'abord";
  }
}

// Valider et lancer l'app
async function finishOnboarding() {
  const nameInput = document.getElementById('ob-name');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) return;

  const emoji = window._obEmoji || '🌸';

  // Sauvegarder dans la config (LS.s déclenche aussi Firestore via l'intercept)
  const cfg = LS.cfg();
  cfg.name  = cap(name);
  cfg.emoji = emoji;
  LS.s('pl_cfg', cfg);

  // Upload toutes les données locales → Firestore (premier lancement)
  const uid = auth.currentUser?.uid;
  if (uid) {
    await FB.uploadAll(uid);
    await FB.saveProfile(uid, { name: cfg.name, emoji: cfg.emoji, email: auth.currentUser.email });
  }

  // Animation de sortie
  const wrap = document.querySelector('.ob-wrap');
  if (wrap) {
    wrap.style.transition = 'opacity .4s ease, transform .4s ease';
    wrap.style.opacity    = '0';
    wrap.style.transform  = 'scale(1.04)';
  }

  setTimeout(() => {
    const nav = document.getElementById('nav');
    const fab = document.getElementById('fab');
    if (nav) nav.style.display = '';
    if (fab) fab.style.display = '';
    go('dashboard');
  }, 420);
}

// ══════════════════════════════════════════════════════
//  AUTH — Écran connexion / inscription
// ══════════════════════════════════════════════════════
function viewAuth() {
  return `
<div class="ob-wrap" id="auth-wrap">

  <!-- Logo -->
  <div class="ob-logo">
    <img src="apple-touch-icon-180.png" class="ob-icon" alt="Planify">
  </div>

  <!-- Titre -->
  <div class="ob-hero">
    <h1 class="ob-title">Planify</h1>
    <p class="ob-sub">Ton espace personnel pour noter,<br>planifier et prendre soin de toi 🌸</p>
  </div>

  <!-- Onglets -->
  <div class="auth-tabs" id="auth-tabs">
    <button class="auth-tab auth-tab-sel" onclick="authSwitchTab('login')">Connexion</button>
    <button class="auth-tab" onclick="authSwitchTab('register')">Inscription</button>
  </div>

  <!-- Formulaire connexion -->
  <div class="auth-form" id="auth-form-login">
    <input class="ob-input" type="email"    id="auth-email-l" placeholder="Ton email…" autocomplete="email">
    <div class="pw-wrap">
      <input class="ob-input" type="password" id="auth-pass-l" placeholder="Mot de passe…" autocomplete="current-password">
      <button class="pw-toggle" type="button" onclick="togglePw('auth-pass-l',this)" aria-label="Afficher le mot de passe">
        <svg id="eye-l" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>
    <div class="auth-err" id="auth-err-l"></div>
    <button class="ob-btn" onclick="authLogin()">
      <span>Se connecter</span><span class="ob-btn-arrow">→</span>
    </button>
    <button class="auth-forgot-btn" type="button" onclick="authForgotPassword()">Mot de passe oublié ?</button>
  </div>

  <!-- Formulaire inscription -->
  <div class="auth-form auth-form-hide" id="auth-form-register">
    <input class="ob-input" type="email"    id="auth-email-r"  placeholder="Ton email…" autocomplete="email">
    <div class="pw-wrap">
      <input class="ob-input" type="password" id="auth-pass-r"  placeholder="Choisis un mot de passe…" autocomplete="new-password">
      <button class="pw-toggle" type="button" onclick="togglePw('auth-pass-r',this)" aria-label="Afficher le mot de passe">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>
    <div class="pw-wrap">
      <input class="ob-input" type="password" id="auth-pass-r2" placeholder="Confirme le mot de passe…" autocomplete="new-password">
      <button class="pw-toggle" type="button" onclick="togglePw('auth-pass-r2',this)" aria-label="Afficher le mot de passe">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
    </div>
    <div class="auth-err" id="auth-err-r"></div>
    <button class="ob-btn" onclick="authRegister()">
      <span>Créer mon compte</span><span class="ob-btn-arrow">→</span>
    </button>
  </div>

  <!-- Séparateur -->
  <div class="auth-or"><span>ou</span></div>

  <!-- Google Sign-In -->
  <button class="auth-google-btn" onclick="authGoogle()">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.092 17.64 11.784 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
    Continuer avec Google
  </button>

  <p class="ob-privacy">Tes données sont chiffrées et privées 🔒</p>

</div>`;
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerHTML = show
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  btn.style.color = show ? 'rgba(196,119,142,.9)' : '';
}

function authSwitchTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const fl   = document.getElementById('auth-form-login');
  const fr   = document.getElementById('auth-form-register');
  if (tab === 'login') {
    tabs[0].classList.add('auth-tab-sel');
    tabs[1].classList.remove('auth-tab-sel');
    fl.classList.remove('auth-form-hide');
    fr.classList.add('auth-form-hide');
  } else {
    tabs[1].classList.add('auth-tab-sel');
    tabs[0].classList.remove('auth-tab-sel');
    fr.classList.remove('auth-form-hide');
    fl.classList.add('auth-form-hide');
  }
}

async function authLogin() {
  const email = document.getElementById('auth-email-l')?.value?.trim();
  const pass  = document.getElementById('auth-pass-l')?.value;
  const err   = document.getElementById('auth-err-l');
  const btn   = document.querySelector('#auth-form-login .ob-btn');
  if (!email || !pass) { if (err) { err.className='auth-err'; err.textContent='Remplis tous les champs.'; } return; }
  if (err) { err.className = 'auth-err'; err.textContent = ''; }
  if (btn) btn.disabled = true;
  try {
    await FB.signIn(email, pass);
    const user = auth.currentUser;
    // Vérifie que l'email est bien confirmé
    if (user && !user.emailVerified) {
      await auth.signOut();
      if (err) {
        err.className = 'auth-err';
        err.innerHTML = '📧 Email non vérifié. Vérifie ta boîte mail (et tes <b>spams</b>) !'
          + '<br><button class="auth-resend-btn" onclick="authResendVerification()">Renvoyer l\'email</button>';
      }
      return;
    }
    // auth.onAuthStateChanged prend le relais
  } catch (e) {
    if (err) { err.className = 'auth-err'; err.textContent = authErrMsg(e.code); }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function authResendVerification() {
  const email = document.getElementById('auth-email-l')?.value?.trim();
  const pass  = document.getElementById('auth-pass-l')?.value;
  const err   = document.getElementById('auth-err-l');
  if (!email || !pass) { if (err) err.textContent = 'Remplis email et mot de passe d\'abord.'; return; }
  try {
    const cred = await FB.signIn(email, pass);
    await cred.user.sendEmailVerification();
    await auth.signOut();
    if (err) { err.className = 'auth-err auth-err-ok'; err.textContent = '✅ Email renvoyé ! Vérifie ta boîte mail et tes spams.'; }
  } catch (e) {
    if (err) { err.className = 'auth-err'; err.textContent = authErrMsg(e.code); }
  }
}

async function authRegister() {
  const email = document.getElementById('auth-email-r')?.value?.trim();
  const pass  = document.getElementById('auth-pass-r')?.value;
  const pass2 = document.getElementById('auth-pass-r2')?.value;
  const err   = document.getElementById('auth-err-r');
  const btn   = document.querySelector('#auth-form-register .ob-btn');
  if (!email || !pass)   { if (err) { err.className='auth-err'; err.textContent='Remplis tous les champs.'; } return; }
  if (pass !== pass2)    { if (err) { err.className='auth-err'; err.textContent='Les mots de passe ne correspondent pas.'; } return; }
  if (pass.length < 6)   { if (err) { err.className='auth-err'; err.textContent='Mot de passe trop court (min. 6 caractères).'; } return; }
  if (btn) btn.disabled = true;
  if (err) { err.className='auth-err'; err.textContent=''; }
  try {
    const cred = await FB.signUp(email, pass);
    await cred.user.sendEmailVerification();
    await auth.signOut(); // bloque l'accès jusqu'à vérification
    authSwitchTab('login'); // on bascule sur l'onglet connexion
    const errLogin = document.getElementById('auth-err-l');
    if (errLogin) {
      errLogin.className = 'auth-err auth-err-ok';
      errLogin.textContent = '✅ Email envoyé à ' + email + ' ! Clique sur le lien puis reviens ici. (Vérifie aussi tes spams si tu ne le reçois pas)';
    }
  } catch (e) {
    if (err) { err.className = 'auth-err'; err.textContent = authErrMsg(e.code); }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function authForgotPassword() {
  const email = document.getElementById('auth-email-l')?.value?.trim();
  const err   = document.getElementById('auth-err-l');
  const btn   = document.querySelector('.auth-forgot-btn');
  if (!email) {
    if (err) { err.className = 'auth-err'; err.textContent = 'Entre ton email d\'abord puis clique ici.'; }
    return;
  }
  if (btn) btn.disabled = true;
  if (err) { err.className = 'auth-err'; err.textContent = '⏳ Envoi en cours…'; }
  try {
    await auth.sendPasswordResetEmail(email);
    if (err) {
      err.className = 'auth-err auth-err-ok';
      err.textContent = '✅ Email envoyé à ' + email + ' ! Clique sur le lien pour choisir un nouveau mot de passe (vérifie tes spams).';
    }
  } catch (e) {
    if (err) { err.className = 'auth-err'; err.textContent = authErrMsg(e.code); }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function authGoogle() {
  try {
    await FB.signInGoogle();
    // auth.onAuthStateChanged prend le relais
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
      // Popup bloquée → fallback redirect
      try {
        const prov = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithRedirect(prov);
      } catch (e2) {
        showToast('Erreur Google : ' + authErrMsg(e2.code));
      }
    } else if (e.code) {
      showToast('Erreur Google : ' + authErrMsg(e.code));
    }
  }
}

function authErrMsg(code) {
  const msgs = {
    'auth/user-not-found':                          'Compte introuvable. Inscris-toi !',
    'auth/wrong-password':                          'Mot de passe incorrect.',
    'auth/invalid-credential':                      'Email ou mot de passe incorrect.',
    'auth/email-already-in-use':                    'Cet email est déjà utilisé.',
    'auth/invalid-email':                           'Email invalide.',
    'auth/weak-password':                           'Mot de passe trop faible.',
    'auth/too-many-requests':                       'Trop de tentatives. Réessaie dans quelques minutes.',
    'auth/network-request-failed':                  'Pas de connexion internet.',
    'auth/popup-blocked':                           'Popup bloquée par le navigateur. Autorise les popups ou réessaie.',
    'auth/popup-closed-by-user':                    'Connexion Google annulée.',
    'auth/cancelled-popup-request':                 'Connexion Google annulée.',
    'auth/account-exists-with-different-credential':'Un compte existe déjà avec cet email. Essaie de te connecter par email/mot de passe.',
    'auth/unauthorized-domain':                     'Domaine non autorisé dans Firebase. Contacte l\'administrateur.',
    'auth/user-disabled':                           'Ce compte a été désactivé.',
    'auth/operation-not-allowed':                   'Cette méthode de connexion n\'est pas activée.',
    'auth/requires-recent-login':                   'Reconnecte-toi d\'abord pour effectuer cette action.',
  };
  return msgs[code] || ('Erreur : ' + code);
}

// Changement de mot de passe (appelé depuis les settings)
function openChangePasswordModal() {
  const eyeSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  openModal(`
<div style="padding:.25rem 0">
  <div class="form-group">
    <label class="form-label">Mot de passe actuel</label>
    <div class="pw-wrap">
      <input class="form-input" type="password" id="cp-old" placeholder="Mot de passe actuel…" autocomplete="current-password">
      <button class="pw-toggle" type="button" onclick="togglePw('cp-old',this)" aria-label="Voir">${eyeSvg}</button>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Nouveau mot de passe</label>
    <div class="pw-wrap">
      <input class="form-input" type="password" id="cp-new" placeholder="Nouveau mot de passe…" autocomplete="new-password">
      <button class="pw-toggle" type="button" onclick="togglePw('cp-new',this)" aria-label="Voir">${eyeSvg}</button>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Confirmer le nouveau mot de passe</label>
    <div class="pw-wrap">
      <input class="form-input" type="password" id="cp-new2" placeholder="Confirme…" autocomplete="new-password">
      <button class="pw-toggle" type="button" onclick="togglePw('cp-new2',this)" aria-label="Voir">${eyeSvg}</button>
    </div>
  </div>
  <div class="auth-err" id="cp-err" style="margin:.5rem 0 0"></div>
  <button class="btn btn-full" onclick="changePassword()" style="margin-top:.75rem">Changer le mot de passe</button>
</div>`, 'Changer le mot de passe');
}

async function changePassword() {
  const oldPass = document.getElementById('cp-old')?.value;
  const newPass = document.getElementById('cp-new')?.value;
  const newPass2 = document.getElementById('cp-new2')?.value;
  const err = document.getElementById('cp-err');
  if (!oldPass || !newPass || !newPass2) {
    if (err) { err.className = 'auth-err'; err.textContent = 'Remplis tous les champs.'; }
    return;
  }
  if (newPass !== newPass2) {
    if (err) { err.className = 'auth-err'; err.textContent = 'Les nouveaux mots de passe ne correspondent pas.'; }
    return;
  }
  if (newPass.length < 6) {
    if (err) { err.className = 'auth-err'; err.textContent = 'Mot de passe trop court (min. 6 caractères).'; }
    return;
  }
  if (err) { err.className = 'auth-err'; err.textContent = '⏳ Changement en cours…'; }
  const btn = document.querySelector('#modal-inner .btn');
  if (btn) btn.disabled = true;
  try {
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPass);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPass);
    closeModal();
    showToast('✅ Mot de passe modifié avec succès !');
  } catch (e) {
    if (err) { err.className = 'auth-err'; err.textContent = authErrMsg(e.code); }
    if (btn) btn.disabled = false;
  }
}

// Déconnexion (appelée depuis les settings)
function signOutUser() {
  if (!confirm('Se déconnecter de Planify ?')) return;
  FB.signOut().then(() => {
    // Vider le localStorage de cette session
    ['pl_subjects','pl_notes','pl_events','pl_ics','pl_moods','pl_habits',
     'pl_hlogs','pl_cycle','pl_cyclecfg','pl_lists','pl_todos','pl_cfg',
     'pl_water','pl_focus','pl_gratitude','pl_wgoals'].forEach(k =>
      localStorage.removeItem(k));
    go('auth');
  });
}
